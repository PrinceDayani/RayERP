# Settings Module - Complete Backend Documentation

## Overview
The Settings Module provides a comprehensive, production-ready backend for managing user preferences, admin configurations, and system-wide settings with real-time synchronization.

## Features

### ✨ Core Capabilities
- **Multi-Scope Settings**: User, Organization, and Global settings
- **Real-Time Sync**: WebSocket-based instant updates across devices
- **Validation**: Comprehensive input validation and sanitization
- **Service Layer**: Clean separation of business logic
- **Type Safety**: Full TypeScript support
- **Bulk Operations**: Efficient batch updates
- **Default Values**: Automatic fallback to defaults
- **Admin Panel**: System-wide configuration management

## Architecture

### Models

#### Settings Model (`Settings.ts`)
```typescript
{
  key: string;           // Setting identifier (e.g., 'appearance', 'notifications')
  value: any;            // Setting value (any JSON-serializable data)
  scope: SettingScope;   // 'user' | 'organization' | 'global'
  userId?: ObjectId;     // For user-scoped settings
  organizationId?: ObjectId; // For org-scoped settings
  createdAt: Date;
  updatedAt: Date;
}
```

#### AdminSettings Model (`AdminSettings.ts`)
```typescript
{
  general: {
    companyName: string;
    supportEmail: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
  };
  security: {
    requireMfa: boolean;
    passwordComplexity: string;
    sessionTimeout: string;
    maxLoginAttempts: string;
    allowPasswordReset: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    systemAlerts: boolean;
    userActivityAlerts: boolean;
    maintenanceAlerts: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: string;
    lastBackupDate: string;
    backupLocation: string;
  };
}
```

## API Endpoints

### User Settings

#### Get Settings
```http
GET /api/settings?scope=user&key=appearance&format=keyValue
Authorization: Bearer <token>
```

**Query Parameters:**
- `scope` (optional): Filter by scope (user/organization/global)
- `key` (optional): Filter by specific key
- `format` (optional): Response format ('array' | 'keyValue')

**Response:**
```json
{
  "appearance": {
    "theme": "dark",
    "compactMode": false,
    "fontSize": "medium"
  }
}
```

#### Update Setting
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "appearance",
  "value": {
    "theme": "dark",
    "compactMode": true
  },
  "scope": "user"
}
```

**Response:**
```json
{
  "_id": "...",
  "key": "appearance",
  "value": { "theme": "dark", "compactMode": true },
  "scope": "user",
  "userId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Bulk Update Settings
```http
PUT /api/settings/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": [
    { "key": "appearance", "value": { "theme": "dark" } },
    { "key": "notifications", "value": { "emailNotifications": true } }
  ],
  "scope": "user"
}
```

#### Reset Settings
```http
POST /api/settings/reset
Authorization: Bearer <token>
Content-Type: application/json

{
  "scope": "user"
}
```

#### Delete Setting
```http
DELETE /api/settings/:id
Authorization: Bearer <token>
```

### Admin Settings

#### Get Admin Settings
```http
GET /api/settings/admin
Authorization: Bearer <token>
Permission: system_settings
```

**Response:**
```json
{
  "general": {
    "companyName": "Your Company",
    "supportEmail": "support@company.com",
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD",
    "currency": "INR",
    "language": "en"
  },
  "security": { ... },
  "notifications": { ... },
  "backup": { ... }
}
```

#### Update Admin Settings
```http
PUT /api/settings/admin
Authorization: Bearer <token>
Permission: system_settings
Content-Type: application/json

{
  "section": "general",
  "data": {
    "companyName": "New Company Name",
    "timezone": "Asia/Kolkata"
  }
}
```

## Real-Time Events

### WebSocket Events

#### Client → Server
```javascript
// Authenticate socket
socket.emit('authenticate', token);

// Force sync settings
socket.emit('settings:force_sync', { userId });

// Track tab changes (analytics)
socket.emit('settings:tab_changed', { tab: 'appearance' });
```

#### Server → Client
```javascript
// Setting updated
socket.on('settings:updated', (data) => {
  // { key, value, scope, timestamp }
});

// Bulk update
socket.on('settings:bulk_updated', (data) => {
  // { settings: [...], timestamp }
});

// Settings reset
socket.on('settings:reset', (data) => {
  // { timestamp }
});

// Admin settings updated
socket.on('admin:settings_updated', (data) => {
  // { section, data, timestamp }
});

// Global settings updated
socket.on('settings:global_updated', (data) => {
  // { key, value, timestamp }
});
```

## Service Layer

### SettingsService

```typescript
import settingsService from './services/settingsService';

// Get settings
const settings = await settingsService.getSettings('user', userId, 'appearance');

// Get as key-value
const kvSettings = await settingsService.getSettingsAsKeyValue('user', userId);

// Update setting
await settingsService.updateSetting('theme', 'dark', 'user', userId);

// Bulk update
await settingsService.bulkUpdateSettings([
  { key: 'theme', value: 'dark' },
  { key: 'fontSize', value: 'large' }
], 'user', userId);

// Reset settings
await settingsService.resetSettings('user', userId);

// Initialize user with defaults
await settingsService.initializeUserSettings(userId);
```

## Utility Helpers

### SettingsHelper

```typescript
import { SettingsHelper } from './utils/settingsHelper';

// Get single setting with fallback
const theme = await SettingsHelper.getSetting('theme', 'user', userId, 'light');

// Check if setting exists
const exists = await SettingsHelper.settingExists('theme', 'user', userId);

// Get multiple settings
const settings = await SettingsHelper.getSettingsByKeys(
  ['theme', 'fontSize'], 
  'user', 
  userId
);

// Get admin setting
const companyName = await SettingsHelper.getAdminSetting('general', 'companyName');

// Merge with defaults
const merged = await SettingsHelper.getUserSettingsWithDefaults(userId, defaults);

// Export/Import for backup
const exported = await SettingsHelper.exportSettings('user', userId);
await SettingsHelper.importSettings(exported);

// Cleanup orphaned settings
const cleaned = await SettingsHelper.cleanupOrphanedSettings();

// Get statistics
const stats = await SettingsHelper.getSettingsStats();
```

## Validation Middleware

All endpoints are protected with validation:

- **validateSettingKey**: Ensures key format is valid (alphanumeric, underscores, dots)
- **validateSettingValue**: Checks value exists and size < 100KB
- **validateSettingScope**: Validates scope is valid enum value
- **validateBulkSettings**: Validates bulk operations (max 50 settings)
- **validateAdminSection**: Ensures admin section is valid

## Default User Settings

```typescript
{
  appearance: {
    theme: 'system',
    compactMode: false,
    fontSize: 'medium',
    sidebarCollapsed: false
  },
  notifications: {
    emailNotifications: true,
    orderNotifications: true,
    inventoryAlerts: true,
    weeklyReports: true,
    supplierUpdates: true
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30
  }
}
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Permission Checks**: Admin endpoints require `system_settings` permission
3. **User Isolation**: Users can only access/modify their own settings
4. **Input Validation**: Comprehensive validation on all inputs
5. **Size Limits**: Settings values limited to 100KB
6. **Rate Limiting**: Bulk operations limited to 50 settings

## Best Practices

### Frontend Integration

```typescript
// Initialize settings on user login
await settingsService.initializeUserSettings(userId);

// Subscribe to real-time updates
socket.on('settings:updated', (data) => {
  updateLocalSettings(data.key, data.value);
});

// Update setting with optimistic UI
const updateTheme = async (theme: string) => {
  // Update UI immediately
  setTheme(theme);
  
  try {
    // Persist to backend
    await settingsAPI.updateSetting('appearance', { theme }, 'user');
  } catch (error) {
    // Revert on error
    setTheme(previousTheme);
  }
};
```

### Performance Optimization

```typescript
// Use bulk updates for multiple settings
await settingsService.bulkUpdateSettings([
  { key: 'theme', value: 'dark' },
  { key: 'fontSize', value: 'large' },
  { key: 'compactMode', value: true }
], 'user', userId);

// Cache frequently accessed settings
const cache = new Map();
const getCachedSetting = async (key: string) => {
  if (cache.has(key)) return cache.get(key);
  const value = await SettingsHelper.getSetting(key, 'user', userId);
  cache.set(key, value);
  return value;
};
```

## Error Handling

```typescript
try {
  await settingsService.updateSetting('theme', 'dark', 'user', userId);
} catch (error) {
  if (error.message === 'Setting not found') {
    // Handle not found
  } else if (error.message === 'Not authorized') {
    // Handle authorization error
  } else {
    // Handle general error
  }
}
```

## Testing

```bash
# Test settings endpoints
curl -X GET http://localhost:5000/api/settings?scope=user \
  -H "Authorization: Bearer <token>"

# Update setting
curl -X PUT http://localhost:5000/api/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"theme","value":"dark","scope":"user"}'

# Get admin settings
curl -X GET http://localhost:5000/api/settings/admin \
  -H "Authorization: Bearer <token>"
```

## Maintenance

### Cleanup Orphaned Settings
```typescript
// Run periodically (e.g., daily cron job)
const cleaned = await SettingsHelper.cleanupOrphanedSettings();
console.log(`Cleaned ${cleaned} orphaned settings`);
```

### Backup Settings
```typescript
// Export all settings
const allSettings = await SettingsHelper.exportSettings();
fs.writeFileSync('settings-backup.json', JSON.stringify(allSettings));

// Restore from backup
const backup = JSON.parse(fs.readFileSync('settings-backup.json'));
await SettingsHelper.importSettings(backup);
```

## Summary

The Settings Module provides:
- ✅ Complete CRUD operations for settings
- ✅ Real-time synchronization across devices
- ✅ Admin panel for system configuration
- ✅ Comprehensive validation and security
- ✅ Service layer for clean architecture
- ✅ Utility helpers for common operations
- ✅ Full TypeScript support
- ✅ Production-ready with error handling

Perfect backend implementation for enterprise-grade settings management! 🚀
