# Roles Dropdown Fix - User Creation

## Problem
Roles were not visible in the dropdown when creating a new user/account because the `fetchRoles` function was not properly receiving the authentication token.

## Root Cause
The `fetchRoles` function in `AuthContext.tsx` was relying on the `token` state variable which might not be set yet when called from the initial `useEffect` hook. This caused the API call to fail silently.

## Solution
Modified the `fetchRoles` function to accept an optional `authToken` parameter and updated all calls to pass the token explicitly:

### Changes Made

1. **Updated `fetchRoles` function signature**:
   ```typescript
   const fetchRoles = async (authToken?: string) => {
     const tokenToUse = authToken || token || localStorage.getItem('auth-token');
     if (!tokenToUse) return;
     // ... rest of the function
   }
   ```

2. **Updated initial load in useEffect**:
   ```typescript
   useEffect(() => {
     const savedToken = localStorage.getItem('auth-token');
     if (savedToken) {
       setToken(savedToken);
       getCurrentUser(savedToken);
       fetchRoles(savedToken); // Pass token explicitly
     }
   }, []);
   ```

3. **Updated login function**:
   ```typescript
   if (response.ok && data.success) {
     // ... set user and token
     await fetchRoles(data.token); // Fetch roles after login
     return true;
   }
   ```

4. **Updated getCurrentUser function**:
   ```typescript
   if (data.success) {
     setUser(data.user);
     setIsAuthenticated(true);
     await fetchRoles(authToken); // Fetch roles after getting user
   }
   ```

## Files Modified
- `frontend/src/contexts/AuthContext.tsx`

## Testing
1. Login to the application
2. Navigate to Users section
3. Click "Create User" button
4. Verify that the Role dropdown now shows all available roles
5. Select a role and create a user successfully

## API Endpoint Used
- `GET /api/rbac/roles` - Fetches all roles from the backend

## Backend Verification
The backend endpoint is already properly configured:
- Route: `backend/src/routes/rbac.routes.ts`
- Controller: `backend/src/controllers/rbacController.ts`
- Function: `getRoles()` - Returns all roles sorted by level

## Result
✅ Roles now load correctly when creating a user
✅ Dropdown shows all available roles based on user's permission level
✅ User creation works as expected with role assignment
