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
}

export const exportToPDF = async (data: ExportData): Promise<void> => {
  try {
    // Create PDF with text content first
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${data.selectedReport.toUpperCase()} REPORT`, 20, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    pdf.text(`Date Range: ${data.dateRange} | Department: ${data.department}`, 20, 35);
    
    let yPosition = 50;
    
    // Add content based on report type
    switch (data.selectedReport) {
      case 'employees':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Employee Performance Analysis', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.employeeData?.forEach((emp, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${emp.name}`, 20, yPosition);
          pdf.text(`Department: ${emp.department}`, 30, yPosition + 5);
          pdf.text(`Tasks: ${emp.tasksCompleted} | Hours: ${emp.hoursWorked}`, 30, yPosition + 10);
          pdf.text(`Efficiency: ${emp.efficiency}% | Attendance: ${emp.attendance}%`, 30, yPosition + 15);
          yPosition += 25;
        });
        break;
        
      case 'projects':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Project Status & Budget Report', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.projectReports?.forEach((project, index) => {
          if (yPosition > 260) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${index + 1}. ${project.name}`, 20, yPosition);
          pdf.text(`Status: ${project.status} | Progress: ${project.progress}%`, 30, yPosition + 5);
          pdf.text(`Budget: $${project.budget.toLocaleString()} | Spent: $${project.spent.toLocaleString()}`, 30, yPosition + 10);
          pdf.text(`Team: ${project.team} members | Due: ${project.dueDate}`, 30, yPosition + 15);
          yPosition += 25;
        });
        break;
        
      case 'tasks':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Task Analytics Report', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.taskAnalytics?.forEach((task, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          const completionRate = Math.round((task.completed / task.total) * 100);
          pdf.text(`${index + 1}. ${task.category} Department`, 20, yPosition);
          pdf.text(`Total: ${task.total} | Completed: ${task.completed} | Pending: ${task.pending}`, 30, yPosition + 5);
          pdf.text(`Overdue: ${task.overdue} | Completion Rate: ${completionRate}%`, 30, yPosition + 10);
          yPosition += 20;
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
        pdf.text('Executive Dashboard Overview', 20, yPosition);
        yPosition += 15;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Performance Indicators:', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Workforce Metrics:', 20, yPosition);
        pdf.text('• Total Employees: 24 (+2 this month)', 30, yPosition + 5);
        pdf.text('• Average Attendance: 95.1%', 30, yPosition + 10);
        yPosition += 20;
        
        pdf.text('Project Metrics:', 20, yPosition);
        pdf.text('• Active Projects: 12 (3 completing this month)', 30, yPosition + 5);
        pdf.text('• Project Success Rate: 85%', 30, yPosition + 10);
        yPosition += 20;
        
        pdf.text('Task Metrics:', 20, yPosition);
        pdf.text('• Total Tasks: 346', 30, yPosition + 5);
        pdf.text('• Completion Rate: 78%', 30, yPosition + 10);
        yPosition += 20;
        
        pdf.text('Financial Metrics:', 20, yPosition);
        pdf.text('• Monthly Revenue: $189K (+12% growth)', 30, yPosition + 5);
        pdf.text('• Budget Utilization: 85%', 30, yPosition + 10);
    }
    
    // Try to add visual content if available
    try {
      const element = document.getElementById('report-content');
      if (element) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const canvas = await html2canvas(element, {
          scale: 0.8,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#111827',
          logging: false,
          height: Math.min(element.scrollHeight, 1200)
        });
        
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          pdf.addPage();
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Visual Analytics', 20, 20);
          
          const imgData = canvas.toDataURL('image/png', 0.8);
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (imgHeight <= 250) {
            pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
          } else {
            const scaledHeight = 250;
            const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
            pdf.addImage(imgData, 'PNG', 20, 30, scaledWidth, scaledHeight);
          }
        }
      }
    } catch (visualError) {
      console.warn('Could not add visual content to PDF:', visualError);
    }
    
    // Generate filename and save
    const filename = `${data.selectedReport}-report-${new Date().toISOString().split('T')[0]}.pdf`;
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
          { Metric: 'Monthly Revenue', Value: '$189K', Change: '+12% from last month' }
        ];
        const overviewWs = XLSX.utils.json_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');
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
          { Metric: 'Monthly Revenue', Value: '$189K', Change: '+12% from last month' }
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
        content += '📊 WORKFORCE METRICS\n';
        content += '   • Total Employees: 24 (+2 this month)\n';
        content += '   • Department Coverage: 5 departments\n';
        content += '   • Average Attendance: 95.1%\n\n';
        content += '🎯 PROJECT METRICS\n';
        content += '   • Active Projects: 12 (3 completing this month)\n';
        content += '   • Project Success Rate: 85%\n';
        content += '   • On-time Delivery: 78%\n\n';
        content += '✅ TASK METRICS\n';
        content += '   • Total Tasks: 346\n';
        content += '   • Completion Rate: 78%\n';
        content += '   • Overdue Tasks: 15\n\n';
        content += '💰 FINANCIAL METRICS\n';
        content += '   • Monthly Revenue: $189K (+12% growth)\n';
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