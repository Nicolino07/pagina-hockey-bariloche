"""
Rutas para la gestión de equipos deportivos.
Incluye operaciones CRUD y restauración de equipos eliminados.
- Lectura: acceso público.
- Creación y actualización: rol ADMIN o superior.
- Eliminación y restauración: rol SUPERUSUARIO.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.equipo import Equipo as EquipoSchema, EquipoCreate, EquipoUpdate
from app.services import equipos_services
from app.dependencies.permissions import require_admin, require_superuser

router = APIRouter(prefix="/equipos", tags=["Equipos"])


# 🔓 Público
@router.get("/", response_model=list[EquipoSchema])
def listar_equipos(
    nombre: str | None = None,
    id_club: int | None = None,
    db: Session = Depends(get_db),
):
    """
    Devuelve la lista de equipos. Permite filtrar por nombre o por club.
    Acceso público.
    """
    return equipos_services.listar_equipos(db, nombre, id_club)

# 🔓 Público
@router.get("/{equipo_id}", response_model=EquipoSchema)
def obtener_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
):
    """Devuelve los datos de un equipo específico por su ID. Acceso público."""
    return equipos_services.obtener_equipo(db, equipo_id)


# 🔐 ADMIN / SUPERUSUARIO
@router.post("/", response_model=EquipoSchema, status_code=status.HTTP_201_CREATED)
def crear_equipo(
    data: EquipoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Crea un nuevo equipo. Requiere rol ADMIN o SUPERUSUARIO."""
    return equipos_services.crear_equipo(db, data, current_user)


# 🔐 ADMIN / SUPERUSUARIO
@router.put("/{equipo_id}", response_model=EquipoSchema)
def actualizar_equipo(
    equipo_id: int,
    data: EquipoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    """Actualiza los datos de un equipo existente. Requiere rol ADMIN o SUPERUSUARIO."""
    return equipos_services.actualizar_equipo(db, equipo_id, data, current_user)


# 🔐 SUPERUSUARIO - Preview: ¿se puede eliminar el equipo?
@router.get("/{equipo_id}/impacto-eliminacion")
def impacto_eliminacion_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_superuser),
):
    """Devuelve si el equipo puede eliminarse y qué dependencias lo bloquean."""
    try:
        return equipos_services.dependencias_equipo(db, equipo_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO
@router.delete("/{equipo_id}", status_code=status.HTTP_200_OK)
def eliminar_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_superuser),
):
    """Elimina un equipo de forma DEFINITIVA (solo si no tiene datos asociados)."""
    try:
        dep = equipos_services.eliminar_equipo(db, equipo_id, current_user)
        return {"detail": "Equipo eliminado definitivamente", "impacto": dep}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))