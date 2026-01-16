from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.persona import PersonaCreate, PersonaRead
from app.schemas.persona_rol import PersonaRolCreate
from app.services import personas_services
from app.dependencies.permissions import require_admin, require_editor

router = APIRouter(
    prefix="/personas",
    tags=["Personas"],
)


# 🔐 EDITOR / ADMIN
@router.get("/", response_model=list[PersonaRead])
def listar_personas(
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return personas_services.listar_personas(db)


# 🔐 EDITOR / ADMIN
@router.get("/{persona_id}", response_model=PersonaRead)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return personas_services.obtener_persona(db, persona_id)


# 🔐 ADMIN
@router.post(
    "/jugadores",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_jugador(
    data: PersonaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rol = PersonaRolCreate(rol="jugador")
    return personas_services.crear_persona_con_rol(db, data, rol, current_user)


# 🔐 ADMIN
@router.post(
    "/entrenadores",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_entrenador(
    data: PersonaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rol = PersonaRolCreate(rol="entrenador")
    return personas_services.crear_persona_con_rol(db, data, rol, current_user)


# 🔐 ADMIN
@router.post(
    "/arbitros",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_arbitro(
    data: PersonaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rol = PersonaRolCreate(rol="arbitro")
    return personas_services.crear_persona_con_rol(db, data, rol, current_user)

# 🔐 ADMIN / SUPERUSUARIO
@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin),
):
    personas_services.eliminar_persona(db, persona_id, current_user)

# 🔐 ADMIN / SUPERUSUARIO
@router.post("/{persona_id}", response_model=PersonaRead,)
def restore_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return personas_services.restaurar_persona(db, persona_id, current_user)