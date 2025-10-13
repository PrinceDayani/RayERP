interface ActivityLog {
  action: string;
  resource: string;
  details: string;
}

export const logActivity = async (activity: ActivityLog): Promise<void> => {
  try {
    // In a real implementation, this would send to the backend
    console.log('Activity logged:', activity);
    
    // Store in localStorage for demo purposes
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.push({
      ...activity,
      timestamp: new Date().toISOString(),
      user: 'Current User' // In real app, get from auth context
    });
    localStorage.setItem('activityLogs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};