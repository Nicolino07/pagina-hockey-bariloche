from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaRead
from app.schemas.persona_rol import PersonaRolCreate
from app.services import persona_service
from app.dependencies.permissions import require_admin, require_editor

router = APIRouter(
    prefix="/personas",
    tags=["Personas"]
)


# 🔐 EDITOR o ADMIN
@router.get("/", response_model=list[PersonaRead])
def listar_personas(
    db: Session = Depends(get_db),
    current_user = Depends(require_editor),
):
    return (
        db.query(Persona)
        .order_by(Persona.apellido, Persona.nombre)
        .all()
    )


# 🔐 EDITOR o ADMIN
@router.get("/{persona_id}", response_model=PersonaRead)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_editor),
):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Persona no encontrada"
        )
    return persona


# 🔐 ADMIN
@router.post(
    "/jugadores",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_jugador(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    rol = PersonaRolCreate(rol="jugador")
    return persona_service.crear_persona_con_rol(
        db, persona, rol
    )


# 🔐 ADMIN
@router.post(
    "/arbitros",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_arbitro(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    rol = PersonaRolCreate(rol="arbitro")
    return persona_service.crear_persona_con_rol(
        db, persona, rol
    )


# 🔐 ADMIN
@router.post(
    "/entrenadores",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_entrenador(
    persona: PersonaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    rol = PersonaRolCreate(rol="entrenador")
    return persona_service.crear_persona_con_rol(
        db, persona, rol
    )
