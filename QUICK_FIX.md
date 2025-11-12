# QUICK FIX - 401 Error

## Run this in browser console (F12):

```javascript
localStorage.clear(); location.reload();
```

Then login again.

## Why?
Your stored token is invalid. This clears it and forces re-login.
