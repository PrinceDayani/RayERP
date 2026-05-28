import ReportingSchedule from '../models/ReportingSchedule';
import DailyReport from '../models/DailyReport';
import Project from '../models/Project';
import Notification from '../models/Notification';

/**
 * Reporting Reminder Service
 * Checks for overdue reports and sends notifications.
 * Can be triggered by a cron job or called manually via API.
 */

export const checkOverdueReports = async () => {
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find active schedules where due time has passed
    const schedules = await ReportingSchedule.find({ isActive: true })
      .populate('requiredFrom.user', 'name email')
      .populate('project', 'name team managers');

    const results: { reminders: number; escalations: number } = { reminders: 0, escalations: 0 };

    for (const schedule of schedules) {
      // Check if today is a reporting day based on frequency
      if (!isReportingDay(schedule.frequency, schedule.dueDay, schedule.dueDateOfMonth)) {
        continue;
      }

      // Check if due time has passed
      if (currentTime < schedule.dueTime) {
        // Check if we should send a reminder (before due time)
        if (schedule.reminderEnabled) {
          const dueMinutes = timeToMinutes(schedule.dueTime);
          const currentMinutes = timeToMinutes(currentTime);
          const diff = dueMinutes - currentMinutes;

          if (diff > 0 && diff <= schedule.reminderBeforeMinutes) {
            // Send reminders to those who haven't reported yet
            const missing = await getMissingReporters(schedule.project._id || schedule.project, schedule);
            for (const userId of missing) {
              await sendNotification(
                userId,
                'report_reminder',
                `Your daily report for project is due in ${diff} minutes`,
                schedule.project._id || schedule.project
              );
              results.reminders++;
            }
          }
        }
        continue;
      }

      // Due time has passed — check for missing reports
      if (schedule.escalateOnMiss) {
        const missing = await getMissingReporters(schedule.project._id || schedule.project, schedule);
        if (missing.length > 0 && schedule.escalateTo) {
          await sendNotification(
            schedule.escalateTo,
            'report_escalation',
            `${missing.length} team member(s) have not submitted their report today`,
            schedule.project._id || schedule.project
          );
          results.escalations++;
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking overdue reports:', error);
    throw error;
  }
};

function isReportingDay(frequency: string, dueDay?: number, dueDateOfMonth?: number): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday
  const dateOfMonth = now.getDate();

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return dayOfWeek === (dueDay ?? 5); // Default Friday
    case 'bi-weekly':
      // Every other week on the specified day
      const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
      return dayOfWeek === (dueDay ?? 5) && weekNumber % 2 === 0;
    case 'monthly':
      return dateOfMonth === (dueDateOfMonth ?? 28);
    default:
      return false;
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

async function getMissingReporters(projectId: any, schedule: any): Promise<string[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Get reports submitted today — reportedBy is now User._id
  const todayReports = await DailyReport.find({
    project: projectId,
    reportDate: { $gte: today, $lte: endOfDay }
  }).select('reportedBy');

  const reportedUserIds = new Set(todayReports.map(r => r.reportedBy.toString()));

  // Required reporters from schedule, or fall back to project.team (all User refs now)
  let requiredUserIds: string[] = [];
  if (schedule.requiredFrom && schedule.requiredFrom.length > 0) {
    requiredUserIds = schedule.requiredFrom
      .map((r: any) => (typeof r.user === 'object' ? r.user?._id?.toString() : r.user?.toString()))
      .filter(Boolean);
  } else if (schedule.project?.team && schedule.project.team.length > 0) {
    requiredUserIds = schedule.project.team.map((t: any) => t.toString());
  }

  return requiredUserIds.filter(id => !reportedUserIds.has(id));
}

async function sendNotification(userId: any, type: string, message: string, projectId: any) {
  try {
    // Check if Notification model exists
    if (Notification) {
      await Notification.create({
        user: userId,
        type,
        title: type === 'report_reminder' ? 'Report Reminder' : 'Report Overdue',
        message,
        relatedEntity: 'project',
        relatedId: projectId,
        isRead: false
      });
    }
  } catch (error) {
    // Notification model might not exist yet — log and continue
    console.log(`[ReportingReminder] Would notify ${userId}: ${message}`);
  }
}

export default { checkOverdueReports };
