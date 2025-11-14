# Frontend API Authentication Integration

## 🎯 What Changed

Your `api.js` has been updated to **automatically include authentication tokens** in all API requests. Here's what happens now:

### ✅ Automatic Token Handling
- All API calls automatically include `Authorization: Bearer <token>` header
- Token is read from `localStorage.getItem('access_token')`
- No need to manually add authentication to each request

### ✅ Automatic Error Handling
- If any API call returns `401 Unauthorized`, the user is automatically redirected to login
- Token is cleared from localStorage on authentication failure

### ✅ Fixed API Endpoints
- All statistics endpoints now use correct `/statistics/` prefix (was `/stats/`)
- Process and User APIs properly configured for authentication

## 📖 Usage Examples

### Statistics API (Now Protected)
```javascript
import { statisticsAPI } from '../services/api.js';

// All these calls now automatically include your auth token
const kpis = await statisticsAPI.getKPIs({ programa: 'ATI' });
const programs = await statisticsAPI.getPrograms();
const questions = await statisticsAPI.getAvailableColumns('egresados');
```

### User Management (Protected)
```javascript
import { UserListAPI } from '../services/api.js';

// List users (requires authentication)
const users = await UserListAPI.getUserList();

// Create user (requires authentication)
const newUser = await UserListAPI.createUser({
  username: "johndoe",
  email: "john@example.com",
  password: "password123",
  user_type_id: 3,
  school_id: 1,
  phone_number: "+1234567890"
});
```

### Process Management (Protected)
```javascript
import { ProcListAPI } from '../services/api.js';

// List processes (requires authentication)
const processes = await ProcListAPI.getProcList();

// Create process with file upload (requires authentication)
const formData = new FormData();
formData.append('process_name', 'Survey Analysis');
formData.append('school_id', '1');
formData.append('career_name', 'ATI');
formData.append('dataset_type', 'egresados');
formData.append('file', fileInput.files[0]);

const result = await ProcListAPI.createProc(formData);
```

### Authentication Functions
```javascript
import { authAPI, authUtils } from '../services/api.js';

// Login (saves token automatically)
const response = await authAPI.login('user@example.com', 'password');
localStorage.setItem('access_token', response.access_token);

// Get current user info
const user = await authAPI.getCurrentUser();

// Check if user is logged in
if (authUtils.isAuthenticated()) {
  console.log('User is logged in');
}

// Logout
authAPI.logout(); // Clears token from localStorage
```

## 🔧 Component Integration Example

Here's how to use the updated API in a React component:

```jsx
import React, { useState, useEffect } from 'react';
import { statisticsAPI, authUtils } from '../services/api.js';

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated before loading data
    if (!authUtils.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // These calls automatically include the auth token
      const kpiData = await statisticsAPI.getKPIs({ programa: 'ATI' });
      const programsData = await statisticsAPI.getPrograms();
      
      setKpis(kpiData);
      setError(null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      {/* Render your KPI data */}
      <pre>{JSON.stringify(kpis, null, 2)}</pre>
    </div>
  );
}

export default Dashboard;
```

## 🚨 Important Notes

### 1. **No More Manual Token Handling**
❌ **OLD WAY (Don't do this anymore):**
```javascript
const token = localStorage.getItem('access_token');
const response = await fetch('/api/v1/statistics/kpis', {
  headers: { Authorization: `Bearer ${token}` }
});
```

✅ **NEW WAY (Automatic):**
```javascript
const kpis = await statisticsAPI.getKPIs();
```

### 2. **Error Handling is Automatic**
- If the token expires or is invalid, user gets redirected to login automatically
- No need to manually check for 401 errors in your components

### 3. **File Uploads Work Correctly**
- FormData objects are handled properly for file uploads
- Content-Type headers are set automatically

### 4. **All Protected Endpoints**
These endpoints now require authentication:
- All `/statistics/*` endpoints
- All `/users/*` endpoints (except registration)
- All `/process/*` endpoints
- `/auth/refresh` and `/users/me`

### 5. **Health Endpoints Stay Public**
- `/health/*` endpoints remain unprotected for monitoring

## ✅ Testing Your Integration

1. **Login and check token storage:**
```javascript
const response = await authAPI.login('user@example.com', 'password');
console.log('Token saved:', authUtils.getToken());
```

2. **Test protected endpoint:**
```javascript
const kpis = await statisticsAPI.getKPIs();
console.log('Protected data:', kpis);
```

3. **Test automatic logout on invalid token:**
```javascript
localStorage.setItem('access_token', 'invalid_token');
await statisticsAPI.getKPIs(); // Should redirect to login
```

Your frontend now seamlessly handles authentication for all API calls! 🚀