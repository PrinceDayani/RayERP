# Contacts Visibility Levels Implementation

## Overview
Implemented a three-tier visibility system for contacts in RayERP:
- **Universal**: Visible to all users
- **Departmental**: Visible only to users in the same department
- **Personal**: Visible only to the creator
- **Root Access**: Root users can see all contacts regardless of visibility level

## Backend Changes

### 1. Contact Model (`backend/src/models/Contact.ts`)
**Added Fields:**
- `visibilityLevel`: enum ['universal', 'departmental', 'personal'] - Required field, defaults to 'personal'
- `department`: ObjectId reference to Department model (required for departmental contacts)

**Updated Fields:**
- Changed `department` from String to ObjectId reference
- Added `createdBy` population support

**Indexes:**
- Added indexes for `visibilityLevel` and `department` for optimized queries

### 2. Contact Controller (`backend/src/controllers/contactController.ts`)
**Updated Functions:**

#### `getContacts()`
- Implements visibility filtering based on user role and department
- Root users see all contacts
- Regular users see:
  - All universal contacts
  - Their personal contacts
  - Departmental contacts if they belong to a department

#### `getContactById()`
- Added visibility permission checks
- Validates user access before returning contact details

#### `createContact()`
- Validates department requirement for departmental contacts
- Populates department and createdBy fields in response

#### `updateContact()`
- Only creator can update contacts
- Validates department requirement when changing visibility level

#### `deleteContact()`
- Only creator can delete contacts

#### `searchContacts()` & `filterContacts()`
- Apply visibility filters to search and filter results
- Respect user permissions and department access

#### `getContactStats()`
- Returns department list for dropdown
- Includes visibility levels in filter options

## Frontend Changes

### 1. Contact Type Definition (`frontend/src/lib/api/contactsAPI.ts`)
**Updated Interface:**
```typescript
export interface Contact {
  // ... existing fields
  visibilityLevel?: 'universal' | 'departmental' | 'personal';
  department?: { _id: string; name: string } | string;
  createdBy?: { _id: string; name: string; email: string } | string;
}
```

**Updated Filter Options:**
- Added `visibilityLevels` array
- Changed `departments` to array of objects with `_id` and `name`

### 2. Contact Form (`frontend/src/components/Forms/ContactForm.tsx`)
**New Features:**
- Visibility level selector with descriptions
- Department dropdown (shown only for departmental visibility)
- Fetches departments from API on component mount
- Validates department requirement for departmental contacts
- Removed standalone department text input (now uses dropdown for departmental contacts)

**Form Fields:**
```typescript
visibilityLevel: 'personal' | 'departmental' | 'universal'
department: string (ObjectId when departmental)
```

### 3. Contacts Page (`frontend/src/app/dashboard/contacts/page.tsx`)
**Visual Indicators:**
- Added visibility level badges to contact cards:
  - 🌐 Universal (blue)
  - 🏢 Departmental (purple)
  - 👤 Personal (gray)

## Usage Guide

### Creating Contacts

1. **Personal Contact** (Default)
   - Select "Personal - Only visible to you"
   - No department required
   - Only you can see and manage this contact

2. **Departmental Contact**
   - Select "Departmental - Visible to your department"
   - **Must select a department** from dropdown
   - All users in the selected department can view
   - Only creator can edit/delete

3. **Universal Contact**
   - Select "Universal - Visible to everyone"
   - No department required
   - All users in the system can view
   - Only creator can edit/delete

### Permissions Matrix

| Action | Personal | Departmental | Universal | Root |
|--------|----------|--------------|-----------|------|
| View Own | ✅ Creator | ✅ Creator | ✅ Creator | ✅ All |
| View Dept | ❌ | ✅ Same Dept | ✅ All Users | ✅ All |
| View All | ❌ | ❌ | ✅ All Users | ✅ All |
| Edit | ✅ Creator | ✅ Creator | ✅ Creator | ✅ Creator |
| Delete | ✅ Creator | ✅ Creator | ✅ Creator | ✅ Creator |

## Database Migration

**Migration Required for Existing Contacts**

Run the migration script to add `visibilityLevel` to existing contacts:

```bash
cd backend
node scripts/migrateContactVisibility.js
```

This script will:
- Set `visibilityLevel: 'personal'` for all existing contacts
- Maintain existing `createdBy` references
- Keep department field as `null` for non-departmental contacts

**Migration Status**: ✅ Completed (155 contacts migrated)

## API Endpoints

All existing endpoints remain the same:
- `GET /api/contacts` - Returns filtered contacts based on visibility
- `GET /api/contacts/:id` - Returns contact if user has access
- `POST /api/contacts` - Creates contact with visibility level
- `PUT /api/contacts/:id` - Updates contact (creator only)
- `DELETE /api/contacts/:id` - Deletes contact (creator only)
- `GET /api/contacts/search` - Searches with visibility filter
- `GET /api/contacts/filter` - Filters with visibility support
- `GET /api/contacts/stats` - Returns stats and filter options

## Security Features

1. **Access Control**: Visibility enforced at database query level
2. **Creator Validation**: Only creators can modify/delete contacts
3. **Department Validation**: Departmental contacts require valid department
4. **Root Override**: Root users have full visibility for administration

## Testing Checklist

- [ ] Create personal contact - verify only creator sees it
- [ ] Create departmental contact - verify department members see it
- [ ] Create universal contact - verify all users see it
- [ ] Root user can see all contacts
- [ ] Non-creator cannot edit/delete contacts
- [ ] Department dropdown populates correctly
- [ ] Validation prevents departmental contact without department
- [ ] Visibility badges display correctly
- [ ] Search respects visibility levels
- [ ] Filters respect visibility levels

## Future Enhancements

1. **Bulk Visibility Change**: Allow changing visibility for multiple contacts
2. **Department Transfer**: Move contacts between departments
3. **Visibility History**: Track visibility level changes
4. **Advanced Permissions**: Role-based edit permissions
5. **Shared Contacts**: Allow specific users to co-manage contacts
