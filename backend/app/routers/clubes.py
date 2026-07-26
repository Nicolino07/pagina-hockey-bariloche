"""
Rutas para la gestión de clubes deportivos.
Permite listar, crear, actualizar y eliminar clubes.
Las operaciones de escritura requieren rol SUPERUSUARIO.
"""
from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil

from app.database import get_db
from app.schemas.club import Club, ClubCreate, ClubUpdate
from app.services import clubes_services
from app.dependencies.permissions import require_superuser
from app.models.usuario import Usuario

router = APIRouter(prefix="/clubes", tags=["Clubes"])


# 🔓 Público
@router.get("/", response_model=list[Club])
def listar_clubes(db: Session = Depends(get_db)):
    """Devuelve la lista completa de clubes activos (acceso público)."""
    return clubes_services.listar_clubes(db)


# 🔓 Público
@router.get("/{id_club}", response_model=Club)
def obtener_club(id_club: int, db: Session = Depends(get_db)):
    """Devuelve los datos de un club específico por su ID (acceso público)."""
    return clubes_services.obtener_club(db, id_club)


# 🔐 SUPERUSUARIO
@router.post("/", response_model=Club, status_code=status.HTTP_201_CREATED)
def crear_club(
    data: ClubCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Crea un nuevo club. Solo accesible por SUPERUSUARIO."""
    return clubes_services.crear_club(db, data, current_user)


# 🔐 SUPERUSUARIO
@router.put("/{id_club}", response_model=Club)
def actualizar_club(
    id_club: int,
    data: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Actualiza los datos de un club existente. Solo accesible por SUPERUSUARIO."""
    return clubes_services.actualizar_club(
        db=db,
        club_id=id_club,
        data=data,
        current_user=current_user,
    )


# 🔐 SUPERUSUARIO - Preview: puede eliminarse el club?
@router.get("/{id_club}/impacto-eliminacion")
def impacto_eliminacion_club(
    id_club: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Devuelve si el club puede eliminarse y qué dependencias lo bloquean."""
    try:
        return clubes_services.dependencias_club(db, id_club)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO
@router.delete("/{id_club}", status_code=status.HTTP_200_OK)
def eliminar_club(
    id_club: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Elimina un club de forma DEFINITIVA (solo si no tiene datos asociados)."""
    try:
        dep = clubes_services.eliminar_club(db, id_club, current_user)
        return {"detail": "Club eliminado definitivamente", "impacto": dep}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO
@router.post("/{id_club}/logo", status_code=status.HTTP_200_OK)
def subir_logo_club(
    id_club: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Sube o reemplaza el logo de un club. Solo accesible por SUPERUSUARIO."""
    clubes_services.obtener_club(db, id_club)  # valida que exista
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Formato no soportado. Usá JPG, PNG o WebP.")
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    dest = f"/app/static/clubes/{id_club}.{ext}"
    with open(dest, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"logo_url": f"/logos/clubes/{id_club}.{ext}"}


