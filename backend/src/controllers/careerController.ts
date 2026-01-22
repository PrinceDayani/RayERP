import { Request, Response } from 'express';
import EmployeeCareer from '../models/EmployeeCareer';
import Employee from '../models/Employee';

// Get employee career history
export const getEmployeeCareer = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        let career = await EmployeeCareer.findOne({ employee: employeeId })
            .populate('events.project', 'name')
            .populate('events.createdBy', 'username email');

        if (!career) {
            // Create career record if doesn't exist
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            career = new EmployeeCareer({
                employee: employeeId,
                currentPosition: employee.position || 'Unknown',
                currentDepartment: employee.department || 'N/A',
                hireDate: employee.hireDate || new Date(),
                events: [{
                    date: employee.hireDate || new Date(),
                    type: 'hire',
                    title: `Joined as ${employee.position || 'Employee'}`,
                    description: `Started career at ${employee.department || 'the company'}`,
                    metadata: { role: employee.position || 'Unknown' },
                    createdBy: (req as any).user?._id || employeeId
                }]
            });
            await career.save();
        }

        res.json(career);
    } catch (error: any) {
        console.error('❌ Error in getEmployeeCareer:', error.message, error.stack);
        res.status(500).json({ message: error.message });
    }
};

// Add career event
export const addCareerEvent = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        let career = await EmployeeCareer.findOne({ employee: employeeId });

        if (!career) {
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            career = new EmployeeCareer({
                employee: employeeId,
                currentPosition: employee.position,
                currentDepartment: employee.department || 'N/A',
                hireDate: employee.hireDate,
                events: []
            });
        }

        const eventData = {
            ...req.body,
            createdBy: (req as any).user._id
        };

        await career.addEvent(eventData);

        // Update current position/department if relevant
        if (req.body.type === 'role_change' && req.body.metadata?.to) {
            career.currentPosition = req.body.metadata.to;
        }
        if (req.body.type === 'department_change' && req.body.metadata?.to) {
            career.currentDepartment = req.body.metadata.to;
        }

        await career.save();

        const updated = await EmployeeCareer.findById(career._id)
            .populate('events.project', 'name')
            .populate('events.createdBy', 'username email');

        res.status(201).json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Update career event
export const updateCareerEvent = async (req: Request, res: Response) => {
    try {
        const { employeeId, eventId } = req.params;

        const career = await EmployeeCareer.findOne({ employee: employeeId });
        if (!career) {
            return res.status(404).json({ message: 'Career history not found' });
        }

        const event = (career.events as any).id(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        Object.assign(event, req.body);
        await career.save();

        const updated = await EmployeeCareer.findById(career._id)
            .populate('events.project', 'name')
            .populate('events.createdBy', 'username email');

        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Delete career event
export const deleteCareerEvent = async (req: Request, res: Response) => {
    try {
        const { employeeId, eventId } = req.params;

        const career = await EmployeeCareer.findOne({ employee: employeeId });
        if (!career) {
            return res.status(404).json({ message: 'Career history not found' });
        }

        const event = (career.events as any).id(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Update counters
        if (event.type === 'promotion') {
            career.promotions = Math.max(0, career.promotions - 1);
        } else if (event.type === 'role_change') {
            career.roleChanges = Math.max(0, career.roleChanges - 1);
        } else if (event.type === 'department_change') {
            career.departmentChanges = Math.max(0, career.departmentChanges - 1);
        }

        event.deleteOne();
        await career.save();

        res.json({ message: 'Event deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get events by type
export const getEventsByType = async (req: Request, res: Response) => {
    try {
        const { employeeId, type } = req.params;

        const career = await EmployeeCareer.findOne({ employee: employeeId });
        if (!career) {
            return res.status(404).json({ message: 'Career history not found' });
        }

        const events = career.getEventsByType(type as any);
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get recent events
export const getRecentEvents = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        const career = await EmployeeCareer.findOne({ employee: employeeId });
        if (!career) {
            return res.status(404).json({ message: 'Career history not found' });
        }

        const events = career.getRecentEvents(limit);
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Get career statistics
export const getCareerStats = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const career = await EmployeeCareer.findOne({ employee: employeeId });
        if (!career) {
            return res.status(404).json({ message: 'Career history not found' });
        }

        const stats = {
            totalEvents: career.events.length,
            promotions: career.promotions,
            roleChanges: career.roleChanges,
            departmentChanges: career.departmentChanges,
            tenure: {
                years: Math.floor((new Date().getTime() - new Date(career.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
                months: Math.floor(((new Date().getTime() - new Date(career.hireDate).getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30))
            },
            eventsByType: {} as any
        };

        career.events.forEach(event => {
            if (!stats.eventsByType[event.type]) {
                stats.eventsByType[event.type] = 0;
            }
            stats.eventsByType[event.type]++;
        });

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
