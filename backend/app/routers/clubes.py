"""
Rutas para la gestión de clubes deportivos.
Permite listar, crear, actualizar, eliminar y restaurar clubes.
Las operaciones de escritura requieren rol SUPERUSUARIO.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

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


# 🔐 SUPERUSUARIO
@router.delete("/{id_club}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_club(
    id_club: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Elimina lógicamente (soft delete) un club. Solo accesible por SUPERUSUARIO."""
    clubes_services.eliminar_club(db, id_club, current_user)


# 🔐 SUPERUSUARIO
@router.post("/{id_club}/restore", response_model=Club)
def restore_club(
    id_club: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Restaura un club previamente eliminado. Solo accesible por SUPERUSUARIO."""
    return clubes_services.restaurar_club(db, id_club, current_user)
