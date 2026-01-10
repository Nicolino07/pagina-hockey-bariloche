from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaRead
from app.schemas.persona_rol import PersonaRolCreate
from app.services import persona_service

router = APIRouter(
    prefix="/personas",
    tags=["Personas"]
)


@router.get("/", response_model=list[PersonaRead])
def listar_personas(db: Session = Depends(get_db)):
    return db.query(Persona).order_by(Persona.apellido, Persona.nombre).all()


@router.get("/{persona_id}", response_model=PersonaRead)
def obtener_persona(persona_id: int, db: Session = Depends(get_db)):
    persona = db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return persona


@router.post("/jugadores", response_model=PersonaRead, status_code=201)
def crear_jugador(
    persona: PersonaCreate,
    db: Session = Depends(get_db)
):
    rol = PersonaRolCreate(rol="jugador")
    return persona_service.crear_persona_con_rol(db, persona, rol)

@router.post("/arbitros", response_model=PersonaRead, status_code=201)
def crear_arbitro(
    persona: PersonaCreate,
    db: Session = Depends(get_db)
):
    rol = PersonaRolCreate(rol="arbitro")
    return persona_service.crear_persona_con_rol(db, persona, rol)

@router.post("/entrenadores", response_model=PersonaRead, status_code=201)
def crear_entrenador(
    persona: PersonaCreate,
    db: Session = Depends(get_db)
):
    rol = PersonaRolCreate(rol="entrenador")
    return persona_service.crear_persona_con_rol(db, persona, rol)
