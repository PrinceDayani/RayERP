import { Request, Response } from 'express';
import ResourceAllocation from '../models/ResourceAllocation';
import Employee, { SkillLevel, ISkill } from '../models/Employee';
import Project, { SkillLevel as ProjectSkillLevel } from '../models/Project';
import Task from '../models/Task';
import Department from '../models/Department';
import mongoose from 'mongoose';

export const allocateResource = async (req: Request, res: Response) => {
  try {
    // Validate allocation before creating
    const { employee, allocatedHours, startDate, endDate } = req.body;
    
    // Check for conflicts
    const existingAllocations = await ResourceAllocation.find({
      employee,
      status: { $in: ['active', 'planned'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });
    
    const totalHours = existingAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0) + allocatedHours;
    
    if (totalHours > 60) {
      return res.status(400).json({ 
        message: 'Allocation exceeds maximum allowed hours (60h/week)',
        totalHours,
        conflicts: existingAllocations
      });
    }
    
    // Calculate utilization rate
    const utilizationRate = Math.min(100, (allocatedHours / 40) * 100);
    
    const allocation = new ResourceAllocation({
      ...req.body,
      utilizationRate
    });
    
    await allocation.save();
    await allocation.populate(['employee', 'project']);
    
    // Add warning if over-allocated
    const response: any = { allocation };
    if (totalHours > 40) {
      response.warning = `Employee is over-allocated by ${totalHours - 40} hours`;
    }
    
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getResourceAllocations = async (req: Request, res: Response) => {
  try {
    const { 
      projectId, 
      employeeId, 
      status, 
      department, 
      role, 
      startDate, 
      endDate,
      search,
      minUtilization,
      maxUtilization
    } = req.query;
    
    const filter: any = {};
    if (projectId) filter.project = projectId;
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;
    if (role) filter.role = { $regex: role, $options: 'i' };
    
    // Date range filter
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ];
    }

    let allocations = await ResourceAllocation.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName email position skills department',
        populate: { path: 'department', select: 'name' }
      })
      .populate('project', 'name status startDate endDate')
      .sort({ startDate: -1 });

    // Apply additional filters
    if (department) {
      allocations = allocations.filter(alloc => 
        (alloc.employee as any).department?.name === department
      );
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      allocations = allocations.filter(alloc => 
        (alloc.employee as any).firstName.toLowerCase().includes(searchLower) ||
        (alloc.employee as any).lastName.toLowerCase().includes(searchLower) ||
        (alloc.project as any).name.toLowerCase().includes(searchLower) ||
        alloc.role.toLowerCase().includes(searchLower)
      );
    }
    
    if (minUtilization || maxUtilization) {
      allocations = allocations.filter(alloc => {
        const utilization = (alloc.allocatedHours / 40) * 100;
        if (minUtilization && utilization < parseInt(minUtilization as string)) return false;
        if (maxUtilization && utilization > parseInt(maxUtilization as string)) return false;
        return true;
      });
    }
    
    res.json(allocations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResourceAllocation = async (req: Request, res: Response) => {
  try {
    const { allocatedHours, startDate, endDate, employee } = req.body;
    
    // If updating critical fields, validate conflicts
    if (allocatedHours || startDate || endDate || employee) {
      const currentAllocation = await ResourceAllocation.findById(req.params.id);
      if (!currentAllocation) {
        return res.status(404).json({ message: 'Allocation not found' });
      }
      
      const empId = employee || currentAllocation.employee;
      const hours = allocatedHours || currentAllocation.allocatedHours;
      const start = startDate || currentAllocation.startDate;
      const end = endDate || currentAllocation.endDate;
      
      // Check conflicts excluding current allocation
      const existingAllocations = await ResourceAllocation.find({
        _id: { $ne: req.params.id },
        employee: empId,
        status: { $in: ['active', 'planned'] },
        $or: [
          { startDate: { $lte: new Date(end) }, endDate: { $gte: new Date(start) } }
        ]
      });
      
      const totalHours = existingAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0) + hours;
      
      if (totalHours > 60) {
        return res.status(400).json({ 
          message: 'Update would exceed maximum allowed hours (60h/week)',
          totalHours,
          conflicts: existingAllocations
        });
      }
      
      // Update utilization rate
      req.body.utilizationRate = Math.min(100, (hours / 40) * 100);
    }
    
    const allocation = await ResourceAllocation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['employee', 'project']);
    
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    
    res.json(allocation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteResourceAllocation = async (req: Request, res: Response) => {
  try {
    const allocation = await ResourceAllocation.findByIdAndDelete(req.params.id);
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    res.json({ message: 'Allocation deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const filter: any = { employee: employeeId };
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ];
    }

    const allocations = await ResourceAllocation.find(filter).populate('project', 'name');
    const totalHours = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
    const avgUtilization = allocations.length > 0 
      ? allocations.reduce((sum, a) => sum + a.utilizationRate, 0) / allocations.length 
      : 0;

    res.json({ totalHours, avgUtilization, allocations });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const detectResourceConflicts = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const conflicts = await ResourceAllocation.find({
      employee: employeeId,
      status: { $in: ['active', 'planned'] },
      $or: [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ]
    }).populate('project', 'name priority');

    const totalAllocated = conflicts.reduce((sum, c) => sum + c.allocatedHours, 0);
    const hasConflict = totalAllocated > 40;
    
    // Enhanced conflict analysis
    const conflictDetails = [];
    for (let i = 0; i < conflicts.length; i++) {
      for (let j = i + 1; j < conflicts.length; j++) {
        const alloc1 = conflicts[i];
        const alloc2 = conflicts[j];
        
        // Check for exact date overlaps
        const overlap = alloc1.startDate <= alloc2.endDate && alloc1.endDate >= alloc2.startDate;
        if (overlap) {
          const overlapStart = new Date(Math.max(alloc1.startDate.getTime(), alloc2.startDate.getTime()));
          const overlapEnd = new Date(Math.min(alloc1.endDate.getTime(), alloc2.endDate.getTime()));
          const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
          
          conflictDetails.push({
            allocation1: alloc1,
            allocation2: alloc2,
            overlapDays,
            overlapStart,
            overlapEnd,
            totalHours: alloc1.allocatedHours + alloc2.allocatedHours
          });
        }
      }
    }

    res.json({ 
      hasConflict, 
      totalAllocated, 
      conflicts,
      conflictDetails,
      overAllocation: Math.max(0, totalAllocated - 40),
      utilizationPercentage: Math.round((totalAllocated / 40) * 100)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCapacityPlanning = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department, position } = req.query;
    
    const employeeFilter: any = { status: 'active' };
    if (department) employeeFilter.department = department;
    if (position) employeeFilter.position = { $regex: position, $options: 'i' };
    
    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name');
      
    const planning = await Promise.all(employees.map(async (emp) => {
      const allocations = await ResourceAllocation.find({
        employee: emp._id,
        status: { $in: ['active', 'planned'] },
        startDate: { $lte: new Date(endDate as string) },
        endDate: { $gte: new Date(startDate as string) }
      }).populate('project', 'name status');

      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
      const capacity = 40;
      const available = Math.max(0, capacity - totalAllocated);
      const utilizationRate = (totalAllocated / capacity) * 100;
      
      // Determine status
      let status = 'available';
      if (utilizationRate > 100) status = 'over';
      else if (utilizationRate >= 80) status = 'full';
      else if (utilizationRate > 0) status = 'partial';

      return {
        employee: { 
          _id: emp._id, 
          name: `${emp.firstName} ${emp.lastName}`, 
          position: emp.position, 
          department: (emp.department as any)?.name,
          skills: emp.skills 
        },
        capacity,
        allocated: totalAllocated,
        available,
        utilizationRate: Math.round(utilizationRate),
        status,
        allocations: allocations.map(alloc => ({
          _id: alloc._id,
          project: alloc.project,
          hours: alloc.allocatedHours,
          role: alloc.role,
          startDate: alloc.startDate,
          endDate: alloc.endDate
        })),
        overAllocation: Math.max(0, totalAllocated - capacity)
      };
    }));

    // Sort by utilization rate (highest first)
    planning.sort((a, b) => b.utilizationRate - a.utilizationRate);

    res.json(planning);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSkillMatrix = async (req: Request, res: Response) => {
  try {
    const { employee, skill, department, level, search } = req.query;
    
    // Build filter for employees
    const employeeFilter: any = { status: 'active' };
    if (employee) employeeFilter._id = employee;
    if (department) employeeFilter.department = department;
    if (search) {
      employeeFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(employeeFilter, 'firstName lastName position department skills skillsEnhanced');
    
    // Get all skills from both legacy and enhanced fields
    const allSkillsSet = new Set<string>();
    employees.forEach(emp => {
      // Legacy skills
      emp.skills?.forEach(skill => allSkillsSet.add(skill));
      // Enhanced skills
      emp.skillsEnhanced?.forEach(skillObj => allSkillsSet.add(skillObj.skill));
    });
    
    const allSkills = Array.from(allSkillsSet);
    
    // Filter by specific skill if requested
    const filteredSkills = skill ? allSkills.filter(s => s === skill) : allSkills;
    
    const matrix = employees.map(emp => {
      const employeeSkills = filteredSkills.map(skillName => {
        // Check enhanced skills first
        const enhancedSkill = emp.skillsEnhanced?.find(s => s.skill === skillName);
        if (enhancedSkill) {
          return {
            skill: skillName,
            level: enhancedSkill.level,
            yearsOfExperience: enhancedSkill.yearsOfExperience,
            lastUpdated: enhancedSkill.lastUpdated
          };
        }
        
        // Fallback to legacy skills
        const hasLegacySkill = emp.skills?.includes(skillName);
        return {
          skill: skillName,
          level: hasLegacySkill ? 'Intermediate' as SkillLevel : null,
          yearsOfExperience: undefined,
          lastUpdated: undefined
        };
      });
      
      // Filter by level if requested
      const filteredEmployeeSkills = level 
        ? employeeSkills.filter(s => s.level === level)
        : employeeSkills;
      
      return {
        employee: { 
          _id: emp._id, 
          name: `${emp.firstName} ${emp.lastName}`, 
          position: emp.position,
          department: emp.department
        },
        skills: filteredEmployeeSkills
      };
    });

    res.json({ matrix, allSkills: filteredSkills });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEmployeeSkill = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { skill, level, yearsOfExperience } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Initialize skillsEnhanced if it doesn't exist
    if (!employee.skillsEnhanced) {
      employee.skillsEnhanced = [];
    }
    
    // Find existing skill or create new one
    const existingSkillIndex = employee.skillsEnhanced.findIndex(s => s.skill === skill);
    
    if (level === null || level === '') {
      // Remove skill if level is null/empty
      if (existingSkillIndex > -1) {
        employee.skillsEnhanced.splice(existingSkillIndex, 1);
      }
      // Also remove from legacy skills
      employee.skills = employee.skills?.filter(s => s !== skill) || [];
    } else {
      const skillData: ISkill = {
        skill,
        level: level as SkillLevel,
        yearsOfExperience,
        lastUpdated: new Date()
      };
      
      if (existingSkillIndex > -1) {
        employee.skillsEnhanced[existingSkillIndex] = skillData;
      } else {
        employee.skillsEnhanced.push(skillData);
      }
      
      // Also update legacy skills for backward compatibility
      if (!employee.skills?.includes(skill)) {
        employee.skills = [...(employee.skills || []), skill];
      }
    }
    
    await employee.save();
    res.json({ message: 'Skill updated successfully', employee });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSkillGapAnalysis = async (req: Request, res: Response) => {
  try {
    const { department, position } = req.query;
    
    const employeeFilter: any = { status: 'active' };
    if (department) employeeFilter.department = department;
    if (position) employeeFilter.position = position;
    
    const employees = await Employee.find(employeeFilter, 'firstName lastName position department skillsEnhanced');
    
    // Get all skills and their common levels from the system
    const allEmployees = await Employee.find({ status: 'active' }, 'skillsEnhanced');
    const skillLevelMap = new Map<string, SkillLevel[]>();
    
    allEmployees.forEach(emp => {
      emp.skillsEnhanced?.forEach(skill => {
        if (!skillLevelMap.has(skill.skill)) {
          skillLevelMap.set(skill.skill, []);
        }
        skillLevelMap.get(skill.skill)!.push(skill.level);
      });
    });
    
    // Calculate expected levels (most common level for each skill)
    const expectedLevels = new Map<string, SkillLevel>();
    skillLevelMap.forEach((levels, skill) => {
      const levelCounts = levels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<SkillLevel, number>);
      
      const mostCommonLevel = Object.entries(levelCounts)
        .sort(([,a], [,b]) => b - a)[0][0] as SkillLevel;
      expectedLevels.set(skill, mostCommonLevel);
    });
    
    const gapAnalysis = employees.map(emp => {
      const empSkills = new Map(emp.skillsEnhanced?.map(s => [s.skill, s.level]) || []);
      const allSkills = Array.from(expectedLevels.keys());
      
      const missingSkills = allSkills.filter(skill => !empSkills.has(skill));
      const weakSkills = allSkills
        .filter(skill => empSkills.has(skill))
        .map(skill => {
          const currentLevel = empSkills.get(skill)!;
          const requiredLevel = expectedLevels.get(skill)!;
          return { skill, currentLevel, requiredLevel };
        })
        .filter(({ currentLevel, requiredLevel }) => {
          const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          return levels.indexOf(currentLevel) < levels.indexOf(requiredLevel);
        });
      
      const strongSkills = allSkills
        .filter(skill => empSkills.has(skill))
        .map(skill => ({ skill, level: empSkills.get(skill)! }))
        .filter(({ skill, level }) => {
          const requiredLevel = expectedLevels.get(skill)!;
          const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          return levels.indexOf(level) >= levels.indexOf(requiredLevel);
        });
      
      return {
        employee: {
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          department: emp.department
        },
        missingSkills,
        weakSkills,
        strongSkills
      };
    });
    
    res.json(gapAnalysis);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectSkillMatch = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId, 'name requiredSkills');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const employees = await Employee.find({ status: 'active' }, 'firstName lastName position skillsEnhanced');
    
    const matches = employees.map(emp => {
      const empSkills = new Map(emp.skillsEnhanced?.map(s => [s.skill, s.level]) || []);
      const requiredSkills = project.requiredSkills || [];
      
      if (requiredSkills.length === 0) {
        return {
          employee: {
            _id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.position
          },
          matchPercentage: 100,
          matchedSkills: [],
          missingSkills: []
        };
      }
      
      const matchedSkills = [];
      const missingSkills = [];
      
      for (const reqSkill of requiredSkills) {
        if (empSkills.has(reqSkill.skill)) {
          const empLevel = empSkills.get(reqSkill.skill)!;
          matchedSkills.push({
            skill: reqSkill.skill,
            level: empLevel,
            required: reqSkill.level
          });
        } else {
          missingSkills.push(reqSkill.skill);
        }
      }
      
      // Calculate match percentage based on skill coverage and level matching
      const skillCoverage = (matchedSkills.length / requiredSkills.length) * 100;
      
      // Calculate level matching bonus
      const levelMatches = matchedSkills.filter(skill => {
        const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        return levels.indexOf(skill.level) >= levels.indexOf(skill.required);
      }).length;
      
      const levelBonus = matchedSkills.length > 0 ? (levelMatches / matchedSkills.length) * 20 : 0;
      const matchPercentage = Math.min(100, skillCoverage + levelBonus);
      
      return {
        employee: {
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position
        },
        matchPercentage: Math.round(matchPercentage),
        matchedSkills,
        missingSkills
      };
    });
    
    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSkillDistribution = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({ status: 'active' }, 'skillsEnhanced');
    
    const skillStats = new Map<string, { Beginner: number; Intermediate: number; Advanced: number; Expert: number }>();
    
    employees.forEach(emp => {
      emp.skillsEnhanced?.forEach(skill => {
        if (!skillStats.has(skill.skill)) {
          skillStats.set(skill.skill, { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 });
        }
        skillStats.get(skill.skill)![skill.level]++;
      });
    });
    
    const distribution = Array.from(skillStats.entries()).map(([skill, levels]) => ({
      skill,
      levels,
      totalEmployees: Object.values(levels).reduce((sum, count) => sum + count, 0)
    }));
    
    res.json(distribution);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSkillStrengthAnalysis = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({ status: 'active' }, 'department skillsEnhanced');
    
    // Team-wide skill strength
    const teamSkillStats = new Map<string, { total: number; weighted: number }>();
    
    // Department-wise skill strength
    const departmentStats = new Map<string, Map<string, { total: number; weighted: number }>>();
    
    const levelWeights = { Beginner: 1, Intermediate: 2, Advanced: 3, Expert: 4 };
    
    employees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, new Map());
      }
      
      emp.skillsEnhanced?.forEach(skill => {
        const weight = levelWeights[skill.level];
        
        // Team stats
        if (!teamSkillStats.has(skill.skill)) {
          teamSkillStats.set(skill.skill, { total: 0, weighted: 0 });
        }
        const teamStat = teamSkillStats.get(skill.skill)!;
        teamStat.total++;
        teamStat.weighted += weight;
        
        // Department stats
        const deptMap = departmentStats.get(dept)!;
        if (!deptMap.has(skill.skill)) {
          deptMap.set(skill.skill, { total: 0, weighted: 0 });
        }
        const deptStat = deptMap.get(skill.skill)!;
        deptStat.total++;
        deptStat.weighted += weight;
      });
    });
    
    // Calculate strength percentages
    const teamStrength = Array.from(teamSkillStats.entries()).map(([skill, stats]) => ({
      skill,
      averageLevel: stats.weighted / stats.total,
      employeeCount: stats.total,
      strengthPercentage: (stats.weighted / (stats.total * 4)) * 100
    }));
    
    const departmentStrength = Array.from(departmentStats.entries()).map(([dept, skillMap]) => ({
      department: dept,
      skills: Array.from(skillMap.entries()).map(([skill, stats]) => ({
        skill,
        averageLevel: stats.weighted / stats.total,
        employeeCount: stats.total,
        strengthPercentage: (stats.weighted / (stats.total * 4)) * 100
      }))
    }));
    
    res.json({ teamStrength, departmentStrength });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTimeTracking = async (req: Request, res: Response) => {
  try {
    const { employeeId, projectId, startDate, endDate } = req.query;
    const filter: any = {};
    if (employeeId) filter.assignedTo = employeeId;
    if (projectId) filter.project = projectId;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('project', 'name')
      .select('title estimatedHours actualHours status');

    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const variance = totalActual - totalEstimated;

    res.json({ totalEstimated, totalActual, variance, tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Enhanced allocation management endpoints
export const getAllocationConflicts = async (req: Request, res: Response) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const filter: any = { status: { $in: ['active', 'planned'] } };
    
    if (employeeId) filter.employee = employeeId;
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ];
    }

    const allocations = await ResourceAllocation.find(filter)
      .populate('employee', 'firstName lastName position')
      .populate('project', 'name priority')
      .sort({ employee: 1, startDate: 1 });

    // Group by employee and detect conflicts
    const employeeGroups = new Map();
    allocations.forEach(alloc => {
      const empId = alloc.employee._id.toString();
      if (!employeeGroups.has(empId)) {
        employeeGroups.set(empId, { employee: alloc.employee, allocations: [] });
      }
      employeeGroups.get(empId).allocations.push(alloc);
    });

    const conflicts = [];
    for (const [empId, group] of employeeGroups) {
      const empAllocations = group.allocations;
      const empConflicts = [];
      let totalOverallocation = 0;

      // Check for overlapping allocations
      for (let i = 0; i < empAllocations.length; i++) {
        for (let j = i + 1; j < empAllocations.length; j++) {
          const alloc1 = empAllocations[i];
          const alloc2 = empAllocations[j];
          
          // Check for date overlap
          const overlap = alloc1.startDate <= alloc2.endDate && alloc1.endDate >= alloc2.startDate;
          if (overlap) {
            const overlapStart = new Date(Math.max(alloc1.startDate.getTime(), alloc2.startDate.getTime()));
            const overlapEnd = new Date(Math.min(alloc1.endDate.getTime(), alloc2.endDate.getTime()));
            const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
            const totalHours = alloc1.allocatedHours + alloc2.allocatedHours;
            
            let severity = 'low';
            if (totalHours > 60) severity = 'critical';
            else if (totalHours > 50) severity = 'high';
            else if (totalHours > 40) severity = 'medium';

            empConflicts.push({
              allocation1: alloc1,
              allocation2: alloc2,
              overlapDays,
              totalHours,
              conflictType: totalHours > 40 ? 'over_allocation' : 'time_overlap',
              severity
            });

            if (totalHours > 40) {
              totalOverallocation += totalHours - 40;
            }
          }
        }
      }

      if (empConflicts.length > 0) {
        conflicts.push({
          _id: empId,
          employee: group.employee,
          conflicts: empConflicts,
          totalConflicts: empConflicts.length,
          totalOverallocation
        });
      }
    }

    res.json(conflicts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeSummary = async (req: Request, res: Response) => {
  try {
    const { departmentId, startDate, endDate } = req.query;
    const employeeFilter: any = { status: 'active' };
    if (departmentId) employeeFilter.department = departmentId;

    const employees = await Employee.find(employeeFilter)
      .populate('department', 'name')
      .select('firstName lastName position department');

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.$or = [
        { startDate: { $lte: new Date(endDate as string) }, endDate: { $gte: new Date(startDate as string) } }
      ];
    }

    const summaries = await Promise.all(employees.map(async (emp) => {
      const allocations = await ResourceAllocation.find({
        employee: emp._id,
        status: { $in: ['active', 'planned'] },
        ...dateFilter
      }).populate('project', 'name');

      const totalHours = 40; // Standard work week
      const bookedHours = allocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
      const utilizationPercentage = Math.round((bookedHours / totalHours) * 100);
      
      let status = 'available';
      if (utilizationPercentage > 100) status = 'over';
      else if (utilizationPercentage >= 80) status = 'full';
      else if (utilizationPercentage > 0) status = 'partial';

      // Check for conflicts
      const conflicts = await ResourceAllocation.countDocuments({
        employee: emp._id,
        status: { $in: ['active', 'planned'] },
        ...dateFilter
      });

      return {
        _id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        department: (emp.department as any)?.name,
        totalHours,
        bookedHours,
        freeHours: Math.max(0, totalHours - bookedHours),
        utilizationPercentage,
        allocations: allocations.map(alloc => ({
          project: (alloc.project as any)?.name || alloc.project,
          hours: alloc.allocatedHours,
          role: alloc.role
        })),
        conflicts: conflicts > 1 ? conflicts - 1 : 0, // Subtract 1 as having 1 allocation is not a conflict
        status
      };
    }));

    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const exportAllocations = async (req: Request, res: Response) => {
  try {
    const { format, dateRange, includeFields, groupBy, filters } = req.body;
    
    // Build query filter
    const filter: any = {};
    if (filters.department) filter['employee.department'] = filters.department;
    if (filters.project) filter.project = filters.project;
    if (filters.employee) filter.employee = filters.employee;
    if (filters.status) filter.status = filters.status;
    if (dateRange.from && dateRange.to) {
      filter.$or = [
        { startDate: { $lte: new Date(dateRange.to) }, endDate: { $gte: new Date(dateRange.from) } }
      ];
    }

    const allocations = await ResourceAllocation.find(filter)
      .populate('employee', 'firstName lastName position department')
      .populate('project', 'name status')
      .sort({ startDate: -1 });

    // Transform data based on includeFields
    const exportData = allocations.map(alloc => {
      const row: any = {};
      if (includeFields.employee) row.employee = `${(alloc.employee as any).firstName} ${(alloc.employee as any).lastName}`;
      if (includeFields.project) row.project = (alloc.project as any).name;
      if (includeFields.hours) row.allocatedHours = alloc.allocatedHours;
      if (includeFields.dates) {
        row.startDate = alloc.startDate.toISOString().split('T')[0];
        row.endDate = alloc.endDate.toISOString().split('T')[0];
      }
      if (includeFields.role) row.role = alloc.role;
      if (includeFields.status) row.status = alloc.status;
      if (includeFields.utilization) row.utilizationRate = alloc.utilizationRate;
      return row;
    });

    // Group data if requested
    let finalData = exportData;
    if (groupBy !== 'none') {
      const grouped = exportData.reduce((acc, row) => {
        const key = row[groupBy] || 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});
      finalData = grouped;
    }

    // For now, return JSON data (implement actual file generation based on format)
    res.json({
      format,
      data: finalData,
      totalRecords: exportData.length,
      exportedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkUpdateAllocations = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    
    const results = await Promise.all(updates.map(async (update: any) => {
      try {
        const allocation = await ResourceAllocation.findByIdAndUpdate(
          update.id,
          update.data,
          { new: true, runValidators: true }
        ).populate(['employee', 'project']);
        return { id: update.id, success: true, allocation };
      } catch (error: any) {
        return { id: update.id, success: false, error: error.message };
      }
    }));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      message: `Bulk update completed: ${successful} successful, ${failed} failed`,
      results,
      summary: { successful, failed, total: updates.length }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGanttData = async (req: Request, res: Response) => {
  try {
    const { projectIds, startDate, endDate } = req.query;
    
    const projectFilter: any = { status: { $in: ['active', 'planned'] } };
    if (projectIds) {
      const ids = Array.isArray(projectIds) ? projectIds : [projectIds];
      projectFilter._id = { $in: ids };
    }

    const projects = await Project.find(projectFilter)
      .select('name startDate endDate status progress priority')
      .sort({ startDate: 1 });

    const ganttTasks = await Promise.all(projects.map(async (project) => {
      const allocations = await ResourceAllocation.find({
        project: project._id,
        status: { $in: ['active', 'planned'] }
      }).populate('employee', 'firstName lastName');

      return {
        _id: project._id,
        name: project.name,
        startDate: project.startDate || new Date(),
        endDate: project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progress: project.progress || 0,
        resources: allocations.map(alloc => ({
          employee: alloc.employee,
          allocatedHours: alloc.allocatedHours,
          role: alloc.role
        })),
        dependencies: [], // TODO: Implement project dependencies
        status: project.status || 'in_progress',
        project: {
          _id: project._id,
          name: project.name
        }
      };
    }));

    res.json(ganttTasks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Allocation limits and validation
export const validateAllocation = async (req: Request, res: Response) => {
  try {
    const { employeeId, allocatedHours, startDate, endDate, excludeId } = req.body;
    
    // Check existing allocations for the employee in the date range
    const filter: any = {
      employee: employeeId,
      status: { $in: ['active', 'planned'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    };
    
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existingAllocations = await ResourceAllocation.find(filter);
    const totalExistingHours = existingAllocations.reduce((sum, alloc) => sum + alloc.allocatedHours, 0);
    const totalHours = totalExistingHours + allocatedHours;
    
    const validation = {
      isValid: totalHours <= 40,
      totalHours,
      availableHours: Math.max(0, 40 - totalExistingHours),
      overAllocation: Math.max(0, totalHours - 40),
      conflicts: existingAllocations.map(alloc => ({
        project: alloc.project,
        hours: alloc.allocatedHours,
        startDate: alloc.startDate,
        endDate: alloc.endDate
      })),
      warnings: []
    };
    
    if (totalHours > 40) {
      validation.warnings.push(`Over-allocation detected: ${totalHours - 40} hours above capacity`);
    }
    
    if (totalHours > 50) {
      validation.warnings.push('Critical over-allocation may cause burnout');
    }

    res.json(validation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
