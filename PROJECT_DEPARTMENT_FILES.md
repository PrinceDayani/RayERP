# Project Department & File Sharing Feature

## Overview
This feature allows you to assign departments to projects and share files per project with specific departments.

## Features Implemented

### 1. Department Assignment to Projects
- Projects can now be assigned to multiple departments
- Departments are selected during project creation
- Departments can be updated when editing projects
- Department information is displayed in project details

### 2. File Sharing with Departments
- Upload files to projects with department-specific sharing
- Select which departments can access each file
- View department access information for each file
- Download and delete files with proper access control

## Backend Changes

### Models Updated

#### Project Model (`backend/src/models/Project.ts`)
```typescript
departments: mongoose.Types.ObjectId[]  // Array of department references
```

#### ProjectFile Model (`backend/src/models/ProjectFile.ts`)
```typescript
sharedWithDepartments: mongoose.Types.ObjectId[]  // Array of department references
```

### Controllers Updated

#### Project Controller (`backend/src/controllers/projectController.ts`)
- Added department population to all project queries
- Included departments in project creation and updates
- Departments are now part of project response data

#### ProjectFile Controller (`backend/src/controllers/projectFileController.ts`)
- Added `sharedWithDepartments` parameter to file upload
- Populates department information when fetching files
- Stores department sharing preferences with each file

## Frontend Changes

### Components Created

#### 1. FileUploadWithDepartments Component
**Location:** `frontend/src/components/projects/FileUploadWithDepartments.tsx`

**Features:**
- File selection with validation
- Department selection checkboxes
- Upload progress indication
- Success/error notifications

**Usage:**
```tsx
<FileUploadWithDepartments
  projectId={projectId}
  onUploadSuccess={fetchFiles}
  open={uploadDialogOpen}
  onOpenChange={setUploadDialogOpen}
/>
```

#### 2. ProjectFilesTab Component
**Location:** `frontend/src/components/projects/ProjectFilesTab.tsx`

**Features:**
- Display all project files
- Show file metadata (size, uploader, date)
- Display shared departments as badges
- Download and delete file actions
- Empty state with upload prompt

**Usage:**
```tsx
<ProjectFilesTab projectId={projectId} />
```

### Pages Updated

#### 1. Create Project Page
**Location:** `frontend/src/app/dashboard/projects/create/page.tsx`

**Changes:**
- Added department selection section
- Fetches available departments from API
- Allows multi-select of departments
- Shows selected department count

#### 2. Edit Project Page
**Location:** `frontend/src/app/dashboard/projects/[id]/edit/page.tsx`

**Changes:**
- Includes departments in project data
- Passes departments to ProjectForm component
- Updates departments on save

#### 3. ProjectForm Component
**Location:** `frontend/src/components/projects/ProjectForm.tsx`

**Changes:**
- Added department selection UI
- Fetches departments on mount
- Handles department toggle
- Includes departments in form submission

## API Endpoints

### Project Endpoints
```
GET    /api/projects              - Get all projects (includes departments)
GET    /api/projects/:id          - Get project by ID (includes departments)
POST   /api/projects              - Create project (accepts departments array)
PUT    /api/projects/:id          - Update project (accepts departments array)
```

### File Endpoints
```
GET    /api/projects/:id/files                    - Get all files for project
POST   /api/projects/:id/files                    - Upload file with departments
GET    /api/projects/:id/files/:fileId/download   - Download file
DELETE /api/projects/:id/files/:fileId            - Delete file
```

### Department Endpoints
```
GET    /api/departments           - Get all departments
```

## Usage Guide

### Creating a Project with Departments

1. Navigate to Projects → Create New Project
2. Fill in basic project information
3. Scroll to "Departments" section
4. Click on departments to select/deselect
5. Selected departments will be highlighted
6. Click "Create Project"

### Uploading Files with Department Sharing

1. Open a project
2. Navigate to the Files tab
3. Click "Upload File" button
4. Select a file from your computer
5. (Optional) Select departments to share with
6. Click "Upload File"
7. File will be uploaded and shared with selected departments

### Viewing File Department Access

1. Open a project
2. Navigate to the Files tab
3. Each file shows department badges indicating which departments have access
4. Files without department badges are accessible to all project members

### Editing Project Departments

1. Open a project
2. Click "Edit" button
3. Scroll to "Departments" section
4. Select/deselect departments
5. Click "Update Project"

## Data Structure

### Project with Departments
```json
{
  "_id": "project_id",
  "name": "Project Name",
  "description": "Project Description",
  "departments": [
    {
      "_id": "dept_id_1",
      "name": "Engineering",
      "description": "Engineering Department"
    },
    {
      "_id": "dept_id_2",
      "name": "Marketing",
      "description": "Marketing Department"
    }
  ],
  ...
}
```

### File with Department Sharing
```json
{
  "_id": "file_id",
  "originalName": "document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf",
  "uploadedBy": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe"
  },
  "sharedWithDepartments": [
    {
      "_id": "dept_id_1",
      "name": "Engineering"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Security Considerations

1. **Authentication Required:** All file operations require valid authentication token
2. **Project Access Control:** Users must have access to the project to upload/download files
3. **Department Validation:** Department IDs are validated against existing departments
4. **File Type Restrictions:** Only allowed file types can be uploaded
5. **File Size Limits:** Maximum file size is 50MB

## File Type Support

**Allowed file types:**
- Images: .jpg, .jpeg, .png, .gif
- Documents: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt
- Archives: .zip, .rar

## Future Enhancements

1. **Department-based Access Control:** Restrict file downloads based on user's department
2. **File Versioning:** Track file versions and changes
3. **File Comments:** Add commenting system for files
4. **Bulk Upload:** Upload multiple files at once
5. **File Preview:** Preview files without downloading
6. **Advanced Search:** Search files by name, department, or uploader
7. **File Sharing Links:** Generate shareable links for files
8. **Storage Analytics:** Track storage usage per project/department

## Troubleshooting

### Files not showing departments
- Ensure departments are populated in the API response
- Check that `sharedWithDepartments` is included in the file query

### Cannot upload files
- Verify file size is under 50MB
- Check file type is in allowed list
- Ensure valid authentication token
- Verify project exists and user has access

### Departments not loading
- Check `/api/departments` endpoint is accessible
- Verify authentication token is valid
- Check browser console for errors

## Testing

### Manual Testing Steps

1. **Create Project with Departments:**
   - Create a new project
   - Select 2-3 departments
   - Verify departments are saved
   - Check project details show departments

2. **Upload File with Department Sharing:**
   - Open a project
   - Upload a file
   - Select specific departments
   - Verify file shows department badges

3. **Edit Project Departments:**
   - Edit an existing project
   - Change department selection
   - Save and verify changes

4. **Download and Delete Files:**
   - Download a file
   - Delete a file
   - Verify operations complete successfully

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Contact the development team
