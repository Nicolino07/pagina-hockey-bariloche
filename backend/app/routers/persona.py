from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from typing import Optional
from fastapi import Query
from app.database import get_db
from app.dependencies.permissions import require_admin, require_editor
from app.schemas.persona import (
    PersonaRead,
    PersonaUpdate,
    PersonaAltaConRol,
    PersonaConRolesActivos,
)
from app.schemas.persona_rol import PersonaRolCreate, PersonaRol
from app.services import personas_services

router = APIRouter(
    prefix="/personas",
    tags=["Personas"],
)


# =========================
# GET /personas
# =========================
@router.get(
    "",
    response_model=List[PersonaRead],
)
def listar_personas(
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return personas_services.listar_personas(db)


# =========================
# GET /personas/roles-activos
# =========================
@router.get(
    "/roles-activos",
    response_model=List[PersonaConRolesActivos],
)
def listar_personas_con_roles_activos(
    id_club: Optional[int] = Query(None, gt=0),
    id_persona: Optional[int] = Query(None, gt=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return personas_services.obtener_personas_con_roles_activos(
        db=db,
        id_club=id_club,
        id_persona=id_persona,
    )



# =========================
# GET /personas/{id}
# =========================
@router.get(
    "/{persona_id}",
    response_model=PersonaRead,
)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    return personas_services.obtener_persona(db, persona_id)


# =========================
# POST /personas
# Crear persona + rol inicial
# =========================
@router.post(
    "",
    response_model=PersonaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_persona(
    data: PersonaAltaConRol,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return personas_services.crear_persona_con_rol(
        db=db,
        persona_data=data.persona,
        rol_data=data.rol,
        current_user=current_user,
    )


# =========================
# PUT /personas/{id}
# =========================
@router.put(
    "/{persona_id}",
    response_model=PersonaRead,
)
def actualizar_persona(
    persona_id: int,
    data: PersonaUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return personas_services.actualizar_persona(
        db, persona_id, data, current_user
    )


# =========================
# POST /personas/{id}/roles
# Agregar nuevo rol
# =========================
@router.post(
    "/{persona_id}/roles",
    response_model=PersonaRol,
    status_code=status.HTTP_201_CREATED,
)
def agregar_rol(
    persona_id: int,
    data: PersonaRolCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return personas_services.agregar_rol_a_persona(
        db, persona_id, data, current_user
    )


# =========================
# PUT /personas/{id}/roles/{rol_id}
# Cerrar rol (fecha_hasta)
# =========================
@router.put(
    "/{persona_id}/roles/{rol_id}",
    response_model=PersonaRol,
)
def cerrar_rol(
    persona_id: int,
    rol_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return personas_services.cerrar_rol(
        db, persona_id, rol_id, current_user
    )


# =========================
# DELETE /personas/{id}
# Soft delete
# =========================
@router.delete(
    "/{persona_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    personas_services.eliminar_persona(db, persona_id, current_user)
