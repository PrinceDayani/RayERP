# System Backup Guide

## Overview
The System Backup feature provides a comprehensive backup solution for the RayERP system, allowing administrators to create complete backups of all system data and files.

## Features

### Complete Data Backup
The system backup includes:
- **Employee Management**: All employee records, attendance data, and leave records
- **Project Management**: Projects, tasks, and project files
- **Contact Management**: All contact information and communication history
- **User Management**: User accounts, roles, and permissions (passwords excluded for security)
- **Financial Data**: Budgets, accounts, transactions, invoices, payments, and expenses
- **System Configuration**: Departments, settings, and system configurations
- **Communication**: Chat messages and activity logs
- **File Storage**: All uploaded files and documents

### Security Features
- **Role-Based Access**: Only ROOT, SUPER_ADMIN, and ADMIN roles can create backups
- **Password Protection**: User passwords are excluded from backups for security
- **Secure Download**: Files are streamed directly to prevent server storage issues

## How to Use

### From Admin Dashboard
1. Navigate to **Dashboard > Admin > Overview**
2. Click on the **System Backup** quick action button
3. You'll be redirected to the dedicated backup page
4. Click **Download System Backup** to start the process

### From Backup Page
1. Navigate directly to `/dashboard/backup`
2. Review the backup information and included data
3. Click **Download System Backup**
4. Wait for the backup to be created and downloaded

## Technical Details

### Backup Format
- **File Format**: ZIP archive
- **Compression**: Level 9 (maximum compression)
- **File Structure**:
  ```
  erp-backup-YYYY-MM-DDTHH-mm-ss.zip
  ├── employees.json
  ├── projects.json
  ├── tasks.json
  ├── contacts.json
  ├── users.json
  ├── attendance.json
  ├── departments.json
  ├── budgets.json
  ├── roles.json
  ├── accounts.json
  ├── activity-logs.json
  ├── chats.json
  ├── leaves.json
  ├── transactions.json
  ├── invoices.json
  ├── payments.json
  ├── expenses.json
  ├── settings.json
  ├── backup-info.json
  ├── uploads/
  └── public-uploads/
  ```

### API Endpoints
- **GET** `/api/backup/download` - Download system backup
- **Authentication**: Bearer token required
- **Permissions**: ROOT, SUPER_ADMIN, or ADMIN role required

### Performance Considerations
- **Timeout**: 5-minute timeout for large backups
- **Memory**: Streams data to prevent memory issues
- **File Size**: Depends on system data and uploaded files
- **Processing Time**: Varies based on data volume

## Backup Information File
Each backup includes a `backup-info.json` file with metadata:
```json
{
  "backupDate": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "totalRecords": {
    "employees": 150,
    "projects": 45,
    "tasks": 320,
    "contacts": 200,
    "users": 75,
    "attendance": 5000,
    "departments": 12,
    "budgets": 25,
    "roles": 8,
    "accounts": 50,
    "activityLogs": 10000,
    "chats": 500,
    "leaves": 200,
    "transactions": 1000,
    "invoices": 300,
    "payments": 250,
    "expenses": 400,
    "settings": 15
  }
}
```

## Best Practices

### Regular Backups
- **Frequency**: Create backups regularly (daily/weekly)
- **Scheduling**: Consider automated backup scheduling
- **Storage**: Store backups in secure, off-site locations

### Security
- **Access Control**: Limit backup access to authorized personnel only
- **Encryption**: Consider encrypting backup files for additional security
- **Audit Trail**: Monitor backup creation through activity logs

### Storage Management
- **File Naming**: Backups are automatically timestamped
- **Retention**: Implement backup retention policies
- **Verification**: Periodically verify backup integrity

## Troubleshooting

### Common Issues

#### Backup Fails to Start
- **Check Permissions**: Ensure user has admin privileges
- **Authentication**: Verify user is logged in with valid token
- **Server Status**: Check if backend server is running

#### Download Interrupted
- **Network**: Check internet connection stability
- **Timeout**: Large backups may take several minutes
- **Browser**: Try using a different browser

#### Empty or Corrupted Backup
- **Database Connection**: Verify database connectivity
- **File Permissions**: Check server file system permissions
- **Disk Space**: Ensure sufficient server disk space

### Error Messages
- **"Authentication required"**: User needs to log in again
- **"Access denied"**: User lacks admin privileges
- **"Failed to create backup"**: Server-side error, check logs
- **"Network error"**: Connection issue between client and server

## Development Notes

### Backend Implementation
- **Controller**: `src/controllers/backupController.ts`
- **Routes**: `src/routes/backupRoutes.ts`
- **Models**: All Mongoose models are included

### Frontend Implementation
- **Component**: `src/components/SystemBackup.tsx`
- **API Client**: `src/lib/api/backupAPI.ts`
- **Page**: `src/app/dashboard/backup/page.tsx`

### Testing
- **Test Script**: `backend/test-backup.js`
- **Manual Testing**: Use admin dashboard or direct page access
- **API Testing**: Test endpoints with proper authentication

## Future Enhancements

### Planned Features
- **Scheduled Backups**: Automatic backup scheduling
- **Incremental Backups**: Only backup changed data
- **Cloud Storage**: Direct upload to cloud storage services
- **Backup Restoration**: Restore system from backup files
- **Compression Options**: Different compression levels
- **Selective Backup**: Choose specific data types to backup

### Configuration Options
- **Backup Frequency**: Configurable backup intervals
- **Retention Policies**: Automatic old backup cleanup
- **Notification System**: Email alerts for backup status
- **Progress Tracking**: Real-time backup progress updates

## Support
For issues or questions regarding the backup system:
1. Check the troubleshooting section above
2. Review server logs for detailed error information
3. Verify user permissions and authentication
4. Contact system administrator for assistance