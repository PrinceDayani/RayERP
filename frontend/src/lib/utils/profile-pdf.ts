import jsPDF from 'jspdf';
import { ResourceAllocation, Task, Skill, Achievement, WorkSummary } from '@/types/employee-profile';

interface Employee {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employeeId: string;
    hireDate?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
    };
}

interface TaskStats {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
}

interface AttendanceStats {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    halfDays: number;
    totalHours: number;
    averageHours: number;
}

interface LeaveBalanceType {
    used: number;
    total: number;
}

interface LeaveBalance {
    sick: LeaveBalanceType;
    vacation: LeaveBalanceType;
    personal: LeaveBalanceType;
}

export const generateProfilePDF = (
    employee: Employee,
    projects: ResourceAllocation[],
    skills: Skill[],
    tasks: Task[],
    taskStats: TaskStats,
    attendanceStats?: AttendanceStats,
    leaveBalance?: LeaveBalance,
    workSummary?: WorkSummary,
    achievements?: Achievement[]
) => {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number = 20) => {
        if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
        }
    };

    // Header
    doc.setFillColor(151, 14, 44); // Brand color #970E2C
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${employee.firstName} ${employee.lastName}`, margin, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.position, margin, 30);

    yPos = 50;
    doc.setTextColor(0, 0, 0);

    // Employee Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Information', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee ID: ${employee.employeeId}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Email: ${employee.email}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Phone: ${employee.phone}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Department: ${employee.department}`, margin, yPos);
    yPos += lineHeight + 5;

    // Professional Summary Section (if work summary available)
    if (workSummary) {
        checkNewPage(35);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Professional Summary', margin, yPos);
        yPos += lineHeight + 3;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Experience summary
        doc.text(`${workSummary.yearsOfExperience} years of professional experience`, margin, yPos);
        yPos += lineHeight;

        // Project summary
        doc.text(`Contributed to ${workSummary.totalProjects} projects (${workSummary.completedProjects} completed)`, margin, yPos);
        yPos += lineHeight;

        // Task completion
        const taskCompletionRate = workSummary.totalTasks > 0
            ? Math.round((workSummary.completedTasks / workSummary.totalTasks) * 100)
            : 0;
        doc.text(`Completed ${workSummary.completedTasks} tasks with ${taskCompletionRate}% success rate`, margin, yPos);
        yPos += lineHeight;

        // Attendance
        doc.text(`Maintains ${workSummary.attendanceRate}% attendance rate`, margin, yPos);
        yPos += lineHeight + 5;

        // Top Skills Summary
        if (workSummary.topSkills.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Core Competencies:', margin, yPos);
            yPos += lineHeight;
            doc.setFont('helvetica', 'normal');
            const skillsText = workSummary.topSkills.join(', ');
            const skillLines = doc.splitTextToSize(skillsText, contentWidth - 10);
            skillLines.forEach((line: string) => {
                doc.text(line, margin + 5, yPos);
                yPos += lineHeight - 1;
            });
            yPos += 5;
        }
    }


    // Task Statistics Section
    checkNewPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Overview', margin, yPos);
    yPos += lineHeight + 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Tasks: ${taskStats.total}`, margin, yPos);
    yPos += lineHeight;
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Completed: ${taskStats.completed}`, margin, yPos);
    yPos += lineHeight;
    doc.setTextColor(59, 130, 246); // Blue
    doc.text(`In Progress: ${taskStats.inProgress}`, margin, yPos);
    yPos += lineHeight;
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Overdue: ${taskStats.overdue}`, margin, yPos);
    yPos += lineHeight;
    doc.setTextColor(0, 0, 0);
    const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    doc.text(`Completion Rate: ${completionRate}%`, margin, yPos);
    yPos += lineHeight + 5;

    // Attendance Section
    if (attendanceStats) {
        checkNewPage(30);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance Overview', margin, yPos);
        yPos += lineHeight + 3;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const attendanceRate = attendanceStats.totalDays > 0
            ? Math.round((attendanceStats.presentDays / attendanceStats.totalDays) * 100)
            : 0;

        doc.text(`Total Days: ${attendanceStats.totalDays}`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(34, 197, 94);
        doc.text(`Present: ${attendanceStats.presentDays} (${attendanceRate}%)`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(234, 179, 8);
        doc.text(`Late: ${attendanceStats.lateDays}`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(249, 115, 22);
        doc.text(`Half Days: ${attendanceStats.halfDays}`, margin, yPos);
        yPos += lineHeight;
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Hours: ${attendanceStats.totalHours.toFixed(1)}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`Average Hours/Day: ${attendanceStats.averageHours.toFixed(1)}`, margin, yPos);
        yPos += lineHeight + 5;
    }

    // Leave Balance Section
    if (leaveBalance) {
        checkNewPage(25);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Leave Balance', margin, yPos);
        yPos += lineHeight + 3;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Sick Leave
        const sickRemaining = leaveBalance.sick.total - leaveBalance.sick.used;
        doc.text(`Sick Leave: ${leaveBalance.sick.used}/${leaveBalance.sick.total} used (${sickRemaining} remaining)`, margin, yPos);
        yPos += lineHeight;

        // Vacation Leave
        const vacationRemaining = leaveBalance.vacation.total - leaveBalance.vacation.used;
        doc.text(`Vacation Leave: ${leaveBalance.vacation.used}/${leaveBalance.vacation.total} used (${vacationRemaining} remaining)`, margin, yPos);
        yPos += lineHeight;

        // Personal Leave
        const personalRemaining = leaveBalance.personal.total - leaveBalance.personal.used;
        doc.text(`Personal Leave: ${leaveBalance.personal.used}/${leaveBalance.personal.total} used (${personalRemaining} remaining)`, margin, yPos);
        yPos += lineHeight + 5;
    }


    // Projects Section
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Project History', margin, yPos);
    yPos += lineHeight + 3;

    if (projects.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('No projects assigned', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += lineHeight + 5;
    } else {
        projects.forEach((project, index) => {
            checkNewPage(30);

            const projectName = typeof project.project === 'object' && project.project !== null
                ? (project.project as any).name
                : 'Unknown Project';

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${projectName}`, margin, yPos);
            yPos += lineHeight;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Role: ${project.role}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            doc.text(`Status: ${project.status}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            doc.text(`Start Date: ${new Date(project.startDate).toLocaleDateString()}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            if (project.endDate) {
                doc.text(`End Date: ${new Date(project.endDate).toLocaleDateString()}`, margin + 5, yPos);
                yPos += lineHeight - 1;
            }
            yPos += 3;
        });
        yPos += 5;
    }

    // Skills Section
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Skills Matrix', margin, yPos);
    yPos += lineHeight + 3;

    if (skills.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('No skills recorded', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += lineHeight + 5;
    } else {
        // Group skills by level
        const skillsByLevel: { [key: string]: string[] } = {
            'Expert': [],
            'Advanced': [],
            'Intermediate': [],
            'Beginner': []
        };

        skills.forEach(skill => {
            const level = skill.level || 'Intermediate';
            if (!skillsByLevel[level]) skillsByLevel[level] = [];
            skillsByLevel[level].push(skill.skill);
        });

        Object.entries(skillsByLevel).forEach(([level, skillList]) => {
            if (skillList.length > 0) {
                checkNewPage(20);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${level}:`, margin, yPos);
                yPos += lineHeight;

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const skillText = skillList.join(', ');
                const lines = doc.splitTextToSize(skillText, contentWidth - 10);
                lines.forEach((line: string) => {
                    checkNewPage();
                    doc.text(line, margin + 5, yPos);
                    yPos += lineHeight - 1;
                });
                yPos += 3;
            }
        });
        yPos += 5;
    }

    // Achievements Section
    if (achievements && achievements.length > 0) {
        checkNewPage(40);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Achievements & Certifications', margin, yPos);
        yPos += lineHeight + 3;

        achievements.forEach((achievement, index) => {
            checkNewPage(20);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${achievement.title}`, margin, yPos);
            yPos += lineHeight;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Category: ${achievement.category}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            doc.text(`Date: ${new Date(achievement.date).toLocaleDateString()}`, margin + 5, yPos);
            yPos += lineHeight - 1;

            if (achievement.issuer) {
                doc.text(`Issued by: ${achievement.issuer}`, margin + 5, yPos);
                yPos += lineHeight - 1;
            }

            // Description
            const descLines = doc.splitTextToSize(achievement.description, contentWidth - 10);
            descLines.forEach((line: string) => {
                checkNewPage();
                doc.setTextColor(64, 64, 64);
                doc.text(line, margin + 5, yPos);
                yPos += lineHeight - 1;
            });
            doc.setTextColor(0, 0, 0);
            yPos += 3;
        });
        yPos += 5;
    }

    // Recent Tasks Section
    checkNewPage(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Assigned Tasks', margin, yPos);
    yPos += lineHeight + 3;

    if (tasks.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('No tasks assigned', margin, yPos);
        doc.setTextColor(0, 0, 0);
    } else {
        const recentTasks = tasks.slice(0, 10); // Show max 10 tasks
        recentTasks.forEach((task, index) => {
            checkNewPage(20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${task.title}`, margin, yPos);
            yPos += lineHeight;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Status: ${task.status}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            doc.text(`Priority: ${task.priority || 'Medium'}`, margin + 5, yPos);
            yPos += lineHeight - 1;
            if (task.dueDate) {
                doc.text(`Due: ${new Date(task.dueDate).toLocaleDateString()}`, margin + 5, yPos);
                yPos += lineHeight - 1;
            }
            yPos += 3;
        });

        if (tasks.length > 10) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(`... and ${tasks.length - 10} more tasks`, margin, yPos);
        }
    }

    // Footer on last page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    const fileName = `${employee.firstName}_${employee.lastName}_Profile_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
