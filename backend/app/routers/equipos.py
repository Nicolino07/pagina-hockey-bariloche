from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.equipo import Equipo as EquipoSchema, EquipoCreate, EquipoUpdate
from app.services import equipos_services
from app.dependencies.permissions import require_admin

router = APIRouter(prefix="/equipos", tags=["Equipos"])


# 🔓 Público
@router.get("/", response_model=list[EquipoSchema])
def listar_equipos(
    nombre: str | None = None,
    db: Session = Depends(get_db),
):
    return equipos_services.listar_equipos(db, nombre)


# 🔓 Público
@router.get("/{equipo_id}", response_model=EquipoSchema)
def obtener_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
):
    return equipos_services.obtener_equipo(db, equipo_id)


# 🔐 ADMIN / SUPERUSUARIO
@router.post("/", response_model=EquipoSchema, status_code=status.HTTP_201_CREATED)
def crear_equipo(
    data: EquipoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    return equipos_services.crear_equipo(db, data)


# 🔐 ADMIN / SUPERUSUARIO
@router.put("/{equipo_id}", response_model=EquipoSchema)
def actualizar_equipo(
    equipo_id: int,
    data: EquipoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    return equipos_services.actualizar_equipo(db, equipo_id, data)


# 🔐 ADMIN / SUPERUSUARIO
@router.delete("/{equipo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    equipos_services.eliminar_equipo(db, equipo_id)
