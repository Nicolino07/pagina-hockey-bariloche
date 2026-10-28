"""
Tests de integración para /api/equipos.
Depende de que exista un club creado primero.
"""
import pytest
from uuid import uuid4


# ─── Helpers ──────────────────────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


def crear_club(client) -> int:
    resp = client.post("/api/clubes/", json={
        "nombre": f"Club Equipos {uid()}",
        "provincia": "Río Negro",
        "ciudad": f"Ciudad {uid()}",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_club"]


def equipo_base() -> dict:
    return {
        "nombre": f"Equipo {uid()}",
        "categoria": "MAYORES",
        "genero": "MASCULINO",
    }


# ─── Crear ────────────────────────────────────────────────────────────────────

def test_crear_equipo_exitoso(client_superuser):
    id_club = crear_club(client_superuser)
    base = equipo_base()
    payload = {**base, "id_club": id_club}

    response = client_superuser.post("/api/equipos/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == base["nombre"]
    assert data["id_club"] == id_club
    assert "id_equipo" in data


def test_crear_equipo_categoria_invalida(client_superuser):
    id_club = crear_club(client_superuser)
    payload = {**equipo_base(), "id_club": id_club, "categoria": "INVALIDA"}

    response = client_superuser.post("/api/equipos/", json=payload)
    assert response.status_code == 422


def test_crear_equipo_club_inexistente(client_superuser):
    payload = {**equipo_base(), "id_club": 99999}
    response = client_superuser.post("/api/equipos/", json=payload)
    assert response.status_code in (404, 422, 400, 409)


# ─── Listar ───────────────────────────────────────────────────────────────────

def test_listar_equipos(client_publico, client_superuser):
    id_club = crear_club(client_superuser)
    client_superuser.post("/api/equipos/", json={**equipo_base(), "id_club": id_club})

    response = client_publico.get("/api/equipos/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_listar_equipos_filtrar_por_club(client_publico, client_superuser):
    id_club = crear_club(client_superuser)
    client_superuser.post("/api/equipos/", json={**equipo_base(), "id_club": id_club})

    response = client_publico.get(f"/api/equipos/?id_club={id_club}")
    assert response.status_code == 200
    for equipo in response.json():
        assert equipo["id_club"] == id_club


# ─── Obtener ──────────────────────────────────────────────────────────────────

def test_obtener_equipo_existente(client_publico, client_superuser):
    id_club = crear_club(client_superuser)
    creado = client_superuser.post(
        "/api/equipos/", json={**equipo_base(), "id_club": id_club}
    ).json()

    response = client_publico.get(f"/api/equipos/{creado['id_equipo']}")
    assert response.status_code == 200
    assert response.json()["id_equipo"] == creado["id_equipo"]


def test_obtener_equipo_inexistente(client_publico):
    response = client_publico.get("/api/equipos/99999")
    assert response.status_code == 404


# ─── Actualizar ───────────────────────────────────────────────────────────────

def test_actualizar_equipo(client_superuser):
    id_club = crear_club(client_superuser)
    creado = client_superuser.post(
        "/api/equipos/", json={**equipo_base(), "id_club": id_club}
    ).json()

    nuevo_nombre = f"Equipo Mod {uid()}"
    response = client_superuser.put(
        f"/api/equipos/{creado['id_equipo']}",
        json={"nombre": nuevo_nombre, "categoria": "SUB_19"},
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == nuevo_nombre


# ─── Eliminar y restaurar ─────────────────────────────────────────────────────

def test_eliminar_equipo(client_superuser):
    id_club = crear_club(client_superuser)
    creado = client_superuser.post(
        "/api/equipos/", json={**equipo_base(), "id_club": id_club}
    ).json()

    response = client_superuser.delete(f"/api/equipos/{creado['id_equipo']}")
    assert response.status_code == 204


def test_restaurar_equipo(client_superuser):
    id_club = crear_club(client_superuser)
    creado = client_superuser.post(
        "/api/equipos/", json={**equipo_base(), "id_club": id_club}
    ).json()
    id_equipo = creado["id_equipo"]

    client_superuser.delete(f"/api/equipos/{id_equipo}")
    response = client_superuser.post(f"/api/equipos/{id_equipo}/restore")
    assert response.status_code == 200
