from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user

def require_roles(*roles):
    def checker(user = Depends(get_current_user)):
        if user["rol"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos suficientes"
            )
        return user
    return checker
