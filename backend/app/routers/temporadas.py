# app/routers/temporadas.py
"""Rutas de temporadas: agrupación anual de torneos y su tabla de posiciones.

La tabla anual **todavía no es pública**: se muestra solo a ADMIN/SUPERUSUARIO
mientras se termina de validar con la liga. Por eso incluso las lecturas piden
`require_admin` — ocultar la pestaña en el front sin cerrar el endpoint dejaría
la tabla accesible con la URL a mano. Cuando se publique, estas tres rutas de
lectura pasan a no tener dependencia y el front las consume con AxiosPublic.

El ABM y la asignación de torneos requieren SUPERUSUARIO, igual que el de torneos.
"""
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.permissions import require_superuser, require_admin
from app.models.usuario import Usuario
from app.schemas.temporada import (
    TemporadaSchema,
    TemporadaCreate,
    TemporadaUpdate,
    AsignarTorneoRequest,
    FilaTablaAnual,
    TorneoEnTemporada,
    SelectorTablaAnual,
    TorneoComputable,
    DefinirComputablesRequest,
    CrearPlayoffAnualRequest,
    PlayoffAnualResponse,
)
from app.services import temporadas_services, playoff_anual_services

router = APIRouter(prefix="/temporadas", tags=["Temporadas"])


# 🔐 ADMIN (todavía no es público)
@router.get("/", response_model=List[TemporadaSchema])
def listar_temporadas(
    db: Session = Depends(get_db),
    anio: Optional[int] = Query(None, description="Filtrar por año"),
    solo_activas: bool = Query(False, description="Solo temporadas activas"),
    current_user: Usuario = Depends(require_admin),
):
    """Lista las temporadas con los torneos que las componen."""
    return temporadas_services.listar_temporadas(
        db, anio=anio, solo_activas=solo_activas
    )


# 🔐 ADMIN (todavía no es público)
@router.get("/{id_temporada}", response_model=TemporadaSchema)
def obtener_temporada(
    id_temporada: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Devuelve una temporada con sus torneos."""
    return temporadas_services.obtener_temporada(db, id_temporada)


# 🔐 ADMIN (todavía no es público)
@router.get("/{id_temporada}/posiciones", response_model=List[FilaTablaAnual])
def tabla_anual(
    id_temporada: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Tabla de posiciones anual: suma de los torneos REGULAR de la temporada.

    Devuelve lista vacía si todavía no hay ningún torneo marcado como REGULAR.
    """
    return temporadas_services.obtener_tabla_anual(db, id_temporada)


# 🔐 SUPERUSUARIO
@router.get("/{id_temporada}/torneos-asignables", response_model=List[TorneoEnTemporada])
def torneos_asignables(
    id_temporada: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Torneos de la misma categoría/género/división que se pueden sumar."""
    return temporadas_services.torneos_asignables(db, id_temporada)


# 🔐 SUPERUSUARIO
@router.post("/", response_model=TemporadaSchema, status_code=status.HTTP_201_CREATED)
def crear_temporada(
    data: TemporadaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Crea una temporada (una liga en un año)."""
    return temporadas_services.crear_temporada(db, data, current_user)


# 🔐 SUPERUSUARIO
@router.put("/{id_temporada}", response_model=TemporadaSchema)
def actualizar_temporada(
    id_temporada: int,
    data: TemporadaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Actualiza nombre y estado de la temporada."""
    return temporadas_services.actualizar_temporada(db, id_temporada, data, current_user)


# 🔐 SUPERUSUARIO
@router.post("/{id_temporada}/torneos", response_model=TorneoEnTemporada)
def asignar_torneo(
    id_temporada: int,
    data: AsignarTorneoRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Asocia un torneo a la temporada con su rol, o lo desasocia con rol=null.

    El rol define si el torneo suma a la tabla anual (REGULAR), si solo se
    agrupa en el año (NO_COMPUTA) o si es el playoff del campeón (FINAL_ANUAL).
    """
    return temporadas_services.asignar_torneo(
        db, id_temporada, data.id_torneo, data.rol, current_user
    )


# 🔐 SUPERUSUARIO
@router.delete("/{id_temporada}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_temporada(
    id_temporada: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Baja lógica de la temporada. Los torneos quedan sin temporada asignada."""
    temporadas_services.eliminar_temporada(db, id_temporada, current_user)


# 🔐 ADMIN — datos del selector "Torneos que suman a la tabla anual"
@router.get("/selector/torneos", response_model=SelectorTablaAnual)
def selector_tabla_anual(
    anio: int,
    categoria: str,
    genero: str,
    division: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Torneos de una liga en un año, marcando cuáles suman a la tabla anual.

    `division` vacío o ausente significa "sin división", que es un valor real:
    varias categorías no usan divisiones.
    """
    from app.models.enums import CategoriaTipo, GeneroTipo

    div = division or None
    cat = CategoriaTipo(categoria)
    gen = GeneroTipo(genero)

    torneos = temporadas_services.torneos_de_categoria(
        db, categoria=cat, genero=gen, division=div, anio=anio
    )
    temporada = temporadas_services._buscar_temporada_por_tupla(db, anio, cat, gen, div)

    return SelectorTablaAnual(
        anio=anio,
        categoria=cat,
        division=div,
        genero=gen,
        id_temporada=temporada.id_temporada if temporada else None,
        nombre_temporada=temporada.nombre if temporada else None,
        torneos=[
            TorneoComputable(
                id_torneo=t.id_torneo,
                nombre=t.nombre,
                tipo=t.tipo,
                fecha_inicio=t.fecha_inicio,
                activo=t.activo,
                computa=t.computa_anual,
            )
            for t in torneos
        ],
    )


# 🔐 SUPERUSUARIO — aplicar la selección y regenerar la tabla
@router.put("/selector/torneos", response_model=List[FilaTablaAnual])
def definir_torneos_computables(
    data: DefinirComputablesRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Aplica la selección completa y devuelve la tabla anual ya recalculada.

    Es el botón «Regenerar tabla anual»: se manda el estado final de los tildes,
    no un alta o baja individual. Crea la temporada si es la primera vez que se
    marca algo en esa liga.
    """
    temporada = temporadas_services.definir_torneos_computables(
        db,
        categoria=data.categoria,
        genero=data.genero,
        division=data.division or None,
        anio=data.anio,
        id_torneos=data.id_torneos,
        current_user=current_user,
    )
    if temporada is None:
        return []
    return temporadas_services.obtener_tabla_anual(db, temporada.id_temporada)


# 🔐 SUPERUSUARIO — playoff por el campeón del año
@router.post(
    "/{id_temporada}/playoff",
    response_model=PlayoffAnualResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_playoff_anual(
    id_temporada: int,
    data: CrearPlayoffAnualRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Crea el playoff del campeón anual y arma su bracket desde la tabla anual.

    Devuelve el torneo creado junto con lo que no se pudo resolver solo: los
    integrantes que no se pudieron heredar y los equipos sin nómina propia en
    el año. Nada de eso aborta la creación, pero hay que verlo.
    """
    return playoff_anual_services.crear_playoff_anual(
        db, id_temporada, data, current_user
    )
