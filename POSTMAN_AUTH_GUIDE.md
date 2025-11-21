# 🔐 Authentication Flow - Postman Testing Guide

## Authentication Data Flow

### 1. **Login Request** → POST `/api/auth/login`

**Endpoint:** `http://localhost:5000/api/auth/login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

### 2. **Backend Processing Flow**

```
Client (Postman)
    ↓ [POST] email + password
authController.login()
    ↓ Validates email & password exist
User.findOne({ email })
    ↓ Fetches user with password field
user.comparePassword(password)
    ↓ bcrypt.compare() - Verifies password hash
user.generateAuthToken()
    ↓ jwt.sign() - Creates JWT token
Response
    ↓ Returns: token + user data + sets cookie
Client receives token
```

### 3. **Login Response**

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Root",
      "level": 100,
      "permissions": [...]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 4. **Token Storage**

The backend sends the token in **TWO ways**:

1. **HTTP-Only Cookie** (automatic, secure)
   - Name: `token`
   - HttpOnly: `true`
   - Secure: `true` (production only)
   - SameSite: `strict` (production) / `lax` (development)
   - MaxAge: 30 days

2. **Response Body** (for manual storage)
   - Field: `token`
   - Use this for Authorization header

---

## 📮 Postman Testing Steps

### Step 1: Login Request

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`

2. **Set Headers**
   - Go to "Headers" tab
   - Add: `Content-Type: application/json`

3. **Set Body**
   - Go to "Body" tab
   - Select "raw" and "JSON"
   - Enter:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

4. **Send Request**
   - Click "Send"
   - Check response for `token` field

### Step 2: Using Token for Protected Routes

**Option A: Using Cookie (Automatic)**
- Postman automatically stores cookies
- No additional setup needed
- Works for subsequent requests

**Option B: Using Authorization Header (Manual)**

1. **Copy Token** from login response
2. **Create New Request** (e.g., GET `/api/auth/me`)
3. **Set Authorization Header**
   - Go to "Headers" tab
   - Add: `Authorization: Bearer YOUR_TOKEN_HERE`
   - Replace `YOUR_TOKEN_HERE` with actual token

**Example Protected Request:**
```
GET http://localhost:5000/api/auth/me
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Test Protected Endpoint

**Request:** GET `/api/auth/me`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": {...}
  }
}
```

---

## 🔑 JWT Token Structure

**Token Payload:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "role": "507f1f77bcf86cd799439012",
  "iat": 1704067200,
  "exp": 1706659200
}
```

**Token Components:**
- `id`: User's MongoDB _id
- `role`: User's role _id (reference)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

---

## 🧪 Complete Postman Collection

### 1. Login
```
POST http://localhost:5000/api/auth/login
Body: { "email": "admin@example.com", "password": "password123" }
```

### 2. Get Current User
```
GET http://localhost:5000/api/auth/me
Headers: Authorization: Bearer {token}
```

### 3. Check Auth Status
```
GET http://localhost:5000/api/auth/check
Headers: Authorization: Bearer {token}
```

### 4. Get User Profile
```
GET http://localhost:5000/api/users/profile
Headers: Authorization: Bearer {token}
```

### 5. Logout
```
POST http://localhost:5000/api/auth/logout
```

---

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt rounds (10)
2. **JWT Signing**: HS256 algorithm with secret key
3. **HTTP-Only Cookies**: Prevents XSS attacks
4. **Rate Limiting**: 5 attempts per 15 minutes
5. **Password Validation**: Minimum 6 characters
6. **Secure Cookie**: HTTPS only in production

---

## 🐛 Common Issues

### Issue: "Invalid credentials"
- Check email/password spelling
- Verify user exists in database
- Check password meets minimum length

### Issue: "Token expired"
- Login again to get new token
- Check JWT_EXPIRES_IN in .env

### Issue: "Unauthorized"
- Verify token is included in request
- Check Authorization header format: `Bearer {token}`
- Ensure token hasn't expired

---

## 📝 Environment Variables Required

```env
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=30d
NODE_ENV=development
```

---

**Quick Test Command (cURL):**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```
