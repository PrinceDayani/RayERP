import '../models/employee.dart';
import '../models/project.dart';
import 'api_service.dart';

class ResourceAllocation {
  final String employeeId;
  final String employeeName;
  final String projectId;
  final String projectName;
  final DateTime startDate;
  final DateTime endDate;
  final double utilizationPct;

  ResourceAllocation({
    required this.employeeId,
    required this.employeeName,
    required this.projectId,
    required this.projectName,
    required this.startDate,
    required this.endDate,
    required this.utilizationPct,
  });
}

class EmployeeCapacity {
  final Employee employee;
  final List<ProjectWithAlloc> projects;

  EmployeeCapacity({required this.employee, required this.projects});

  double get totalAllocatedHours => projects.fold(0, (s, p) => s + p.allocatedHoursPerWeek);
  double get availableHours => (40 - totalAllocatedHours).clamp(0, 40);
  double get utilizationPct => (totalAllocatedHours / 40 * 100).clamp(0, 100);
}

class ProjectWithAlloc {
  final String projectId;
  final String projectName;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final double allocatedHoursPerWeek;

  ProjectWithAlloc({
    required this.projectId,
    required this.projectName,
    required this.status,
    required this.startDate,
    required this.endDate,
    required this.allocatedHoursPerWeek,
  });
}

class ResourceConflict {
  final String employeeId;
  final String employeeName;
  final String type; // 'Time Overlap' | 'Over Allocation' | 'Skill Mismatch'
  final String severity; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  final List<ProjectWithAlloc> conflictingProjects;
  final int overlapDays;
  final double totalConflictHours;

  ResourceConflict({
    required this.employeeId,
    required this.employeeName,
    required this.type,
    required this.severity,
    required this.conflictingProjects,
    this.overlapDays = 0,
    this.totalConflictHours = 0,
  });
}

class ResourceService extends ApiService {
  Future<List<Employee>> getAllEmployees() async {
    final data = await get('/employees');
    return (data as List).map((e) => Employee.fromJson(e)).toList();
  }

  Future<List<Project>> getAllProjects() async {
    final data = await get('/projects');
    return (data as List).map((e) => Project.fromJson(e)).toList();
  }

  /// Builds allocations by cross-referencing projects' team arrays with employees.
  Future<List<ResourceAllocation>> getAllocations() async {
    final data = await get('/projects');
    final List<ResourceAllocation> result = [];
    for (final raw in data as List) {
      final p = Project.fromJson(raw);
      if (!['active', 'planning'].contains(p.status)) continue;
      final teamSize = p.team.isEmpty ? 1 : p.team.length;
      final hoursPerWeek = 40.0 / teamSize;
      final utilizationPct = (hoursPerWeek / 40 * 100).clamp(0.0, 100.0);
      for (final m in p.team) {
        result.add(ResourceAllocation(
          employeeId: m.id,
          employeeName: m.name,
          projectId: p.id,
          projectName: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          utilizationPct: utilizationPct,
        ));
      }
    }
    return result;
  }

  Future<List<EmployeeCapacity>> getCapacities() async {
    final employees = await getAllEmployees();
    final data = await get('/projects');
    final Map<String, List<ProjectWithAlloc>> empProjects = {};

    for (final raw in data as List) {
      final p = Project.fromJson(raw);
      if (!['active', 'planning'].contains(p.status)) continue;
      final teamSize = p.team.isEmpty ? 1 : p.team.length;
      final hoursPerWeek = 40.0 / teamSize;
      for (final m in p.team) {
        empProjects.putIfAbsent(m.id, () => []).add(ProjectWithAlloc(
          projectId: p.id,
          projectName: p.name,
          status: p.status,
          startDate: p.startDate,
          endDate: p.endDate,
          allocatedHoursPerWeek: hoursPerWeek,
        ));
      }
    }

    return employees
        .where((e) => e.status == 'active')
        .map((e) => EmployeeCapacity(
              employee: e,
              projects: empProjects[e.id] ?? [],
            ))
        .toList();
  }

  Future<List<ResourceConflict>> getConflicts() async {
    final capacities = await getCapacities();
    final List<ResourceConflict> conflicts = [];

    for (final cap in capacities) {
      if (cap.utilizationPct > 100) {
        final severity = cap.utilizationPct > 150 ? 'CRITICAL' : cap.utilizationPct > 120 ? 'HIGH' : 'MEDIUM';
        final totalHours = cap.totalAllocatedHours;
        conflicts.add(ResourceConflict(
          employeeId: cap.employee.id,
          employeeName: cap.employee.fullName,
          type: 'Over Allocation',
          severity: severity,
          conflictingProjects: cap.projects,
          totalConflictHours: totalHours,
        ));
      } else {
        final active = cap.projects.where((p) => p.status == 'active').toList();
        if (active.length > 1) {
          for (int i = 0; i < active.length; i++) {
            for (int j = i + 1; j < active.length; j++) {
              final a = active[i], b = active[j];
              if (a.startDate.isBefore(b.endDate) && b.startDate.isBefore(a.endDate)) {
                final overlapStart = a.startDate.isAfter(b.startDate) ? a.startDate : b.startDate;
                final overlapEnd = a.endDate.isBefore(b.endDate) ? a.endDate : b.endDate;
                final days = overlapEnd.difference(overlapStart).inDays;
                final hours = (a.allocatedHoursPerWeek + b.allocatedHoursPerWeek) * days / 5;
                conflicts.add(ResourceConflict(
                  employeeId: cap.employee.id,
                  employeeName: cap.employee.fullName,
                  type: 'Time Overlap',
                  severity: 'MEDIUM',
                  conflictingProjects: [a, b],
                  overlapDays: days,
                  totalConflictHours: hours,
                ));
                break;
              }
            }
          }
        }
      }
    }
    return conflicts;
  }

  /// Count employees with no active project allocations
  Future<int> getAvailableCount() async {
    final capacities = await getCapacities();
    return capacities.where((c) => c.projects.isEmpty).length;
  }

  /// Count employees with ≥1 Beginner/Intermediate skill (weak skill gap indicator)
  Future<int> getSkillGapsCount() async {
    final employees = await getAllEmployees();
    return employees.where((e) =>
      e.skillsEnhanced.any((s) => s.level == 'Beginner' || s.level == 'Intermediate')
    ).length;
  }
}
