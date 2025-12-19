# Test Document Upload

## Quick Test Steps

1. **Login to the system**
   - Go to http://localhost:3001/login
   - Login with your credentials
   - Get the auth token from localStorage

2. **Navigate to Documents**
   - Go to http://localhost:3001/dashboard/finance/documents
   - You should see the documents page

3. **Test Upload**
   - Click "Upload Document" button
   - Select any file (PDF, DOC, XLS, JPG, PNG)
   - Wait for "Document uploaded successfully!" alert
   - Document should appear in the list

4. **Test View**
   - Click the Eye icon on any document
   - Modal should open with document details
   - Click "Download" or "Open in New Tab"

5. **Test Download**
   - Click the Download icon
   - File should open in new tab

6. **Test Delete**
   - Click the Trash icon
   - Confirm deletion
   - Document should be removed

## Troubleshooting

### If upload doesn't work:

1. **Check browser console** (F12)
   - Look for error messages
   - Check if API call is being made

2. **Check backend logs**
   - Look for upload errors
   - Check if file is being saved

3. **Check auth token**
   ```javascript
   // In browser console
   localStorage.getItem('auth-token')
   ```

4. **Test API directly**
   ```bash
   # Get your token first
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   
   # Then test upload
   curl -X POST http://localhost:5000/api/finance-advanced/documents \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test.pdf" \
     -F "name=test.pdf" \
     -F "type=OTHER" \
     -F "entityType=GENERAL" \
     -F "entityId=none"
   ```

### If documents don't show:

1. **Check if backend is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check database connection**
   - Backend should show "MongoDB connected"

3. **Check API response**
   - Open browser DevTools → Network tab
   - Look for `/api/finance-advanced/documents` call
   - Check response data

## Expected Behavior

✅ Upload shows success alert  
✅ Document appears in list immediately  
✅ Stats update (Total, This Month)  
✅ View modal shows all details  
✅ Download opens file in new tab  
✅ Delete removes document after confirmation  

## Common Issues

### Issue: "Authentication required"
**Solution**: Make sure you're logged in and token is valid

### Issue: "Invalid file type"
**Solution**: Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT allowed

### Issue: "File too large"
**Solution**: Max file size is 10MB

### Issue: Upload succeeds but document not showing
**Solution**: 
1. Refresh the page
2. Check "All Documents" tab
3. Clear search filter

### Issue: Can't download file
**Solution**: 
1. Check if file exists in `backend/public/uploads/documents/`
2. Check backend logs for errors
3. Try "Open in New Tab" button in view modal
