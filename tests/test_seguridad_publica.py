"""
Tests de seguridad sobre lo que el sitio expone sin login.

Ver docs/auditoria_seg_01.md (no versionado), puntos 1 y 2:
  - Ningún endpoint público devuelve datos personales de una persona
    (documento, fecha de nacimiento, email, teléfono, dirección).
  - Las escrituras de /api/posiciones exigen autenticación.

Hay dos niveles de chequeo:
  - Estático: recorre todas las rutas de la app y revisa el response_model
    de las que no dependen de get_current_user. Atrapa endpoints nuevos.
  - Dinámico: carga una persona con todos sus datos personales y verifica
    que los endpoints públicos no los devuelven.
"""
import typing
from uuid import uuid4

import pytest
from fastapi.routing import APIRoute
from pydantic import BaseModel

from app.main import app
from app.dependencies.auth import get_current_user


CAMPOS_PROHIBIDOS = {
    "documento",
    "persona_documento",
    "fecha_nacimiento",
    "email",
    "telefono",
    "direccion",
    "password_hash",
}

# Excepciones conscientes: la ruta es pública y el campo NO es de una persona.
# /clubes expone el contacto institucional del club (dirección, email y
# teléfono de la sede), que se muestra en el sitio público.
EXCEPCIONES = {
    "/api/clubes/": {"direccion", "email", "telefono"},
    "/api/clubes/{id_club}": {"direccion", "email", "telefono"},
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


def dni_aleatorio() -> int:
    return 10_000_000 + uuid4().int % 89_999_999


def _dependencias(dependant):
    for d in dependant.dependencies:
        yield d.call
        yield from _dependencias(d)


def _campos(tp, vistos=None):
    """Nombres de campo de un response_model, recorriendo modelos anidados y genéricos."""
    vistos = vistos if vistos is not None else set()
    for arg in typing.get_args(tp):
        yield from _campos(arg, vistos)
    if isinstance(tp, type) and issubclass(tp, BaseModel) and tp not in vistos:
        vistos.add(tp)
        for nombre, campo in tp.model_fields.items():
            yield nombre
            yield from _campos(campo.annotation, vistos)


def _claves(obj):
    """Todas las claves de un JSON, a cualquier profundidad."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield k
            yield from _claves(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from _claves(item)


def assert_sin_datos_personales(resp):
    assert resp.status_code == 200, resp.text
    expuestos = set(_claves(resp.json())) & CAMPOS_PROHIBIDOS
    assert not expuestos, f"{resp.request.url} expone {sorted(expuestos)}"


# ─── Chequeo estático de todas las rutas públicas ────────────────────────────

def test_ninguna_ruta_publica_declara_campos_personales():
    problemas = []
    for ruta in app.routes:
        if not isinstance(ruta, APIRoute) or ruta.response_model is None:
            continue
        if get_current_user in set(_dependencias(ruta.dependant)):
            continue
        expuestos = set(_campos(ruta.response_model)) & CAMPOS_PROHIBIDOS
        expuestos -= EXCEPCIONES.get(ruta.path, set())
        if expuestos:
            problemas.append(f"{sorted(ruta.methods)} {ruta.path}: {sorted(expuestos)}")
    assert not problemas, "Rutas públicas con datos personales:\n" + "\n".join(problemas)


# ─── Chequeo dinámico con una persona real cargada ───────────────────────────

@pytest.fixture()
def plantel_con_persona_completa(client_superuser):
    """club → equipo → persona (con todos sus datos) → fichaje → plantel → integrante."""
    c = client_superuser

    resp = c.post("/api/clubes/", json={
        "nombre": f"Club {uid()}", "provincia": "Río Negro", "ciudad": f"Ciudad {uid()}",
    })
    assert resp.status_code == 201, resp.text
    id_club = resp.json()["id_club"]

    resp = c.post("/api/equipos/", json={
        "nombre": f"Equipo {uid()}", "id_club": id_club,
        "categoria": "MAYORES", "genero": "MASCULINO",
    })
    assert resp.status_code == 201, resp.text
    id_equipo = resp.json()["id_equipo"]

    resp = c.post("/api/personas", json={
        "persona": {
            "nombre": f"Test {uid()}",
            "apellido": f"Privado {uid()}",
            "genero": "MASCULINO",
            "documento": dni_aleatorio(),
            "fecha_nacimiento": "2010-05-20",
            "email": f"{uid()}@example.com",
            "telefono": "2944000000",
            "direccion": "Calle Falsa 123",
        },
        "rol": {"rol": "JUGADOR", "fecha_desde": "2024-01-01"},
    })
    assert resp.status_code == 201, resp.text
    id_persona = resp.json()["id_persona"]

    resp = c.post("/api/fichajes", json={
        "id_persona": id_persona, "id_club": id_club,
        "rol": "JUGADOR", "fecha_inicio": "2024-01-01",
    })
    assert resp.status_code == 201, resp.text
    id_fichaje_rol = resp.json()["id_fichaje_rol"]

    resp = c.post("/api/planteles/", json={
        "id_equipo": id_equipo, "nombre": "Plantel Test", "temporada": "2024", "activo": True,
    })
    assert resp.status_code == 201, resp.text
    id_plantel = resp.json()["id_plantel"]

    resp = c.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel, "id_persona": id_persona,
        "id_fichaje_rol": id_fichaje_rol, "rol_en_plantel": "JUGADOR",
        "numero_camiseta": 10,
    })
    assert resp.status_code == 201, resp.text

    # A partir de acá, sin usuario: los requests salen como anónimos.
    app.dependency_overrides.clear()
    return {"id_club": id_club, "id_equipo": id_equipo, "id_plantel": id_plantel}


def test_integrantes_publico_sin_datos_personales(client_publico, plantel_con_persona_completa):
    ids = plantel_con_persona_completa
    resp = client_publico.get(
        f"/api/planteles/{ids['id_plantel']}/integrantes", params={"solo_activos": False}
    )
    assert_sin_datos_personales(resp)
    # Sigue sirviendo lo que muestra el sitio público.
    integrante = resp.json()[0]
    assert integrante["persona"]["nombre"]
    assert integrante["persona"]["apellido"]
    assert integrante["numero_camiseta"] == 10


def test_integrantes_publico_solo_lo_que_muestra_el_sitio(client_publico, plantel_con_persona_completa):
    """Sin fechas de alta/baja ni partidos jugados: eso es info del panel."""
    ids = plantel_con_persona_completa
    resp = client_publico.get(f"/api/planteles/{ids['id_plantel']}/integrantes")
    assert resp.status_code == 200, resp.text
    assert set(resp.json()[0]) == {
        "id_plantel_integrante", "id_persona", "rol_en_plantel", "numero_camiseta", "persona",
    }


def test_plantel_activo_por_equipo_sin_auditoria(client_publico, plantel_con_persona_completa):
    """El plantel público no expone fechas ni quién lo cargó en el panel."""
    ids = plantel_con_persona_completa
    resp = client_publico.get(f"/api/planteles/activo/{ids['id_equipo']}")
    assert resp.status_code == 200, resp.text
    plantel = resp.json()
    assert plantel["id_plantel"] == ids["id_plantel"]
    assert not {"creado_por", "actualizado_por", "creado_en", "fecha_apertura"} & set(plantel)


def test_plantel_activo_publico_sin_datos_personales(client_publico, plantel_con_persona_completa):
    ids = plantel_con_persona_completa
    resp = client_publico.get(f"/api/vistas/plantel-activo/{ids['id_equipo']}")
    assert_sin_datos_personales(resp)
    assert resp.json()[0]["apellido_persona"]


def test_arbitros_publico_sin_datos_personales(client_publico):
    assert_sin_datos_personales(client_publico.get("/api/vistas/persona-arbitro/"))


def test_jugadores_participaron_publico_sin_datos_personales(client_publico):
    assert_sin_datos_personales(client_publico.get("/api/vistas/jugadores-participaron/1"))


@pytest.mark.parametrize("ruta", [
    "/api/fichajes/club/{id_club}",
    "/api/planteles/{id_plantel}/integrantes/detalle",
    "/api/vistas/plantel-activo/{id_equipo}/detalle",
])
def test_rutas_con_dni_exigen_login(client_publico, plantel_con_persona_completa, ruta):
    resp = client_publico.get(ruta.format(**plantel_con_persona_completa))
    assert resp.status_code == 401, resp.text


def test_panel_sigue_recibiendo_el_dni(plantel_con_persona_completa, client_editor):
    """Las versiones protegidas siguen entregando el DNI que usa el panel."""
    ids = plantel_con_persona_completa

    resp = client_editor.get(f"/api/planteles/{ids['id_plantel']}/integrantes/detalle")
    assert resp.status_code == 200, resp.text
    assert resp.json()[0]["persona"]["documento"]

    resp = client_editor.get(f"/api/vistas/plantel-activo/{ids['id_equipo']}/detalle")
    assert resp.status_code == 200, resp.text
    assert resp.json()[0]["documento"]

    resp = client_editor.get(f"/api/fichajes/club/{ids['id_club']}")
    assert resp.status_code == 200, resp.text
    assert resp.json()[0]["persona_documento"]


# ─── /api/posiciones ─────────────────────────────────────────────────────────

# Estos tests no deben poder modificar datos aunque la protección se pierda:
# se usa un id inexistente y un body inválido. Sin auth, la API respondería
# 404/422 (y el test fallaría igual); con auth, 401 antes de tocar la base.
ID_INEXISTENTE = 999_999_999


def test_posiciones_crear_sin_token_401(client_publico):
    assert client_publico.post("/api/posiciones/", json={}).status_code == 401


def test_posiciones_editar_sin_token_401(client_publico):
    resp = client_publico.put(f"/api/posiciones/{ID_INEXISTENTE}", json={})
    assert resp.status_code == 401


def test_posiciones_borrar_sin_token_401(client_publico):
    assert client_publico.delete(f"/api/posiciones/{ID_INEXISTENTE}").status_code == 401


def test_posiciones_lectura_sigue_publica(client_publico):
    assert client_publico.get("/api/posiciones/").status_code == 200
