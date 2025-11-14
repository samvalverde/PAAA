# Authentication Implementation Guide

## How Your JWT Authentication Works

### 1. Login Flow
1. **User sends credentials** to `POST /api/v1/auth/login` with username/email and password
2. **Server validates** credentials against the database
3. **JWT token is generated** containing user info (email, role, school_id, etc.)
4. **Token is returned** to client in format: `{"access_token": "...", "token_type": "bearer"}`

### 2. Protected Endpoint Access
1. **Client includes token** in request header: `Authorization: Bearer <token>`
2. **FastAPI's OAuth2PasswordBearer** extracts the token automatically
3. **`get_current_user` dependency** validates token and returns user object
4. **Endpoint executes** with authenticated user context

### 3. Token Structure
Your JWT tokens contain:
```json
{
  "sub": "user@email.com",
  "role": "admin",
  "username": "johndoe",
  "school_id": 1,
  "phone_number": "+1234567890",
  "exp": 1642780800
}
```

## Implementation Pattern

### To Protect Any Endpoint:
```python
from app.core.security import get_current_user

@router.get("/protected-endpoint")
def my_endpoint(
    db: Session = Depends(get_db_data),
    current_user = Depends(get_current_user)  # Add this line
):
    # Now you have access to current_user object
    # You can access: current_user.id, current_user.email, etc.
    return {"message": f"Hello {current_user.username}"}
```

## What We Fixed Today

### ✅ Added Authentication To:

#### Statistics Routes (`/api/v1/statistics/`)
- `/kpis` - General KPI data
- `/responses-per-program` - Program response counts
- `/question-analysis` - Individual question analysis
- `/questions-batch-analysis` - Multiple question analysis
- `/available-columns` - Available data columns
- `/satisfaction-analysis` - Satisfaction metrics
- `/programs` - Available programs list

#### Process Routes (`/api/v1/process/`)
- `/all` - List all processes
- `/{path:path}` - Download files from MinIO

#### User Routes (`/api/v1/users/`)
- `/create` - Create new users (now requires authentication)
- Fixed duplicate endpoint issue

### ✅ Already Protected:
- `/users/` - List users
- `/users/me` - Get current user info
- `/auth/refresh` - Refresh token
- `/process/create` - Create new process

### ⚠️ Intentionally Not Protected:
- `/health/*` - Health check endpoints (for monitoring)
- `/auth/login` - Login endpoint
- `/auth/register` - User registration

## Frontend Integration

### How to Use in Frontend:

1. **Store token after login:**
```javascript
const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=user@example.com&password=mypassword'
});
const { access_token } = await response.json();
localStorage.setItem('token', access_token);
```

2. **Include token in all API requests:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/v1/statistics/kpis', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});
```

3. **Handle authentication errors:**
```javascript
if (response.status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
}
```

## Security Benefits

✅ **Prevents unauthorized access** to sensitive statistics and data
✅ **User accountability** - all actions are linked to authenticated users
✅ **Role-based access** potential (user.role is available in token)
✅ **Automatic token validation** - no manual checks needed
✅ **Consistent security** across all protected endpoints

## Next Steps (Optional Enhancements)

### 1. Role-Based Authorization
```python
from app.core.security import get_current_user

def require_admin(current_user = Depends(get_current_user)):
    if current_user.user_type.type_name != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin_user = Depends(require_admin)):
    # Only admins can delete users
    pass
```

### 2. School-Based Data Filtering
```python
@router.get("/statistics/kpis")
def get_kpis(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Filter data by user's school_id
    school_id = current_user.school_id
    # Add WHERE clause: AND school_id = :school_id
```

### 3. Token Refresh Logic
- Implement automatic token refresh when near expiration
- Add refresh token for better security

Your authentication system is now properly protecting all sensitive endpoints! 🔒