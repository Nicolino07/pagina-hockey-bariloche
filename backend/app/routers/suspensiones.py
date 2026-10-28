"""
Rutas para la gestión de suspensiones disciplinarias.
La lectura es pública; alta manual y anulación requieren rol EDITOR o superior.
"""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import EstadoSuspension, RolPersonaTipo
from app.models.suspension import Suspension as SuspensionModel
from app.schemas.suspension import SuspensionCreate, SuspensionRead
from app.dependencies.permissions import require_editor
from app.core.exceptions import NotFoundError
from app.services.suspensiones_services import (
    crear_suspension_manual,
    anular_suspension,
    listar_suspensiones_activas_por_personas,
)

router = APIRouter(prefix="/suspensiones", tags=["Suspensiones"])


class AnularSuspensionRequest(BaseModel):
    motivo_anulacion: str = Field(..., min_length=1, max_length=500)


@router.get("/", response_model=list[SuspensionRead])
def listar_suspensiones(
    id_persona: Optional[int] = None,
    id_torneo: Optional[int] = None,
    estado_suspension: Optional[EstadoSuspension] = None,
    db: Session = Depends(get_db),
):
    """Lista suspensiones con filtros opcionales. Acceso público."""
    query = db.query(SuspensionModel)
    if id_persona is not None:
        query = query.filter(SuspensionModel.id_persona == id_persona)
    if id_torneo is not None:
        query = query.filter(SuspensionModel.id_torneo == id_torneo)
    if estado_suspension is not None:
        query = query.filter(SuspensionModel.estado_suspension == estado_suspension)
    return query.order_by(SuspensionModel.creado_en.desc()).all()


@router.get("/activas-por-persona/{id_persona}", response_model=list[SuspensionRead])
def suspensiones_activas_por_persona(
    id_persona: int,
    id_torneo: Optional[int] = None,
    rol: Optional[RolPersonaTipo] = None,
    db: Session = Depends(get_db),
):
    """Devuelve las suspensiones ACTIVA (vigentes) de una persona. Sin
    `id_torneo`/`rol` trae todo (uso informativo); con ambos, aplica el
    alcance estricto (torneo de origen o global+rol). Acceso público."""
    mapa = listar_suspensiones_activas_por_personas(db, [id_persona], id_torneo=id_torneo, rol=rol)
    return mapa.get(id_persona, [])


@router.get("/activas-por-personas", response_model=dict[int, list[SuspensionRead]])
def suspensiones_activas_por_personas(
    ids: str,
    id_torneo: Optional[int] = None,
    rol: Optional[RolPersonaTipo] = None,
    db: Session = Depends(get_db),
):
    """Lookup en bloque: `ids` es una lista de id_persona separados por coma.
    Devuelve un diccionario id_persona -> suspensiones ACTIVA. Acceso público."""
    ids_persona = [int(i) for i in ids.split(",") if i.strip()]
    return listar_suspensiones_activas_por_personas(db, ids_persona, id_torneo=id_torneo, rol=rol)


# Rutas con parámetro de un solo segmento: deben ir DESPUÉS de las rutas
# literales de arriba (activas-por-persona/activas-por-personas), porque
# FastAPI matchea por orden de declaración y "/{id_suspension}" capturaría
# esos literales como si fueran un id.
@router.get("/{id_suspension}", response_model=SuspensionRead)
def obtener_suspension(id_suspension: int, db: Session = Depends(get_db)):
    """Devuelve una suspensión puntual. Acceso público."""
    item = db.query(SuspensionModel).filter(SuspensionModel.id_suspension == id_suspension).first()
    if not item:
        raise NotFoundError("Suspensión no encontrada")
    return item


# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.post("/manual", response_model=SuspensionRead)
def crear_manual(
    data: SuspensionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Carga una suspensión manual (por N fechas o hasta una fecha calendario).
    Requiere rol EDITOR o superior."""
    return crear_suspension_manual(db, data, current_user)


# 🔐 EDITOR / ADMIN / SUPERUSUARIO
@router.patch("/{id_suspension}/anular", response_model=SuspensionRead)
def anular(
    id_suspension: int,
    data: AnularSuspensionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Anula una suspensión (queda registrada, no se borra). Requiere rol EDITOR o superior."""
    return anular_suspension(db, id_suspension, data.motivo_anulacion, current_user)
