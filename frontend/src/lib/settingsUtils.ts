// path: frontend/src/lib/settingsUtils.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
});

export const loadProfileSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/api/settings?scope=user&key=profile&format=keyValue`, {
      headers: getAuthHeaders()
    });
    
    if (response.status === 404) {
      return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        bio: ''
      };
    }
    
    if (!response.ok) throw new Error('Failed to load settings');
    
    const data = await response.json();
    return data.profile || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      bio: ''
    };
  } catch (error) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      bio: ''
    };
  }
};

export const saveProfileSettings = async (profileData: any) => {
  const response = await fetch(`${API_URL}/api/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ key: 'profile', value: profileData, scope: 'user' })
  });
  
  if (!response.ok) throw new Error('Failed to save settings');
  return response.json();
};

export const loadAppearanceSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/api/settings?scope=user&key=appearance&format=keyValue`, {
      headers: getAuthHeaders()
    });
    
    if (response.status === 404) {
      return {
        theme: 'system',
        compactMode: false,
        fontSize: 'medium',
        sidebarCollapsed: false
      };
    }
    
    if (!response.ok) throw new Error('Failed to load settings');
    
    const data = await response.json();
    return data.appearance || {
      theme: 'system',
      compactMode: false,
      fontSize: 'medium',
      sidebarCollapsed: false
    };
  } catch (error) {
    return {
      theme: 'system',
      compactMode: false,
      fontSize: 'medium',
      sidebarCollapsed: false
    };
  }
};

export const loadNotificationSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/api/settings?scope=user&key=notifications&format=keyValue`, {
      headers: getAuthHeaders()
    });
    
    if (response.status === 404) {
      return {
        emailNotifications: true,
        orderNotifications: true,
        inventoryAlerts: true,
        weeklyReports: true,
        supplierUpdates: true
      };
    }
    
    if (!response.ok) throw new Error('Failed to load settings');
    
    const data = await response.json();
    return data.notifications || {
      emailNotifications: true,
      orderNotifications: true,
      inventoryAlerts: true,
      weeklyReports: true,
      supplierUpdates: true
    };
  } catch (error) {
    return {
      emailNotifications: true,
      orderNotifications: true,
      inventoryAlerts: true,
      weeklyReports: true,
      supplierUpdates: true
    };
  }
};