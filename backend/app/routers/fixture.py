"""
Rutas para la gestión del fixture (partidos programados).
- Lectura pública: próximos partidos.
- Programar / editar / eliminar: rol EDITOR o superior.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies.permissions import require_editor
from app.schemas.fixture_partido import (
    FixturePartidoCreate,
    FixturePartidoUpdate,
    FixturePartidoResponse,
    FixtureGenerarRequest,
    FixturePreviewResponse,
)
from app.services.fixture_services import (
    obtener_fixture_por_id,
    crear_fixture_partido,
    listar_fixture_por_torneo,
    listar_fixture_proximos,
    actualizar_fixture_partido,
    eliminar_fixture_partido,
    previsualizar_fixture,
    generar_fixture,
    eliminar_fixture_torneo,
)

router = APIRouter(prefix="/fixture", tags=["Fixture"])


# ── Público ────────────────────────────────────────────────────────────────────

@router.get("/proximos", response_model=list[FixturePartidoResponse])
def proximos_partidos(
    torneo_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Devuelve los partidos programados no jugados. Acceso público."""
    return listar_fixture_proximos(db, id_torneo=torneo_id)


@router.get("/torneo/{id_torneo}", response_model=list[FixturePartidoResponse])
def fixture_por_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
):
    """Devuelve los partidos públicos del fixture de un torneo (excluye BORRADOR). Acceso público."""
    return listar_fixture_por_torneo(db, id_torneo, solo_publicos=True)


# ── Admin / Editor ─────────────────────────────────────────────────────────────

@router.get("/admin/torneo/{id_torneo}", response_model=list[FixturePartidoResponse])
def fixture_por_torneo_admin(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Devuelve todos los partidos del fixture de un torneo incluyendo BORRADOR. Requiere EDITOR."""
    return listar_fixture_por_torneo(db, id_torneo, solo_publicos=False)


@router.post(
    "/",
    response_model=FixturePartidoResponse,
    status_code=status.HTTP_201_CREATED,
)
def programar_partido(
    data: FixturePartidoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Programa un partido futuro en el fixture. Requiere rol EDITOR o superior."""
    return crear_fixture_partido(db, data, current_user.username)


@router.put("/{id_fixture_partido}", response_model=FixturePartidoResponse)
def editar_partido(
    id_fixture_partido: int,
    data: FixturePartidoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Edita fecha, horario, ubicación o número de fecha. Requiere rol EDITOR o superior."""
    return actualizar_fixture_partido(db, id_fixture_partido, data, current_user.username)


@router.delete("/torneo/{id_torneo}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_fixture_completo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Elimina todo el fixture de un torneo si no hay partidos jugados. Requiere rol EDITOR o superior."""
    eliminar_fixture_torneo(db, id_torneo)


@router.delete("/{id_fixture_partido}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_partido(
    id_fixture_partido: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Elimina un partido programado no jugado. Requiere rol EDITOR o superior."""
    eliminar_fixture_partido(db, id_fixture_partido)


# ── Generación automática ──────────────────────────────────────────────────────

@router.post(
    "/preview/{id_torneo}",
    response_model=FixturePreviewResponse,
)
def preview_fixture(
    id_torneo: int,
    data: FixtureGenerarRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Previsualiza el fixture generado sin guardarlo. Requiere rol EDITOR o superior."""
    return previsualizar_fixture(db, id_torneo, data.tipo)


@router.post(
    "/generar/{id_torneo}",
    response_model=list[FixturePartidoResponse],
    status_code=status.HTTP_201_CREATED,
)
def generar_fixture_torneo(
    id_torneo: int,
    data: FixtureGenerarRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_editor),
):
    """Genera y guarda el fixture completo para un torneo. Requiere rol EDITOR o superior."""
    return generar_fixture(db, id_torneo, data.tipo, current_user.username)


# ── Por ID (al final para no capturar rutas literales) ─────────────────────────

@router.get("/{id_fixture_partido}", response_model=FixturePartidoResponse)
def obtener_fixture_partido(
    id_fixture_partido: int,
    db: Session = Depends(get_db),
):
    """Devuelve un partido del fixture por su ID. Acceso público."""
    return obtener_fixture_por_id(db, id_fixture_partido)
