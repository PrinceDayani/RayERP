import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
  selectedReport: string;
  dateRange: string;
  department: string;
  employeeData?: any[];
  projectReports?: any[];
  taskAnalytics?: any[];
  chatReports?: any[];
  contactReports?: any[];
  budgetData?: any[];
  voucherData?: any[];
  invoiceData?: any[];
  financialData?: any;
  attendanceData?: any[];
}

export const exportToPDF = async (data: ExportData): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Modern Header Design
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, 210, 40, 'F');
    
    // Accent line
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 40, 210, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RayERP', 20, 18);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text('Enterprise Resource Planning System', 20, 26);
    
    // Report title on white background
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.selectedReport.toUpperCase()} REPORT`, 20, 55);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`, 20, 62);
    pdf.text(`Date Range: ${data.dateRange} | Department: ${data.department}`, 20, 67);
    
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(20, 70, 190, 70);
    
    let yPosition = 70;
    pdf.setTextColor(0, 0, 0);
    
    // Add content based on report type
    if (data.selectedReport === 'complete') {
      // Complete ERP Report - All Modules
      const sections = [
        { title: 'Executive Summary', type: 'summary' },
        { title: 'Employee Management', data: data.employeeData, type: 'employees' },
        { title: 'Attendance & Leave', data: data.attendanceData, type: 'attendance' },
        { title: 'Project Management', data: data.projectReports, type: 'projects' },
        { title: 'Task Analytics', data: data.taskAnalytics, type: 'tasks' },
        { title: 'Budget Management', data: data.budgetData, type: 'budgets' },
        { title: 'Voucher System', data: data.voucherData, type: 'vouchers' },
        { title: 'Invoice Management', data: data.invoiceData, type: 'invoices' },
        { title: 'Financial Reports', data: data.financialData, type: 'financial' },
        { title: 'Communication', data: data.chatReports, type: 'chat' },
        { title: 'Contact Management', data: data.contactReports, type: 'contacts' }
      ];
      
      // Modern Table of Contents
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, yPosition - 5, 170, 55, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(20, yPosition - 5, 170, 55, 3, 3);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('TABLE OF CONTENTS', 25, yPosition + 5);
      
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(2);
      pdf.line(25, yPosition + 7, 55, yPosition + 7);
      yPosition += 15;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      sections.forEach((section, idx) => {
        pdf.setFillColor(59, 130, 246);
        pdf.rect(27, yPosition - 2.5, 3, 3, 'F');
        pdf.setTextColor(51, 65, 85);
        pdf.text(`${idx + 1}. ${section.title}`, 33, yPosition);
        pdf.setTextColor(148, 163, 184);
        pdf.setFontSize(8);
        pdf.text(`Page ${idx + 2}`, 160, yPosition);
        pdf.setFontSize(9);
        yPosition += 7;
      });
      
      // Render each section
      sections.forEach((section, sectionIdx) => {
        pdf.addPage();
        let y = 20;
        
        // Modern Section Header
        pdf.setFillColor(15, 23, 42);
        pdf.rect(20, y - 5, 170, 12, 'F');
        pdf.setFillColor(59, 130, 246);
        pdf.rect(20, y - 5, 4, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${sectionIdx + 1}. ${section.title}`, 27, y + 3);
        y += 17;
        
        pdf.setTextColor(0, 0, 0);
        
        switch (section.type) {
          case 'summary':
            y = renderSummarySection(pdf, data, y);
            break;
          case 'employees':
            y = renderEmployeeSection(pdf, data, y);
            break;
          case 'attendance':
            y = renderAttendanceSection(pdf, data, y);
            break;
          case 'projects':
            y = renderProjectSection(pdf, data, y);
            break;
          case 'tasks':
            y = renderTaskSection(pdf, data, y);
            break;
          case 'budgets':
            y = renderBudgetSection(pdf, data, y);
            break;
          case 'vouchers':
            y = renderVoucherSection(pdf, data, y);
            break;
          case 'invoices':
            y = renderInvoiceSection(pdf, data, y);
            break;
          case 'financial':
            y = renderFinancialSection(pdf, data, y);
            break;
          case 'chat':
            y = renderChatSection(pdf, data, y);
            break;
          case 'contacts':
            y = renderContactSection(pdf, data, y);
            break;
        }
      });
    } else {
      switch (data.selectedReport) {
      case 'employees':
        // Summary Section
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Employee Performance Analysis', 20, yPosition);
        yPosition += 10;
        
        const totalEmps = data.employeeData?.length || 0;
        const avgEfficiency = data.employeeData?.reduce((sum, e) => sum + e.efficiency, 0) / totalEmps || 0;
        const avgAttendance = data.employeeData?.reduce((sum, e) => sum + e.attendance, 0) / totalEmps || 0;
        const totalTasks = data.employeeData?.reduce((sum, e) => sum + e.tasksCompleted, 0) || 0;
        const totalHours = data.employeeData?.reduce((sum, e) => sum + e.hoursWorked, 0) || 0;
        
        pdf.setFillColor(240, 249, 255);
        pdf.rect(20, yPosition - 3, 170, 25, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('EXECUTIVE SUMMARY', 22, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Employees: ${totalEmps} | Avg Efficiency: ${avgEfficiency.toFixed(1)}% | Avg Attendance: ${avgAttendance.toFixed(1)}%`, 22, yPosition + 8);
        pdf.text(`Total Tasks Completed: ${totalTasks} | Total Hours Worked: ${totalHours} | Productivity: ${(totalTasks/totalHours*100).toFixed(1)}%`, 22, yPosition + 14);
        yPosition += 30;
        
        // Performance Distribution
        pdf.setFont('helvetica', 'bold');
        pdf.text('PERFORMANCE DISTRIBUTION', 22, yPosition);
        yPosition += 5;
        const excellent = data.employeeData?.filter(e => e.efficiency >= 90).length || 0;
        const good = data.employeeData?.filter(e => e.efficiency >= 80 && e.efficiency < 90).length || 0;
        const average = data.employeeData?.filter(e => e.efficiency < 80).length || 0;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(34, 197, 94);
        pdf.text(`Excellent (=90%): ${excellent} employees`, 22, yPosition + 5);
        pdf.setTextColor(234, 179, 8);
        pdf.text(`Good (80-89%): ${good} employees`, 22, yPosition + 10);
        pdf.setTextColor(239, 68, 68);
        pdf.text(`Needs Improvement (<80%): ${average} employees`, 22, yPosition + 15);
        yPosition += 25;
        
        // Detailed Table
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DETAILED EMPLOYEE REPORT', 22, yPosition);
        yPosition += 6;
        pdf.setFontSize(8);
        pdf.text('Name', 20, yPosition);
        pdf.text('Dept', 65, yPosition);
        pdf.text('Tasks', 95, yPosition);
        pdf.text('Hours', 115, yPosition);
        pdf.text('Eff%', 135, yPosition);
        pdf.text('Att%', 155, yPosition);
        pdf.text('Rating', 175, yPosition);
        yPosition += 2;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPosition, 190, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        data.employeeData?.forEach((emp, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setTextColor(0, 0, 0);
          pdf.text(emp.name.substring(0, 20), 20, yPosition);
          pdf.text(emp.department.substring(0, 12), 65, yPosition);
          pdf.text(emp.tasksCompleted.toString(), 95, yPosition);
          pdf.text(emp.hoursWorked.toString(), 115, yPosition);
          pdf.text(`${emp.efficiency}%`, 135, yPosition);
          pdf.setTextColor(emp.attendance >= 95 ? 34 : 239, emp.attendance >= 95 ? 197 : 68, emp.attendance >= 95 ? 94 : 68);
          pdf.text(`${emp.attendance}%`, 155, yPosition);
          pdf.setTextColor(0, 0, 0);
          const rating = emp.efficiency >= 90 ? '?????' : emp.efficiency >= 80 ? '????' : '???';
          pdf.text(rating, 175, yPosition);
          yPosition += 6;
        });
        break;
        
      case 'projects':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Project Status & Budget Report', 20, yPosition);
        yPosition += 10;
        
        // Portfolio Summary
        const totalProjects = data.projectReports?.length || 0;
        const totalBudget = data.projectReports?.reduce((sum, p) => sum + p.budget, 0) || 0;
        const totalSpent = data.projectReports?.reduce((sum, p) => sum + p.spent, 0) || 0;
        const avgProgress = data.projectReports?.reduce((sum, p) => sum + p.progress, 0) / totalProjects || 0;
        const onTrack = data.projectReports?.filter(p => p.status === 'On Track').length || 0;
        const atRisk = data.projectReports?.filter(p => p.status === 'At Risk').length || 0;
        const delayed = data.projectReports?.filter(p => p.status === 'Delayed').length || 0;
        
        pdf.setFillColor(240, 253, 244);
        pdf.rect(20, yPosition - 3, 170, 30, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PORTFOLIO OVERVIEW', 22, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Projects: ${totalProjects} | Avg Progress: ${avgProgress.toFixed(1)}% | Budget Utilization: ${((totalSpent/totalBudget)*100).toFixed(1)}%`, 22, yPosition + 8);
        pdf.text(`Total Budget: $${totalBudget.toLocaleString()} | Spent: $${totalSpent.toLocaleString()} | Remaining: $${(totalBudget-totalSpent).toLocaleString()}`, 22, yPosition + 14);
        pdf.setTextColor(34, 197, 94);
        pdf.text(`On Track: ${onTrack}`, 22, yPosition + 20);
        pdf.setTextColor(234, 179, 8);
        pdf.text(`At Risk: ${atRisk}`, 60, yPosition + 20);
        pdf.setTextColor(239, 68, 68);
        pdf.text(`Delayed: ${delayed}`, 95, yPosition + 20);
        yPosition += 38;
        
        // Project Details
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PROJECT DETAILS', 22, yPosition);
        yPosition += 8;
        
        data.projectReports?.forEach((project, index) => {
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFillColor(245, 247, 250);
          pdf.rect(20, yPosition - 3, 170, 28, 'F');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(`${index + 1}. ${project.name}`, 22, yPosition + 2);
          
          const statusColor: [number, number, number] = project.status === 'On Track' ? [34, 197, 94] : project.status === 'At Risk' ? [234, 179, 8] : [239, 68, 68];
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(project.status, 150, yPosition + 2);
          pdf.setTextColor(0, 0, 0);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.text(`Progress: ${project.progress}% | Budget: $${project.budget.toLocaleString()} | Spent: $${project.spent.toLocaleString()} (${((project.spent/project.budget)*100).toFixed(1)}%)`, 22, yPosition + 8);
          pdf.text(`Team: ${project.team} members | Due: ${project.dueDate} | Remaining: $${(project.budget-project.spent).toLocaleString()}`, 22, yPosition + 13);
          
          // Progress Bar
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(22, yPosition + 16, 100, 4);
          pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.rect(22, yPosition + 16, project.progress, 4, 'F');
          
          // Risk Indicator
          const budgetRisk = (project.spent/project.budget) > 0.9 ? '? Budget Alert' : '';
          const timeRisk = project.progress < 50 ? '? Timeline Risk' : '';
          if (budgetRisk || timeRisk) {
            pdf.setTextColor(239, 68, 68);
            pdf.text(`${budgetRisk} ${timeRisk}`, 22, yPosition + 23);
            pdf.setTextColor(0, 0, 0);
          }
          
          yPosition += 32;
        });
        break;
        
      case 'tasks':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Task Analytics Report', 20, yPosition);
        yPosition += 10;
        
        // Overall Summary
        const totalTasksAll = data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 0;
        const totalCompleted = data.taskAnalytics?.reduce((sum, t) => sum + t.completed, 0) || 0;
        const totalPending = data.taskAnalytics?.reduce((sum, t) => sum + t.pending, 0) || 0;
        const totalOverdue = data.taskAnalytics?.reduce((sum, t) => sum + t.overdue, 0) || 0;
        const overallRate = Math.round((totalCompleted / totalTasksAll) * 100);
        
        pdf.setFillColor(249, 240, 255);
        pdf.rect(20, yPosition - 3, 170, 28, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TASK PERFORMANCE SUMMARY', 22, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Tasks: ${totalTasksAll} | Overall Completion Rate: ${overallRate}% | Efficiency Score: ${overallRate >= 80 ? 'Excellent' : overallRate >= 60 ? 'Good' : 'Needs Improvement'}`, 22, yPosition + 8);
        pdf.setTextColor(34, 197, 94);
        pdf.text(`? Completed: ${totalCompleted} (${Math.round((totalCompleted/totalTasksAll)*100)}%)`, 22, yPosition + 14);
        pdf.setTextColor(234, 179, 8);
        pdf.text(`? Pending: ${totalPending} (${Math.round((totalPending/totalTasksAll)*100)}%)`, 80, yPosition + 14);
        pdf.setTextColor(239, 68, 68);
        pdf.text(`? Overdue: ${totalOverdue} (${Math.round((totalOverdue/totalTasksAll)*100)}%)`, 135, yPosition + 14);
        yPosition += 35;
        
        // Department Breakdown
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DEPARTMENT-WISE ANALYSIS', 22, yPosition);
        yPosition += 8;
        
        data.taskAnalytics?.forEach((task, index) => {
          if (yPosition > 255) {
            pdf.addPage();
            yPosition = 20;
          }
          const completionRate = Math.round((task.completed / task.total) * 100);
          
          pdf.setFillColor(250, 250, 250);
          pdf.rect(20, yPosition - 3, 170, 22, 'F');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(`${task.category} Department`, 22, yPosition + 2);
          
          // Status Badge
          const statusText = completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Critical';
          const statusColor: [number, number, number] = completionRate >= 80 ? [34, 197, 94] : completionRate >= 60 ? [234, 179, 8] : [239, 68, 68];
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(statusText, 155, yPosition + 2);
          pdf.setTextColor(0, 0, 0);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.text(`Total: ${task.total}`, 22, yPosition + 8);
          pdf.setTextColor(34, 197, 94);
          pdf.text(`Completed: ${task.completed}`, 50, yPosition + 8);
          pdf.setTextColor(234, 179, 8);
          pdf.text(`Pending: ${task.pending}`, 95, yPosition + 8);
          pdf.setTextColor(239, 68, 68);
          pdf.text(`Overdue: ${task.overdue}`, 135, yPosition + 8);
          pdf.setTextColor(0, 0, 0);
          
          // Progress Bar
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(22, yPosition + 12, 100, 4);
          pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.rect(22, yPosition + 12, completionRate, 4, 'F');
          pdf.text(`${completionRate}%`, 125, yPosition + 15);
          
          yPosition += 26;
        });
        break;
        
      case 'chat':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Communication Analytics', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.chatReports?.forEach((chat) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${chat.week}:`, 20, yPosition);
          pdf.text(`Messages: ${chat.messages} | Files: ${chat.files}`, 30, yPosition + 5);
          pdf.text(`Active Users: ${chat.activeUsers} | Avg Response: ${chat.avgResponseTime}min`, 30, yPosition + 10);
          yPosition += 20;
        });
        break;
        
      case 'contacts':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Contact Management Report', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.contactReports?.forEach((contact, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          const activityRate = Math.round((contact.active / contact.total) * 100);
          pdf.text(`${index + 1}. ${contact.category}`, 20, yPosition);
          pdf.text(`Total: ${contact.total} | Active: ${contact.active} | New: ${contact.newThisMonth}`, 30, yPosition + 5);
          pdf.text(`Interactions: ${contact.interactions} | Activity Rate: ${activityRate}%`, 30, yPosition + 10);
          yPosition += 20;
        });
        break;
        
      default:
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Executive Dashboard Overview', 20, yPosition);
        yPosition += 10;
        
        // Key Highlights
        pdf.setFillColor(254, 249, 195);
        pdf.rect(20, yPosition - 3, 170, 20, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('?? KEY HIGHLIGHTS', 22, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Organization Performance: Excellent | Growth Trend: +12% MoM | Overall Health Score: 87/100', 22, yPosition + 8);
        pdf.text('Top Performer: Development Dept | Focus Area: Task Completion | Budget Status: On Track', 22, yPosition + 13);
        yPosition += 26;
        
        const metrics = [
          { 
            title: 'Workforce Metrics', 
            color: [59, 130, 246], 
            items: [
              'Total Employees: 24 (+2 this month, +9% growth)',
              'Average Attendance: 95.1% (Target: 95%)',
              'Employee Satisfaction: 4.2/5.0',
              'Turnover Rate: 3.5% (Industry Avg: 5%)'
            ]
          },
          { 
            title: 'Project Metrics', 
            color: [34, 197, 94], 
            items: [
              'Active Projects: 12 (3 completing this month)',
              'Success Rate: 85% (Target: 80%)',
              'On-Time Delivery: 78%',
              'Budget Variance: -2% (Under budget)'
            ]
          },
          { 
            title: 'Task Metrics', 
            color: [168, 85, 247], 
            items: [
              'Total Tasks: 346 (?15% from last month)',
              'Completion Rate: 78% (Target: 75%)',
              'Overdue Tasks: 15 (4.3% of total)',
              'Avg Completion Time: 3.2 days'
            ]
          },
          { 
            title: 'Financial Metrics', 
            color: [6, 182, 212], 
            items: [
              'Monthly Revenue: ?189K (+12% growth)',
              'Budget Utilization: 85% (Optimal range)',
              'Cost per Employee: ?7,875',
              'ROI: 145% (Excellent performance)'
            ]
          }
        ];
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        metrics.forEach(metric => {
          if (yPosition > 245) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
          pdf.rect(20, yPosition - 3, 4, 22, 'F');
          
          pdf.setFillColor(250, 250, 250);
          pdf.rect(24, yPosition - 3, 166, 22, 'F');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(metric.title, 27, yPosition + 2);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          metric.items.forEach((item, idx) => {
            pdf.text(`• ${item}`, 27, yPosition + 7 + (idx * 4));
          });
          yPosition += 26;
        });
        
        // Recommendations
        if (yPosition > 230) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFillColor(220, 252, 231);
        pdf.rect(20, yPosition - 3, 170, 25, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('?? STRATEGIC RECOMMENDATIONS', 22, yPosition + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text('1. Focus on reducing overdue tasks by 50% through better resource allocation', 22, yPosition + 8);
        pdf.text('2. Maintain current employee satisfaction levels with recognition programs', 22, yPosition + 12);
        pdf.text('3. Scale successful project management practices to at-risk projects', 22, yPosition + 16);
        pdf.text('4. Continue cost optimization strategies to maintain budget efficiency', 22, yPosition + 20);
    }
    
    // Add Visual Analytics Page (skip for complete report)
    if (data.selectedReport !== 'complete') {
      pdf.addPage();
      yPosition = 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Visual Analytics & Charts', 20, yPosition);
      yPosition += 10;
    }
    
    // Draw charts based on report type
    if (data.selectedReport !== 'complete') {
      switch (data.selectedReport) {
      case 'employees':
        // Efficiency Distribution Chart
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Efficiency Distribution', 20, yPosition);
        yPosition += 8;
        
        const effExcellent = data.employeeData?.filter(e => e.efficiency >= 90).length || 0;
        const effGood = data.employeeData?.filter(e => e.efficiency >= 80 && e.efficiency < 90).length || 0;
        const effAverage = data.employeeData?.filter(e => e.efficiency < 80).length || 0;
        const effTotal = effExcellent + effGood + effAverage;
        
        // Pie Chart
        const centerX = 60;
        const centerY = yPosition + 30;
        const chartRadius = 25;
        let startAngle = 0;
        
        // Excellent slice
        const excellentAngle = (effExcellent / effTotal) * 360;
        pdf.setFillColor(34, 197, 94);
        drawPieSlice(pdf, centerX, centerY, chartRadius, startAngle, excellentAngle);
        startAngle += excellentAngle;
        
        // Good slice
        const goodAngle = (effGood / effTotal) * 360;
        pdf.setFillColor(234, 179, 8);
        drawPieSlice(pdf, centerX, centerY, chartRadius, startAngle, goodAngle);
        startAngle += goodAngle;
        
        // Average slice
        const avgAngle = (effAverage / effTotal) * 360;
        pdf.setFillColor(239, 68, 68);
        drawPieSlice(pdf, centerX, centerY, chartRadius, startAngle, avgAngle);
        
        // Legend
        pdf.setFontSize(9);
        pdf.setFillColor(34, 197, 94);
        pdf.rect(100, yPosition + 15, 4, 4, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Excellent (=90%): ${effExcellent} (${((effExcellent/effTotal)*100).toFixed(1)}%)`, 106, yPosition + 18);
        
        pdf.setFillColor(234, 179, 8);
        pdf.rect(100, yPosition + 25, 4, 4, 'F');
        pdf.text(`Good (80-89%): ${effGood} (${((effGood/effTotal)*100).toFixed(1)}%)`, 106, yPosition + 28);
        
        pdf.setFillColor(239, 68, 68);
        pdf.rect(100, yPosition + 35, 4, 4, 'F');
        pdf.text(`Needs Improvement: ${effAverage} (${((effAverage/effTotal)*100).toFixed(1)}%)`, 106, yPosition + 38);
        
        yPosition += 70;
        
        // Attendance Bar Chart
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Top Performers by Efficiency', 20, yPosition);
        yPosition += 8;
        
        const topPerformers = [...(data.employeeData || [])].sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);
        const maxEff = 100;
        const barWidth = 120;
        
        topPerformers.forEach((emp, idx) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(emp.name.substring(0, 15), 20, yPosition + 3);
          
          // Bar background
          pdf.setFillColor(230, 230, 230);
          pdf.rect(70, yPosition - 2, barWidth, 6, 'F');
          
          // Bar fill
          const barLength = (emp.efficiency / maxEff) * barWidth;
          const barColor: [number, number, number] = emp.efficiency >= 90 ? [34, 197, 94] : emp.efficiency >= 80 ? [234, 179, 8] : [239, 68, 68];
          pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
          pdf.rect(70, yPosition - 2, barLength, 6, 'F');
          
          // Value label
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${emp.efficiency}%`, 70 + barLength + 2, yPosition + 3);
          
          yPosition += 10;
        });
        break;
        
      case 'projects':
        // Project Status Pie Chart
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Project Status Distribution', 20, yPosition);
        yPosition += 8;
        
        const projOnTrack = data.projectReports?.filter(p => p.status === 'On Track').length || 0;
        const projAtRisk = data.projectReports?.filter(p => p.status === 'At Risk').length || 0;
        const projDelayed = data.projectReports?.filter(p => p.status === 'Delayed').length || 0;
        const projTotal = projOnTrack + projAtRisk + projDelayed;
        
        const pCenterX = 60;
        const pCenterY = yPosition + 30;
        const pChartRadius = 25;
        let pStartAngle = 0;
        
        // On Track
        const onTrackAngle = (projOnTrack / projTotal) * 360;
        pdf.setFillColor(34, 197, 94);
        drawPieSlice(pdf, pCenterX, pCenterY, pChartRadius, pStartAngle, onTrackAngle);
        pStartAngle += onTrackAngle;
        
        // At Risk
        const atRiskAngle = (projAtRisk / projTotal) * 360;
        pdf.setFillColor(234, 179, 8);
        drawPieSlice(pdf, pCenterX, pCenterY, pChartRadius, pStartAngle, atRiskAngle);
        pStartAngle += atRiskAngle;
        
        // Delayed
        const delayedAngle = (projDelayed / projTotal) * 360;
        pdf.setFillColor(239, 68, 68);
        drawPieSlice(pdf, pCenterX, pCenterY, pChartRadius, pStartAngle, delayedAngle);
        
        // Legend
        pdf.setFontSize(9);
        pdf.setFillColor(34, 197, 94);
        pdf.rect(100, yPosition + 15, 4, 4, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`On Track: ${projOnTrack} (${((projOnTrack/projTotal)*100).toFixed(1)}%)`, 106, yPosition + 18);
        
        pdf.setFillColor(234, 179, 8);
        pdf.rect(100, yPosition + 25, 4, 4, 'F');
        pdf.text(`At Risk: ${projAtRisk} (${((projAtRisk/projTotal)*100).toFixed(1)}%)`, 106, yPosition + 28);
        
        pdf.setFillColor(239, 68, 68);
        pdf.rect(100, yPosition + 35, 4, 4, 'F');
        pdf.text(`Delayed: ${projDelayed} (${((projDelayed/projTotal)*100).toFixed(1)}%)`, 106, yPosition + 38);
        
        yPosition += 70;
        
        // Budget Utilization Chart
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Budget Utilization by Project', 20, yPosition);
        yPosition += 8;
        
        data.projectReports?.slice(0, 5).forEach((proj, idx) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(proj.name.substring(0, 20), 20, yPosition + 3);
          
          const utilization = (proj.spent / proj.budget) * 100;
          const barLen = (utilization / 100) * 120;
          
          pdf.setFillColor(230, 230, 230);
          pdf.rect(70, yPosition - 2, 120, 6, 'F');
          
          const color: [number, number, number] = utilization > 90 ? [239, 68, 68] : utilization > 75 ? [234, 179, 8] : [34, 197, 94];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(70, yPosition - 2, barLen, 6, 'F');
          
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${utilization.toFixed(1)}%`, 70 + barLen + 2, yPosition + 3);
          
          yPosition += 10;
        });
        break;
        
      case 'tasks':
        // Task Completion Chart
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Task Completion by Department', 20, yPosition);
        yPosition += 8;
        
        data.taskAnalytics?.forEach((task, idx) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(task.category, 20, yPosition + 3);
          
          const completionRate = (task.completed / task.total) * 100;
          const barL = (completionRate / 100) * 120;
          
          pdf.setFillColor(230, 230, 230);
          pdf.rect(70, yPosition - 2, 120, 6, 'F');
          
          const tColor: [number, number, number] = completionRate >= 80 ? [34, 197, 94] : completionRate >= 60 ? [234, 179, 8] : [239, 68, 68];
          pdf.setFillColor(tColor[0], tColor[1], tColor[2]);
          pdf.rect(70, yPosition - 2, barL, 6, 'F');
          
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${completionRate.toFixed(1)}%`, 70 + barL + 2, yPosition + 3);
          
          yPosition += 10;
        });
        
        yPosition += 10;
        
        // Stacked Bar for Task Status
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Task Status Breakdown', 20, yPosition);
        yPosition += 8;
        
        data.taskAnalytics?.forEach((task, idx) => {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(task.category, 20, yPosition + 3);
          
          const barStartX = 70;
          const totalWidth = 120;
          
          // Completed
          const completedWidth = (task.completed / task.total) * totalWidth;
          pdf.setFillColor(34, 197, 94);
          pdf.rect(barStartX, yPosition - 2, completedWidth, 6, 'F');
          
          // Pending
          const pendingWidth = (task.pending / task.total) * totalWidth;
          pdf.setFillColor(234, 179, 8);
          pdf.rect(barStartX + completedWidth, yPosition - 2, pendingWidth, 6, 'F');
          
          // Overdue
          const overdueWidth = (task.overdue / task.total) * totalWidth;
          pdf.setFillColor(239, 68, 68);
          pdf.rect(barStartX + completedWidth + pendingWidth, yPosition - 2, overdueWidth, 6, 'F');
          
          yPosition += 10;
        });
        
        // Legend
        yPosition += 5;
        pdf.setFontSize(8);
        pdf.setFillColor(34, 197, 94);
        pdf.rect(20, yPosition, 4, 4, 'F');
        pdf.text('Completed', 26, yPosition + 3);
        
        pdf.setFillColor(234, 179, 8);
        pdf.rect(60, yPosition, 4, 4, 'F');
        pdf.text('Pending', 66, yPosition + 3);
        
        pdf.setFillColor(239, 68, 68);
        pdf.rect(95, yPosition, 4, 4, 'F');
        pdf.text('Overdue', 101, yPosition + 3);
        break;
        
      default:
        // Overview Dashboard Charts
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Key Metrics Overview', 20, yPosition);
        yPosition += 10;
        
        // Metric Cards with Visual Indicators
        const overviewMetrics = [
          { label: 'Employee Satisfaction', value: 84, color: [59, 130, 246] },
          { label: 'Project Success Rate', value: 85, color: [34, 197, 94] },
          { label: 'Task Completion', value: 78, color: [168, 85, 247] },
          { label: 'Budget Efficiency', value: 85, color: [6, 182, 212] }
        ];
        
        overviewMetrics.forEach((metric, idx) => {
          const xPos = 20 + (idx % 2) * 90;
          const yPos = yPosition + Math.floor(idx / 2) * 35;
          
          // Card background
          pdf.setFillColor(250, 250, 250);
          pdf.rect(xPos, yPos, 80, 30, 'F');
          
          // Label
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(metric.label, xPos + 3, yPos + 6);
          
          // Circular progress
          const circleX = xPos + 40;
          const circleY = yPos + 20;
          const circleRadius = 8;
          
          // Background circle
          pdf.setDrawColor(230, 230, 230);
          pdf.setLineWidth(2);
          pdf.circle(circleX, circleY, circleRadius, 'S');
          
          // Progress arc
          pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
          pdf.setLineWidth(2);
          const progressAngle = (metric.value / 100) * 360;
          drawArc(pdf, circleX, circleY, circleRadius, 0, progressAngle);
          
          // Value text
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
          pdf.text(`${metric.value}%`, circleX - 5, circleY + 2);
        });
        break;
      }
    }
    }
    
    // Helper rendering functions
    function renderSummarySection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 60, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 60);
      pdf.setFillColor(59, 130, 246);
      pdf.rect(20, y - 3, 3, 60, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ORGANIZATION OVERVIEW', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      pdf.text(`Total Employees: ${data.employeeData?.length || 0}`, 25, y + 10);
      pdf.text(`Active Projects: ${data.projectReports?.length || 0}`, 25, y + 16);
      pdf.text(`Total Tasks: ${data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 0}`, 25, y + 22);
      pdf.text(`Total Contacts: ${data.contactReports?.reduce((sum, c) => sum + c.total, 0) || 0}`, 25, y + 28);
      pdf.text(`Budget Allocated: $${data.projectReports?.reduce((sum, p) => sum + p.budget, 0).toLocaleString() || 0}`, 25, y + 34);
      pdf.text(`Budget Spent: $${data.projectReports?.reduce((sum, p) => sum + p.spent, 0).toLocaleString() || 0}`, 25, y + 40);
      pdf.text(`Overall Completion Rate: ${Math.round((data.taskAnalytics?.reduce((sum, t) => sum + t.completed, 0) || 0) / (data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 1) * 100)}%`, 25, y + 46);
      pdf.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 25, y + 52);
      
      return y + 65;
    }
    
    function renderAttendanceSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Attendance data: 95.1% average attendance rate', 25, y);
      pdf.text('Leave requests: 12 pending, 45 approved this month', 25, y + 7);
      return y + 20;
    }
    
    function renderBudgetSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalBudget = data.projectReports?.reduce((sum, p) => sum + p.budget, 0) || 0;
      const totalSpent = data.projectReports?.reduce((sum, p) => sum + p.spent, 0) || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 20, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 20);
      pdf.setFillColor(16, 185, 129);
      pdf.rect(20, y - 3, 3, 20, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BUDGET SUMMARY', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Total Budget: $${totalBudget.toLocaleString()} | Spent: $${totalSpent.toLocaleString()} | Utilization: ${((totalSpent/totalBudget)*100).toFixed(1)}%`, 25, y + 8);
      
      return y + 25;
    }
    
    function renderVoucherSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Voucher System: 8 types (Payment, Receipt, Contra, Sales, Purchase, Journal, DN, CN)', 25, y);
      pdf.text('Total vouchers this month: 156 | Posted: 142 | Draft: 14', 25, y + 7);
      return y + 20;
    }
    
    function renderInvoiceSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Invoice Management: Auto-numbering, Multi-currency, Tax calculations', 25, y);
      pdf.text('Total invoices: 89 | Paid: 67 | Pending: 22 | Overdue: 5', 25, y + 7);
      return y + 20;
    }
    
    function renderFinancialSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 30, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 30);
      pdf.setFillColor(6, 182, 212);
      pdf.rect(20, y - 3, 3, 30, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FINANCIAL OVERVIEW', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Monthly Revenue: ?189K (+12% growth)', 25, y + 10);
      pdf.text('Profit & Loss: Balance Sheet, Cash Flow available', 25, y + 16);
      pdf.text('Bank Reconciliation: All accounts reconciled', 25, y + 22);
      
      return y + 35;
    }
    
    function renderEmployeeSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalEmps = data.employeeData?.length || 0;
      const avgEfficiency = data.employeeData?.reduce((sum, e) => sum + e.efficiency, 0) / totalEmps || 0;
      const avgAttendance = data.employeeData?.reduce((sum, e) => sum + e.attendance, 0) / totalEmps || 0;
      const totalTasks = data.employeeData?.reduce((sum, e) => sum + e.tasksCompleted, 0) || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 25, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 25);
      pdf.setFillColor(59, 130, 246);
      pdf.rect(20, y - 3, 3, 25, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXECUTIVE SUMMARY', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total: ${totalEmps} | Avg Efficiency: ${avgEfficiency.toFixed(1)}% | Avg Attendance: ${avgAttendance.toFixed(1)}%`, 22, y + 8);
      pdf.text(`Total Tasks: ${totalTasks} | Productivity Score: ${avgEfficiency.toFixed(0)}/100`, 22, y + 14);
      y += 30;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name', 20, y);
      pdf.text('Department', 65, y);
      pdf.text('Tasks', 105, y);
      pdf.text('Hours', 125, y);
      pdf.text('Eff%', 145, y);
      pdf.text('Att%', 165, y);
      y += 3;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, y, 190, y);
      y += 5;
      
      pdf.setFont('helvetica', 'normal');
      data.employeeData?.forEach((emp) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(emp.name.substring(0, 18), 20, y);
        pdf.text(emp.department.substring(0, 12), 65, y);
        pdf.text(emp.tasksCompleted.toString(), 105, y);
        pdf.text(emp.hoursWorked.toString(), 125, y);
        pdf.text(`${emp.efficiency}%`, 145, y);
        pdf.setTextColor(emp.attendance >= 95 ? 34 : 239, emp.attendance >= 95 ? 197 : 68, emp.attendance >= 95 ? 94 : 68);
        pdf.text(`${emp.attendance}%`, 165, y);
        pdf.setTextColor(0, 0, 0);
        y += 6;
      });
      return y;
    }
    
    function renderProjectSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalProjects = data.projectReports?.length || 0;
      const totalBudget = data.projectReports?.reduce((sum, p) => sum + p.budget, 0) || 0;
      const totalSpent = data.projectReports?.reduce((sum, p) => sum + p.spent, 0) || 0;
      const onTrack = data.projectReports?.filter(p => p.status === 'On Track').length || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 25, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 25);
      pdf.setFillColor(34, 197, 94);
      pdf.rect(20, y - 3, 3, 25, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PORTFOLIO OVERVIEW', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Projects: ${totalProjects} | On Track: ${onTrack} | Budget Utilization: ${((totalSpent/totalBudget)*100).toFixed(1)}%`, 22, y + 8);
      pdf.text(`Budget: $${totalBudget.toLocaleString()} | Spent: $${totalSpent.toLocaleString()} | Remaining: $${(totalBudget-totalSpent).toLocaleString()}`, 22, y + 14);
      y += 30;
      
      data.projectReports?.forEach((proj) => {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFillColor(255, 255, 255);
        pdf.rect(20, y - 3, 170, 22, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.rect(20, y - 3, 170, 22);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(proj.name, 22, y + 2);
        const statusColor: [number, number, number] = proj.status === 'On Track' ? [34, 197, 94] : proj.status === 'At Risk' ? [234, 179, 8] : [239, 68, 68];
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.text(proj.status, 150, y + 2);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Progress: ${proj.progress}% | Budget: $${proj.budget.toLocaleString()} | Spent: $${proj.spent.toLocaleString()}`, 22, y + 8);
        pdf.text(`Team: ${proj.team} members | Due: ${proj.dueDate}`, 22, y + 13);
        y += 26;
      });
      return y;
    }
    
    function renderTaskSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalTasks = data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 0;
      const totalCompleted = data.taskAnalytics?.reduce((sum, t) => sum + t.completed, 0) || 0;
      const totalOverdue = data.taskAnalytics?.reduce((sum, t) => sum + t.overdue, 0) || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 25, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 25);
      pdf.setFillColor(168, 85, 247);
      pdf.rect(20, y - 3, 3, 25, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TASK PERFORMANCE SUMMARY', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total: ${totalTasks} | Completed: ${totalCompleted} (${Math.round((totalCompleted/totalTasks)*100)}%) | Overdue: ${totalOverdue}`, 22, y + 8);
      pdf.text(`Completion Rate: ${Math.round((totalCompleted/totalTasks)*100)}% | Efficiency: ${totalOverdue < 20 ? 'Excellent' : 'Good'}`, 22, y + 14);
      y += 30;
      
      data.taskAnalytics?.forEach((task) => {
        if (y > 265) {
          pdf.addPage();
          y = 20;
        }
        const completionRate = Math.round((task.completed / task.total) * 100);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(20, y - 3, 170, 18, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.rect(20, y - 3, 170, 18);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(task.category, 22, y + 2);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Total: ${task.total} | Completed: ${task.completed} | Pending: ${task.pending} | Overdue: ${task.overdue}`, 22, y + 7);
        pdf.text(`Completion Rate: ${completionRate}%`, 22, y + 12);
        y += 22;
      });
      return y;
    }
    
    function renderChatSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalMessages = data.chatReports?.reduce((sum, c) => sum + c.messages, 0) || 0;
      const totalFiles = data.chatReports?.reduce((sum, c) => sum + c.files, 0) || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 20, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 20);
      pdf.setFillColor(245, 158, 11);
      pdf.rect(20, y - 3, 3, 20, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMMUNICATION SUMMARY', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Messages: ${totalMessages} | Files Shared: ${totalFiles}`, 22, y + 8);
      y += 25;
      
      pdf.setFontSize(8);
      data.chatReports?.forEach((chat) => {
        pdf.text(`${chat.week}: Messages: ${chat.messages} | Files: ${chat.files} | Active Users: ${chat.activeUsers}`, 22, y);
        y += 7;
      });
      return y;
    }
    
    function renderContactSection(pdf: jsPDF, data: ExportData, startY: number): number {
      let y = startY;
      const totalContacts = data.contactReports?.reduce((sum, c) => sum + c.total, 0) || 0;
      const totalActive = data.contactReports?.reduce((sum, c) => sum + c.active, 0) || 0;
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, y - 3, 170, 20, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.rect(20, y - 3, 170, 20);
      pdf.setFillColor(239, 68, 68);
      pdf.rect(20, y - 3, 3, 20, 'F');
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CONTACT OVERVIEW', 25, y + 2);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Contacts: ${totalContacts} | Active: ${totalActive} (${Math.round((totalActive/totalContacts)*100)}%)`, 22, y + 8);
      y += 25;
      
      pdf.setFontSize(8);
      data.contactReports?.forEach((contact) => {
        pdf.text(`${contact.category}: Total: ${contact.total} | Active: ${contact.active} | New: ${contact.newThisMonth} | Interactions: ${contact.interactions}`, 22, y);
        y += 7;
      });
      return y;
    }
    
    // Helper function for pie slices
    function drawPieSlice(pdf: jsPDF, centerX: number, centerY: number, radius: number, startAngle: number, angle: number) {
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (startAngle + angle - 90) * Math.PI / 180;
      
      pdf.moveTo(centerX, centerY);
      pdf.lineTo(centerX + radius * Math.cos(startRad), centerY + radius * Math.sin(startRad));
      
      const steps = Math.max(2, Math.floor(angle / 5));
      for (let i = 0; i <= steps; i++) {
        const currentAngle = startRad + (endRad - startRad) * (i / steps);
        pdf.lineTo(centerX + radius * Math.cos(currentAngle), centerY + radius * Math.sin(currentAngle));
      }
      
      pdf.lineTo(centerX, centerY);
      pdf.fill();
    }
    
    function drawArc(pdf: jsPDF, centerX: number, centerY: number, radius: number, startAngle: number, angle: number) {
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (startAngle + angle - 90) * Math.PI / 180;
      
      const steps = Math.max(2, Math.floor(angle / 5));
      for (let i = 0; i <= steps; i++) {
        const currentAngle = startRad + (endRad - startRad) * (i / steps);
        const x = centerX + radius * Math.cos(currentAngle);
        const y = centerY + radius * Math.sin(currentAngle);
        if (i === 0) pdf.moveTo(x, y);
        else pdf.lineTo(x, y);
      }
      pdf.stroke();
    }
    
    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 280, 210, 17, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 281, 190, 281);
      
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('RayERP - Enterprise Resource Planning System', 105, 287, { align: 'center' });
      pdf.setFontSize(6);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Confidential - For Internal Use Only', 105, 291, { align: 'center' });
      pdf.setFontSize(7);
      pdf.setTextColor(59, 130, 246);
      pdf.text(`Page ${i} of ${pageCount}`, 105, 294, { align: 'center' });
    }
    
    const filename = `RayERP-${data.selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return Promise.resolve();
  } catch (error) {
    console.error('PDF Export Error:', error);
    if (error instanceof Error) {
      throw new Error(`PDF Export Failed: ${error.message}`);
    }
    throw new Error('Failed to generate PDF. Please check your browser settings and try again.');
  }
};

export const exportToExcel = (data: ExportData): void => {
  try {
    const wb = XLSX.utils.book_new();
    
    if (data.selectedReport === 'complete') {
      // Summary Sheet
      const summaryData = [
        { Module: 'Employees', Count: data.employeeData?.length || 0 },
        { Module: 'Projects', Count: data.projectReports?.length || 0 },
        { Module: 'Tasks', Count: data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 0 },
        { Module: 'Contacts', Count: data.contactReports?.reduce((sum, c) => sum + c.total, 0) || 0 }
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // All module sheets
      if (data.employeeData) {
        const empWs = XLSX.utils.json_to_sheet(data.employeeData.map(e => ({
          Name: e.name, Department: e.department, Tasks: e.tasksCompleted, Hours: e.hoursWorked, 'Efficiency%': e.efficiency, 'Attendance%': e.attendance
        })));
        XLSX.utils.book_append_sheet(wb, empWs, 'Employees');
      }
      
      if (data.projectReports) {
        const projWs = XLSX.utils.json_to_sheet(data.projectReports.map(p => ({
          Project: p.name, Status: p.status, 'Progress%': p.progress, Budget: p.budget, Spent: p.spent, Team: p.team, Due: p.dueDate
        })));
        XLSX.utils.book_append_sheet(wb, projWs, 'Projects');
      }
      
      if (data.taskAnalytics) {
        const taskWs = XLSX.utils.json_to_sheet(data.taskAnalytics.map(t => ({
          Category: t.category, Total: t.total, Completed: t.completed, Pending: t.pending, Overdue: t.overdue
        })));
        XLSX.utils.book_append_sheet(wb, taskWs, 'Tasks');
      }
      
      if (data.chatReports) {
        const chatWs = XLSX.utils.json_to_sheet(data.chatReports.map(c => ({
          Week: c.week, Messages: c.messages, Files: c.files, Users: c.activeUsers, 'Avg Response': c.avgResponseTime
        })));
        XLSX.utils.book_append_sheet(wb, chatWs, 'Communication');
      }
      
      if (data.contactReports) {
        const contactWs = XLSX.utils.json_to_sheet(data.contactReports.map(c => ({
          Category: c.category, Total: c.total, Active: c.active, New: c.newThisMonth, Interactions: c.interactions
        })));
        XLSX.utils.book_append_sheet(wb, contactWs, 'Contacts');
      }
    } else {
      switch (data.selectedReport) {
        case 'employees':
          const empData = data.employeeData?.map(emp => ({
            Name: emp.name,
            Department: emp.department,
            'Tasks Completed': emp.tasksCompleted,
            'Hours Worked': emp.hoursWorked,
            'Efficiency (%)': emp.efficiency,
            'Attendance (%)': emp.attendance
          })) || [];
          const empWs = XLSX.utils.json_to_sheet(empData);
          XLSX.utils.book_append_sheet(wb, empWs, 'Employee Performance');
          break;
          
        case 'projects':
          const projData = data.projectReports?.map(project => ({
            'Project Name': project.name,
            Status: project.status,
            'Progress (%)': project.progress,
            Budget: project.budget,
            'Amount Spent': project.spent,
            'Team Size': project.team,
            'Due Date': project.dueDate
          })) || [];
          const projWs = XLSX.utils.json_to_sheet(projData);
          XLSX.utils.book_append_sheet(wb, projWs, 'Project Status');
          break;
          
        case 'tasks':
          const taskData = data.taskAnalytics?.map(task => ({
            Category: task.category,
            Total: task.total,
            Completed: task.completed,
            Pending: task.pending,
            Overdue: task.overdue,
            'Completion Rate (%)': Math.round((task.completed / task.total) * 100)
          })) || [];
          const taskWs = XLSX.utils.json_to_sheet(taskData);
          XLSX.utils.book_append_sheet(wb, taskWs, 'Task Analytics');
          break;
          
        case 'chat':
          const chatData = data.chatReports?.map(chat => ({
            Week: chat.week,
            Messages: chat.messages,
            'Files Shared': chat.files,
            'Active Users': chat.activeUsers,
            'Avg Response Time (min)': chat.avgResponseTime
          })) || [];
          const chatWs = XLSX.utils.json_to_sheet(chatData);
          XLSX.utils.book_append_sheet(wb, chatWs, 'Communication');
          break;
          
        case 'contacts':
          const contactData = data.contactReports?.map(contact => ({
            Category: contact.category,
            Total: contact.total,
            Active: contact.active,
            'New This Month': contact.newThisMonth,
            Interactions: contact.interactions,
            'Activity Rate (%)': Math.round((contact.active / contact.total) * 100)
          })) || [];
          const contactWs = XLSX.utils.json_to_sheet(contactData);
          XLSX.utils.book_append_sheet(wb, contactWs, 'Contact Management');
          break;
          
        default:
          const overviewData = [
            { Metric: 'Total Employees', Value: 24, Change: '+2 this month' },
            { Metric: 'Active Projects', Value: 12, Change: '3 completing this month' },
            { Metric: 'Total Tasks', Value: 346, Change: '78% completion rate' },
            { Metric: 'Monthly Revenue', Value: '?189K', Change: '+12% from last month' }
          ];
          const overviewWs = XLSX.utils.json_to_sheet(overviewData);
          XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');
      }
    }
    
    const filename = `${data.selectedReport}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw new Error('Failed to generate Excel file. Please try again.');
  }
};

export const exportToCSV = (data: ExportData): void => {
  try {
    let csvContent = `${data.selectedReport.toUpperCase()} REPORT\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `Date Range: ${data.dateRange}, Department: ${data.department}\n\n`;
    
    let exportData: any[] = [];
    
    if (data.selectedReport === 'complete') {
      csvContent += 'COMPLETE ERP REPORT\n\n';
      
      csvContent += '=== SUMMARY ===\n';
      csvContent += `Total Employees,${data.employeeData?.length || 0}\n`;
      csvContent += `Active Projects,${data.projectReports?.length || 0}\n`;
      csvContent += `Total Tasks,${data.taskAnalytics?.reduce((sum, t) => sum + t.total, 0) || 0}\n`;
      csvContent += `Total Contacts,${data.contactReports?.reduce((sum, c) => sum + c.total, 0) || 0}\n\n`;
      
      if (data.employeeData) {
        csvContent += '=== EMPLOYEES ===\n';
        csvContent += 'Name,Department,Tasks,Hours,Efficiency%,Attendance%\n';
        data.employeeData.forEach(e => {
          csvContent += `${e.name},${e.department},${e.tasksCompleted},${e.hoursWorked},${e.efficiency},${e.attendance}\n`;
        });
        csvContent += '\n';
      }
      
      if (data.projectReports) {
        csvContent += '=== PROJECTS ===\n';
        csvContent += 'Project,Status,Progress%,Budget,Spent,Team,Due Date\n';
        data.projectReports.forEach(p => {
          csvContent += `${p.name},${p.status},${p.progress},${p.budget},${p.spent},${p.team},${p.dueDate}\n`;
        });
        csvContent += '\n';
      }
      
      if (data.taskAnalytics) {
        csvContent += '=== TASKS ===\n';
        csvContent += 'Category,Total,Completed,Pending,Overdue\n';
        data.taskAnalytics.forEach(t => {
          csvContent += `${t.category},${t.total},${t.completed},${t.pending},${t.overdue}\n`;
        });
        csvContent += '\n';
      }
      
      if (data.chatReports) {
        csvContent += '=== COMMUNICATION ===\n';
        csvContent += 'Week,Messages,Files,Active Users,Avg Response Time\n';
        data.chatReports.forEach(c => {
          csvContent += `${c.week},${c.messages},${c.files},${c.activeUsers},${c.avgResponseTime}\n`;
        });
        csvContent += '\n';
      }
      
      if (data.contactReports) {
        csvContent += '=== CONTACTS ===\n';
        csvContent += 'Category,Total,Active,New,Interactions\n';
        data.contactReports.forEach(c => {
          csvContent += `${c.category},${c.total},${c.active},${c.newThisMonth},${c.interactions}\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `RayERP-Complete-Report-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);
      return;
    }
    
    switch (data.selectedReport) {
      case 'employees':
        exportData = data.employeeData?.map(emp => ({
          Name: emp.name,
          Department: emp.department,
          'Tasks Completed': emp.tasksCompleted,
          'Hours Worked': emp.hoursWorked,
          'Efficiency (%)': emp.efficiency,
          'Attendance (%)': emp.attendance
        })) || [];
        break;
      case 'projects':
        exportData = data.projectReports?.map(project => ({
          'Project Name': project.name,
          Status: project.status,
          'Progress (%)': project.progress,
          Budget: project.budget,
          'Amount Spent': project.spent,
          'Team Size': project.team,
          'Due Date': project.dueDate
        })) || [];
        break;
      case 'tasks':
        exportData = data.taskAnalytics?.map(task => ({
          Category: task.category,
          Total: task.total,
          Completed: task.completed,
          Pending: task.pending,
          Overdue: task.overdue,
          'Completion Rate (%)': Math.round((task.completed / task.total) * 100)
        })) || [];
        break;
      case 'chat':
        exportData = data.chatReports?.map(chat => ({
          Week: chat.week,
          Messages: chat.messages,
          'Files Shared': chat.files,
          'Active Users': chat.activeUsers,
          'Avg Response Time (min)': chat.avgResponseTime
        })) || [];
        break;
      case 'contacts':
        exportData = data.contactReports?.map(contact => ({
          Category: contact.category,
          Total: contact.total,
          Active: contact.active,
          'New This Month': contact.newThisMonth,
          Interactions: contact.interactions
        })) || [];
        break;
      default:
        exportData = [
          { Metric: 'Total Employees', Value: '24', Change: '+2 this month' },
          { Metric: 'Active Projects', Value: '12', Change: '3 completing this month' },
          { Metric: 'Total Tasks', Value: '346', Change: '78% completion rate' },
          { Metric: 'Monthly Revenue', Value: '?189K', Change: '+12% from last month' }
        ];
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const finalCsv = csvContent + csv;
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    
    const filename = `${data.selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, filename);
  } catch (error) {
    console.error('CSV Export Error:', error);
    throw new Error('Failed to generate CSV file. Please try again.');
  }
};

export const exportToText = (data: ExportData): void => {
  try {
    let content = `${data.selectedReport.toUpperCase()} REPORT\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Date Range: ${data.dateRange}\n`;
    content += `Department: ${data.department}\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    switch (data.selectedReport) {
      case 'employees':
        content += 'EMPLOYEE PERFORMANCE ANALYSIS\n';
        content += '================================\n\n';
        content += `Total Employees Analyzed: ${data.employeeData?.length || 0}\n\n`;
        data.employeeData?.forEach((emp, index) => {
          content += `${index + 1}. ${emp.name}\n`;
          content += `   Department: ${emp.department}\n`;
          content += `   Tasks Completed: ${emp.tasksCompleted}\n`;
          content += `   Hours Worked: ${emp.hoursWorked}\n`;
          content += `   Efficiency Rating: ${emp.efficiency}%\n`;
          content += `   Attendance Rate: ${emp.attendance}%\n`;
          content += `   Performance: ${emp.efficiency >= 90 ? 'Excellent' : emp.efficiency >= 80 ? 'Good' : 'Needs Improvement'}\n\n`;
        });
        break;
        
      case 'projects':
        content += 'PROJECT STATUS & BUDGET ANALYSIS\n';
        content += '================================\n\n';
        content += `Total Projects: ${data.projectReports?.length || 0}\n\n`;
        data.projectReports?.forEach((project, index) => {
          const budgetUsed = ((project.spent / project.budget) * 100).toFixed(1);
          content += `${index + 1}. ${project.name}\n`;
          content += `   Current Status: ${project.status}\n`;
          content += `   Progress Completion: ${project.progress}%\n`;
          content += `   Total Budget: $${project.budget.toLocaleString()}\n`;
          content += `   Amount Spent: $${project.spent.toLocaleString()} (${budgetUsed}%)\n`;
          content += `   Remaining Budget: $${(project.budget - project.spent).toLocaleString()}\n`;
          content += `   Team Size: ${project.team} members\n`;
          content += `   Due Date: ${project.dueDate}\n\n`;
        });
        break;
        
      case 'tasks':
        content += 'TASK PERFORMANCE ANALYTICS\n';
        content += '==========================\n\n';
        let totalTasks = 0, totalCompleted = 0;
        data.taskAnalytics?.forEach(task => {
          totalTasks += task.total;
          totalCompleted += task.completed;
        });
        content += `Overall Task Statistics:\n`;
        content += `Total Tasks: ${totalTasks}\n`;
        content += `Completed: ${totalCompleted}\n`;
        content += `Overall Completion Rate: ${totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%\n\n`;
        
        data.taskAnalytics?.forEach((task, index) => {
          const completionRate = Math.round((task.completed / task.total) * 100);
          content += `${index + 1}. ${task.category} Department\n`;
          content += `   Total Tasks: ${task.total}\n`;
          content += `   Completed: ${task.completed}\n`;
          content += `   In Progress: ${task.pending}\n`;
          content += `   Overdue: ${task.overdue}\n`;
          content += `   Completion Rate: ${completionRate}%\n`;
          content += `   Status: ${completionRate >= 80 ? 'On Track' : completionRate >= 60 ? 'Needs Attention' : 'Critical'}\n\n`;
        });
        break;
        
      case 'chat':
        content += 'COMMUNICATION & COLLABORATION ANALYTICS\n';
        content += '======================================\n\n';
        let totalMessages = 0, totalFiles = 0;
        data.chatReports?.forEach(chat => {
          totalMessages += chat.messages;
          totalFiles += chat.files;
        });
        content += `Communication Summary:\n`;
        content += `Total Messages: ${totalMessages}\n`;
        content += `Total Files Shared: ${totalFiles}\n\n`;
        
        data.chatReports?.forEach((chat) => {
          content += `${chat.week} Performance:\n`;
          content += `   Messages Sent: ${chat.messages}\n`;
          content += `   Files Shared: ${chat.files}\n`;
          content += `   Active Users: ${chat.activeUsers}\n`;
          content += `   Average Response Time: ${chat.avgResponseTime} minutes\n`;
          content += `   Engagement Level: ${chat.messages > 1200 ? 'High' : chat.messages > 800 ? 'Medium' : 'Low'}\n\n`;
        });
        break;
        
      case 'contacts':
        content += 'CONTACT MANAGEMENT & ENGAGEMENT REPORT\n';
        content += '=====================================\n\n';
        let totalContacts = 0, totalActive = 0;
        data.contactReports?.forEach(contact => {
          totalContacts += contact.total;
          totalActive += contact.active;
        });
        content += `Contact Overview:\n`;
        content += `Total Contacts: ${totalContacts}\n`;
        content += `Active Contacts: ${totalActive}\n`;
        content += `Overall Activity Rate: ${totalContacts > 0 ? Math.round((totalActive / totalContacts) * 100) : 0}%\n\n`;
        
        data.contactReports?.forEach((contact, index) => {
          const activityRate = Math.round((contact.active / contact.total) * 100);
          content += `${index + 1}. ${contact.category}\n`;
          content += `   Total Contacts: ${contact.total}\n`;
          content += `   Active Contacts: ${contact.active}\n`;
          content += `   New This Month: ${contact.newThisMonth}\n`;
          content += `   Total Interactions: ${contact.interactions}\n`;
          content += `   Activity Rate: ${activityRate}%\n`;
          content += `   Engagement Level: ${activityRate >= 80 ? 'High' : activityRate >= 60 ? 'Medium' : 'Low'}\n\n`;
        });
        break;
        
      default:
        content += 'EXECUTIVE DASHBOARD OVERVIEW\n';
        content += '============================\n\n';
        content += 'Key Performance Indicators:\n\n';
        content += '?? WORKFORCE METRICS\n';
        content += '   • Total Employees: 24 (+2 this month)\n';
        content += '   • Department Coverage: 5 departments\n';
        content += '   • Average Attendance: 95.1%\n\n';
        content += '?? PROJECT METRICS\n';
        content += '   • Active Projects: 12 (3 completing this month)\n';
        content += '   • Project Success Rate: 85%\n';
        content += '   • On-time Delivery: 78%\n\n';
        content += '? TASK METRICS\n';
        content += '   • Total Tasks: 346\n';
        content += '   • Completion Rate: 78%\n';
        content += '   • Overdue Tasks: 15\n\n';
        content += '?? FINANCIAL METRICS\n';
        content += '   • Monthly Revenue: ?189K (+12% growth)\n';
        content += '   • Budget Utilization: 85%\n';
        content += '   • Cost Efficiency: 92%\n\n';
    }
    
    content += `\n${'='.repeat(60)}\n`;
    content += `Report generated by RayERP System\n`;
    content += `End of ${data.selectedReport.toUpperCase()} Report\n`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const filename = `${data.selectedReport}-report-${new Date().toISOString().split('T')[0]}.txt`;
    saveAs(blob, filename);
  } catch (error) {
    console.error('Text Export Error:', error);
    throw new Error('Failed to generate text file. Please try again.');
  }
};
