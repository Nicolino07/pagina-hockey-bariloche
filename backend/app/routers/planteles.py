"""
Rutas para la gestión de planteles e integrantes de equipos.
- Lectura de plantel activo e integrantes: acceso público.
- Creación de plantel: rol ADMIN o superior.
- Alta/baja de integrantes: rol EDITOR o superior.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from fastapi import Request, Response

from app.database import get_db
from app.core.exceptions import NotFoundError
from app.schemas.plantel import (
    PlantelCreate,
    PlantelRead,
    PlantelUpdate,
    PlantelCopiar,
    PlantelCopiaResultado,
)
from app.schemas.torneo import TorneoSchema
from app.schemas.plantel_integrante import (
    PlantelIntegranteCreate,
    PlantelIntegranteRead,
)
from app.services import planteles_services, plantel_resolver
from app.dependencies.permissions import require_admin, require_editor

router = APIRouter(
    prefix="/planteles",
    tags=["Planteles - Integrantes"]
)

# 🔐 ADMIN / SUPERUSUARIO
@router.options("/integrantes")
async def options_integrantes(request: Request):
    """Responde a solicitudes OPTIONS de preflight CORS para la ruta de integrantes."""
    return Response(status_code=204)

# 🔐 ADMIN
@router.post(
    "/",
    response_model=PlantelRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_plantel(
    data: PlantelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Crea un nuevo plantel para un equipo. Requiere rol ADMIN o superior."""
    return planteles_services.crear_plantel(
        db=db,
        data=data,
        current_user=current_user,
    )


# 🔐 ADMIN / SUPERUSUARIO
@router.post(
    "/integrantes",
    response_model=PlantelIntegranteRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_integrante(
    data: PlantelIntegranteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Agrega un integrante al plantel activo de un equipo. Requiere rol EDITOR o superior."""
    return planteles_services.crear_integrante(
        db=db,
        data=data,
        current_user=current_user,
    )


@router.get(
    "/activo/{id_equipo}",
    response_model=PlantelRead,
    status_code=status.HTTP_200_OK,
)
def obtener_plantel_activo(
    id_equipo: int,
    db: Session = Depends(get_db),
):
    """Devuelve el plantel activo de un equipo por su ID. Acceso público."""
    plantel = planteles_services.obtener_plantel_activo_por_equipo(db, id_equipo)

    if not plantel:
        raise NotFoundError("El equipo no tiene plantel activo")

    return plantel


@router.get(
    "/{id_plantel}/integrantes",
    response_model=list[PlantelIntegranteRead],
)
def listar_integrantes(
    id_plantel: int,
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    """Devuelve los integrantes de un plantel. Con solo_activos=false incluye los dados de baja."""
    return planteles_services.listar_integrantes_por_plantel(
        db=db,
        id_plantel=id_plantel,
        solo_activos=solo_activos,
    )


@router.get(
    "/equipo/{id_equipo}",
    response_model=list[PlantelRead],
    status_code=status.HTTP_200_OK,
)
def listar_planteles_por_equipo(
    id_equipo: int,
    db: Session = Depends(get_db),
):
    """Devuelve todos los planteles de un equipo (activos e históricos). Acceso público."""
    return planteles_services.listar_planteles_por_equipo(db, id_equipo)


@router.get(
    "/torneos-disponibles/{id_equipo}",
    response_model=list[TorneoSchema],
    status_code=status.HTTP_200_OK,
)
def torneos_disponibles_para_plantel(
    id_equipo: int,
    db: Session = Depends(get_db),
):
    """Torneos a los que se le puede crear una nómina a este equipo.

    Son los activos donde el equipo está inscripto, que no sean fase final y
    donde todavía no tenga plantel. Alimenta el selector del alta para que no
    ofrezca opciones inválidas. Acceso público.
    """
    return planteles_services.torneos_disponibles_para_plantel(db, id_equipo)


@router.get(
    "/resolver",
    response_model=PlantelRead,
    status_code=status.HTTP_200_OK,
)
def resolver_plantel_de_torneo(
    id_equipo: int,
    id_torneo: int,
    db: Session = Depends(get_db),
):
    """Devuelve el plantel que corresponde usar para ese equipo en ese torneo.

    Contempla los playoffs (usan el plantel del torneo base) y cae al plantel
    histórico si el equipo todavía no tiene nómina propia en el torneo.
    Acceso público.
    """
    plantel = plantel_resolver.resolver_plantel(db, id_equipo, id_torneo)
    if plantel is None:
        raise NotFoundError("El equipo no tiene plantel para ese torneo")
    return plantel


# 🔐 ADMIN
@router.post(
    "/copiar",
    response_model=PlantelCopiaResultado,
    status_code=status.HTTP_201_CREATED,
)
def copiar_plantel(
    data: PlantelCopiar,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Copia la nómina hacia otro plantel del mismo equipo.

    El destino puede ser un plantel existente (`id_plantel_destino`) o un
    torneo (`id_torneo_destino`, crea el plantel).

    Los integrantes que ya no son elegibles (fichaje vencido, suspensión, etc.)
    se devuelven en `omitidos` con el motivo en vez de abortar toda la copia.
    Requiere rol ADMIN o superior.
    """
    resultado = planteles_services.copiar_plantel(
        db=db,
        id_plantel_origen=data.id_plantel_origen,
        id_plantel_destino=data.id_plantel_destino,
        id_torneo_destino=data.id_torneo_destino,
        current_user=current_user,
    )
    db.commit()
    return resultado


@router.put(
    "/{id_plantel}",
    response_model=PlantelRead,
    status_code=status.HTTP_200_OK,
)
def actualizar_plantel(
    id_plantel: int,
    data: PlantelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Edita nombre, temporada y descripción de un plantel. Requiere rol EDITOR o superior."""
    return planteles_services.actualizar_plantel(
        db=db,
        id_plantel=id_plantel,
        data=data,
        current_user=current_user,
    )


# 🔐 ADMIN / SUPERUSUARIO - Preview: ¿se puede eliminar el plantel?
@router.get("/{id_plantel}/impacto-eliminacion")
def impacto_eliminacion_plantel(
    id_plantel: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Devuelve si el plantel puede eliminarse y cuántos integrantes lo bloquean."""
    try:
        return planteles_services.dependencias_plantel(db, id_plantel)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{id_plantel}",
    status_code=status.HTTP_200_OK,
)
def eliminar_plantel(
    id_plantel: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Elimina DEFINITIVAMENTE un plantel con el que nunca se jugó.

    Un plantel cargado por error se borra aunque tenga jugadores. Si ya se
    disputó algún partido con esa nómina, se rechaza: borrarlo arrastraría
    goles y tarjetas.
    """
    try:
        dep = planteles_services.eliminar_plantel(
            db=db,
            id_plantel=id_plantel,
            current_user=current_user,
        )
        return {"detail": "Plantel eliminado definitivamente", "impacto": dep}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 ADMIN / SUPERUSUARIO
@router.delete(
    "/integrantes/{id_integrante}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def baja_integrante(
    id_integrante: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Da de baja a un integrante del plantel. Requiere rol EDITOR o superior."""
    planteles_services.baja_integrante(
        db=db,
        id_integrante=id_integrante,
        current_user=current_user,
    )
