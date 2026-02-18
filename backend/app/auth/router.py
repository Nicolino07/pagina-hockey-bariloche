import os
from typing import List
from fastapi import APIRouter, Depends, Response, Request, BackgroundTasks, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.dependencies.permissions import require_admin, require_superuser
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
from app.schemas.user import UserConfirm  


# ... (tus otros imports)
from app.models.usuario import Usuario as UsuarioModel  # Alias para el modelo de DB
from app.schemas.usuario import Usuario as UsuarioSchema # Importa el Schema de Pydantic
from app.schemas.usuario import UsuarioUpdate # Usaremos este para los PATCH

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
    admin = Depends(require_superuser) 
):
    # Metemos el username del admin en el token
    token_data = {
        "sub": payload.email, 
        "role": payload.tipo.value, 
        "type": "invitation",
        "invited_by": admin.username 
    }
    token = create_access_token(token_data, expires_delta=timedelta(hours=24))
    # ... resto del código

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


    # 2. Verificar que no se haya registrado mientras tanto
    email = data.get("sub")
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="Este usuario ya completó su registro")

    # 3. Crear el usuario físicamente en la DB
    nuevo_usuario = Usuario(
        username=payload.username,
        email=data.get("sub"),
        password_hash=hash_password(payload.password),
        tipo=data.get("role"),
        activo=True,
        creado_por=data.get("invited_by") # <-- Ahora sí tomamos el nombre del admin
    )
    
    db.add(nuevo_usuario)
    db.commit()
    return {"message": "Cuenta activada exitosamente. Ya puedes iniciar sesión."}


@router.get("/usuarios", response_model=List[UsuarioSchema]) # Usa el Schema aquí
def get_usuarios(db: Session = Depends(get_db),
    admin = Depends(require_superuser)):
    return db.query(UsuarioModel).filter(UsuarioModel.borrado_en == None).all()


# 2. Cambiar Rol
@router.patch("/usuarios/{id_usuario}/rol")
def cambiar_rol(
    id_usuario: int, 
    payload: UsuarioUpdate, 
    db: Session = Depends(get_db),
    admin = Depends(require_superuser)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if payload.tipo:
        user.tipo = payload.tipo
        db.commit()
    
    return {"message": "Rol actualizado correctamente"}

# 3. Cambiar Estado (Activo/Inactivo)
@router.patch("/usuarios/{id_usuario}/estado")
def cambiar_estado(
    id_usuario: int, 
    payload: UsuarioUpdate, 
    db: Session = Depends(get_db),
    admin = Depends(require_superuser)
):
    user = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizamos el valor y la auditoría
    user.activo = payload.activo
    user.actualizado_por = admin.username # <-- ESTO llena la columna que te falta
    
    db.commit()
    return {"message": "Estado actualizado"}