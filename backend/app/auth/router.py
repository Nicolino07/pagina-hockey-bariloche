import os
from fastapi import APIRouter, Depends, Response, Request, BackgroundTasks, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.dependencies.permissions import require_admin
from app.schemas.user import UserInviteRequest
from app.auth.security import create_access_token
from app.core.email import send_invite_email
from datetime import timedelta
from jose import jwt, JWTError
from app.core.config import settings

from app.database import get_db
from app.auth.service import login_user, logout_user, refresh_access_token
from app.dependencies.permissions import get_current_user
from app.models.usuario import Usuario
from app.auth.security import hash_password
from app.schemas.user import UserConfirm  # Necesitaremos crear este schema

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    access_token, refresh_token = login_user(
        db,
        form_data.username,
        form_data.password,
        request
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=bool(os.getenv("COOKIE_SECURE", "false").lower() == "true"),
        samesite="strict",
        max_age=60 * 60 * 24 * 14
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    access_token, new_refresh_token = refresh_access_token(db, request)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
    )

    return {"access_token": access_token}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    logout_user(db, request)
    response.delete_cookie("refresh_token")
    return {"ok": True}


@router.get("/me")
def me(user: Usuario = Depends(get_current_user)):
    return {
        "id": user.id_usuario,
        "email": user.email,
        "rol": user.tipo
    }


@router.post("/invitar")
async def invitar_usuario(
    payload: UserInviteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin = Depends(require_admin)
):
    # 1. Crear Token (Sub es el email, incluimos el rol)
    token_data = {"sub": payload.email, "role": payload.tipo.value, "type": "invitation"}
    token = create_access_token(token_data, expires_delta=timedelta(hours=24))

    # 2. Enviar mail en segundo plano
    background_tasks.add_task(send_invite_email, payload.email, token)

    return {"message": f"Invitación enviada con éxito a {payload.email}"}

@router.get("/validar-invitacion/{token}")
def validar_token_invitacion(token: str):
    try:
        # Decodificamos el token usando tu secret key
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        
        # Verificamos que sea un token de tipo invitación
        if payload.get("type") != "invitation":
            raise HTTPException(status_code=400, detail="Token no válido para registro")
            
        return {
            "valido": True,
            "email": payload.get("sub"),
            "rol": payload.get("role")
        }
        
    except JWTError:
        raise HTTPException(
            status_code=400, 
            detail="La invitación ha expirado o es inválida"
        )
    


@router.post("/confirmar-registro")
def confirmar_registro(payload: UserConfirm, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload.token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        
        # ESTO ES PARA DEBUG: Mira la consola de Docker después de fallar
        print(f"DEBUG: Contenido del token: {data}")
        
        if data.get("type") != "invitation":
            # Cambiamos el mensaje para saber qué tipo está llegando realmente
            tipo_actual = data.get("type")
            raise HTTPException(status_code=400, detail=f"Token tipo '{tipo_actual}' no es 'invitation'")
            
    except JWTError as e:
        print(f"DEBUG: Error de JWT: {e}")
        raise HTTPException(status_code=400, detail="El link ha expirado o es corrupto")

    # ... resto del código (verificar usuario y crear) ...

    # 2. Verificar que no se haya registrado mientras tanto
    email = data.get("sub")
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="Este usuario ya completó su registro")

    # 3. Crear el usuario físicamente en la DB
    nuevo_usuario = Usuario(
        username=payload.username,
        email=email,
        password_hash=hash_password(payload.password),
        tipo=data.get("role"),
        activo=True,
        creado_por="system_invitation"
    )
    
    db.add(nuevo_usuario)
    db.commit()
    return {"message": "Cuenta activada exitosamente. Ya puedes iniciar sesión."}