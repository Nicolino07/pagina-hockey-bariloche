"""
Rutas para la gestión de personas (jugadores, árbitros, técnicos, etc.).
Incluye listado, detalle, creación con rol inicial, actualización,
gestión de roles y eliminación lógica.
- Lectura básica: rol EDITOR o superior.
- Escritura y gestión de roles: rol ADMIN o superior.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from typing import Optional
from fastapi import Query
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.dependencies.permissions import require_admin, require_editor
from app.schemas.vistas import PersonaRolClubRead
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

# 🔐 EDITOR
@router.get(
    "",
    response_model=List[PersonaRead],
)
def listar_personas(
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Devuelve la lista de todas las personas registradas. Requiere rol EDITOR o superior."""
    return personas_services.listar_personas(db)

# 🔐 EDITOR
@router.get(
    "/roles-clubes",
    response_model=list[PersonaRolClubRead],
)
def listar_personas_roles_clubes(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """
    Devuelve una vista combinada de personas con sus roles en clubes.
    Requiere rol ADMIN o superior.
    """
    return personas_services.listar_personas_roles_clubes(db)

# 🔐 EDITOR
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
    """
    Devuelve personas junto con sus roles activos.
    Se puede filtrar por club (`id_club`) o por persona (`id_persona`).
    Requiere rol EDITOR o superior.
    """
    return personas_services.obtener_personas_con_roles_activos(
        db=db,
        id_club=id_club,
        id_persona=id_persona,
    )

# 🔐 EDITOR
@router.get(
    "/{persona_id}",
    response_model=PersonaRead,
)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Devuelve los datos de una persona específica por su ID. Requiere rol EDITOR o superior."""
    return personas_services.obtener_persona(db, persona_id)

# 🔐 ADMIN / SUPERUSUARIO
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
    """
    Crea una nueva persona junto con su rol inicial en un club.
    Requiere rol ADMIN o superior.
    """
    return personas_services.crear_persona_con_rol(
        db=db,
        persona_data=data.persona,
        rol_data=data.rol,
        current_user=current_user,
    )

# 🔐 ADMIN / SUPERUSUARIO
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
    """Actualiza los datos personales de una persona. Requiere rol ADMIN o superior."""
    return personas_services.actualizar_persona(
        db, persona_id, data, current_user
    )

# 🔐 ADMIN / SUPERUSUARIO
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
    """Agrega un nuevo rol (jugador, árbitro, etc.) a una persona existente. Requiere rol ADMIN o superior."""
    return personas_services.agregar_rol_a_persona(
        db, persona_id, data, current_user
    )

# 🔐 ADMIN / SUPERUSUARIO
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
    """
    Cierra un rol activo de una persona estableciendo la fecha de baja.
    Requiere rol ADMIN o superior.
    """
    return personas_services.cerrar_rol(
        db, persona_id, rol_id, current_user
    )

# 🔐 ADMIN / SUPERUSUARIO
@router.delete(
    "/{persona_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def eliminar_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Elimina lógicamente (soft delete) a una persona. Requiere rol ADMIN o superior."""
    personas_services.eliminar_persona(db, persona_id, current_user)
