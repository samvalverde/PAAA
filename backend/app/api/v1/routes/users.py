from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from datetime import datetime
from app.core.database import get_db_users
from app.models.user import User
from app.models.audit import AuditLog
from app.models.actions import ActionType
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.core.security import get_password_hash, get_current_user

router = APIRouter(tags=["Users"])


def _log_audit_action(db: Session, action_name: str, description: str, user_id: int, school_id: int = None):
    """Helper function to log audit actions"""
    try:
        action_type = db.query(ActionType).filter(ActionType.name == action_name).first()
        if action_type:
            audit_log = AuditLog(
                user_id=user_id,
                action_type_id=action_type.id,
                school_id=school_id,
                description=description
            )
            db.add(audit_log)
            db.commit()
    except Exception as e:
        # Don't break main flow if audit logging fails
        print(f"Audit logging failed: {e}")


def get_user_with_role(db: Session, user_id: int = None, email: str = None):
    """Helper function to get user with role using raw SQL"""
    if user_id:
        where_clause = "WHERE u.id = :identifier"
        params = {"identifier": user_id}
    elif email:
        where_clause = "WHERE u.email = :identifier"
        params = {"identifier": email}
    else:
        return None
    
    result = db.execute(text(f"""
        SELECT 
            u.id,
            u.username,
            u.email,
            u.phone_number,
            u.user_type_id,
            u.school_id,
            u.is_active,
            ut.type_name as role
        FROM users u 
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
        {where_clause}
    """), params).fetchone()
    
    return result

@router.post("/create")
def create_user(user: UserCreate, db: Session = Depends(get_db_users), current_user=Depends(get_current_user)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    created_at = datetime.utcnow()
    hashed_pw = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_pw,
        user_type_id=user.user_type_id,
        school_id=user.school_id,
        is_active=True,
        phone_number=user.phone_number,
        created_at=created_at,
        updated_at=created_at
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log audit action for user creation
    _log_audit_action(
        db=db,
        action_name="Create",
        description=f"User created: {new_user.username} ({new_user.email})",
        user_id=current_user.id,  # who created the user
        school_id=new_user.school_id
    )
    
    # Get the created user with role using raw SQL
    result = db.execute(text("""
        SELECT 
            u.id,
            u.username,
            u.email,
            u.phone_number,
            u.user_type_id,
            u.school_id,
            u.is_active,
            ut.type_name as role
        FROM users u 
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
        WHERE u.id = :user_id
    """), {"user_id": new_user.id}).fetchone()
    
    return {
        "id": result.id,
        "username": result.username,
        "email": result.email,
        "phone_number": result.phone_number,
        "user_type_id": result.user_type_id,
        "school_id": result.school_id,
        "is_active": result.is_active,
        "role": result.role
    }

@router.get("/")
def list_users(db: Session = Depends(get_db_users), current_user=Depends(get_current_user)):
    # Use raw SQL since ORM relationships aren't working properly
    raw_result = db.execute(text("""
        SELECT 
            u.id,
            u.username,
            u.email,
            u.phone_number,
            u.user_type_id,
            u.school_id,
            u.is_active,
            ut.type_name as role
        FROM users u 
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
        ORDER BY u.id
    """)).fetchall()
    
    # Convert to response format - let's be very explicit
    response_data = []
    for row in raw_result:
        user_data = {
            "id": row.id,
            "username": row.username,
            "email": row.email,
            "phone_number": row.phone_number,
            "user_type_id": row.user_type_id,
            "school_id": row.school_id,
            "is_active": row.is_active,
            "role": row.role  # This should be the role name like "admin"
        }
        response_data.append(user_data)
        
    # Add debug info to see what we're returning
    print(f"DEBUG: Returning {len(response_data)} users")
    print(f"DEBUG: First user data: {response_data[0] if response_data else 'No users'}")
    
    return response_data


@router.get("/me", tags=["Users"])
def get_me(current_user=Depends(get_current_user), db: Session = Depends(get_db_users)):
    # Use helper function to get user with role
    user_with_role = get_user_with_role(db, user_id=current_user.id)
    
    if user_with_role:
        return {
            "id": user_with_role.id,
            "email": user_with_role.email,
            "username": user_with_role.username,
            "is_active": user_with_role.is_active,
            "role": user_with_role.role
        }
    else:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "is_active": True,
            "role": None
        }

@router.put("/{user_id}")
def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db_users), 
    current_user=Depends(get_current_user)
):
    """Update user information"""
    
    # First check if user exists
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update only the fields that are provided (not None)
    update_data = user_update.dict(exclude_unset=True)
    
    # Check if email is being updated and if it's already taken by another user
    if "email" in update_data:
        email_check = db.query(User).filter(User.email == update_data["email"], User.id != user_id).first()
        if email_check:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
    
    # Check if username is being updated and if it's already taken by another user
    if "username" in update_data:
        username_check = db.query(User).filter(User.username == update_data["username"], User.id != user_id).first()
        if username_check:
            raise HTTPException(status_code=400, detail="Username already taken by another user")
    
    # Apply updates
    for field, value in update_data.items():
        if field == "password":
            # Hash password before saving
            hashed_password = get_password_hash(value)
            setattr(existing_user, "password_hash", hashed_password)
        else:
            setattr(existing_user, field, value)
    
    # Update the updated_at timestamp
    existing_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(existing_user)
    
    # Log audit action for user update
    _log_audit_action(
        db=db,
        action_name="Update",
        description=f"User updated: {existing_user.username} ({existing_user.email})",
        user_id=current_user.id,  # who updated the user
        school_id=existing_user.school_id
    )
    
    # Return the updated user with role using our helper function
    updated_user = get_user_with_role(db, user_id=user_id)
    
    if updated_user:
        return {
            "id": updated_user.id,
            "username": updated_user.username,
            "email": updated_user.email,
            "phone_number": updated_user.phone_number,
            "user_type_id": updated_user.user_type_id,
            "school_id": updated_user.school_id,
            "is_active": updated_user.is_active,
            "role": updated_user.role
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated user")

@router.get("/me", tags=["Users"])
def debug_users(db: Session = Depends(get_db_users), current_user=Depends(get_current_user)):
    """Debug endpoint to check user_type data"""
    
    # First, let's check raw database data
    from app.models.user import UserType
    
    # Check available user types
    user_types = db.query(UserType).all()
    user_types_data = [{"id": ut.id, "type_name": ut.type_name} for ut in user_types]
    
    # Check users with explicit join
    users_with_explicit_join = db.query(User, UserType).join(UserType, User.user_type_id == UserType.id).all()
    explicit_join_data = []
    for user, user_type in users_with_explicit_join:
        explicit_join_data.append({
            "user_id": user.id,
            "username": user.username,
            "user_type_id": user.user_type_id,
            "user_type_name": user_type.type_name
        })
    
    # Check users with joinedload
    users_with_joinedload = db.query(User).options(joinedload(User.user_type)).all()
    joinedload_data = []
    for user in users_with_joinedload:
        joinedload_data.append({
            "user_id": user.id,
            "username": user.username,
            "user_type_id": user.user_type_id,
            "user_type_loaded": user.user_type is not None,
            "user_type_name": user.user_type.type_name if user.user_type else "NULL_OR_NOT_LOADED",
            "user_type_object": str(user.user_type) if user.user_type else "None"
        })
    
    # Check raw SQL query
    raw_sql_result = db.execute(text("""
        SELECT u.id, u.username, u.user_type_id, ut.type_name 
        FROM users u 
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
    """)).fetchall()
    
    raw_sql_data = [dict(row._mapping) for row in raw_sql_result]
    
    return {
        "available_user_types": user_types_data,
        "users_with_explicit_join": explicit_join_data,
        "users_with_joinedload": joinedload_data,
        "raw_sql_query": raw_sql_data,
        "current_user_debug": {
            "id": current_user.id,
            "username": current_user.username,
            "user_type_id": current_user.user_type_id,
            "user_type_loaded": current_user.user_type is not None,
            "user_type_name": current_user.user_type.type_name if current_user.user_type else "NULL_OR_NOT_LOADED"
        }
    }

@router.get("/schools/")
async def get_schools(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_users)
):
    """Get list of all schools for dropdown options"""
    try:
        # Get schools from database using raw SQL
        result = db.execute(text("SELECT id, school_name FROM schools ORDER BY school_name")).fetchall()
        
        schools_data = []
        for row in result:
            school_data = {
                "id": row.id,
                "name": row.school_name
            }
            schools_data.append(school_data)
        
        return schools_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schools: {str(e)}")


@router.get("/users-for-dropdown/")
async def get_users_for_dropdown(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db_users)
):
    """Get simplified list of users for dropdown options"""
    try:
        # Get users for dropdown using raw SQL
        result = db.execute(text("""
            SELECT u.id, u.username, u.email
            FROM users u 
            WHERE u.is_active = true
            ORDER BY u.username
        """)).fetchall()
        
        users_data = []
        for row in result:
            user_data = {
                "id": row.id,
                "username": row.username,
                "email": row.email
            }
            users_data.append(user_data)
        
        return users_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
