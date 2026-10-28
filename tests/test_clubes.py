"""
Tests de integración para el endpoint /api/clubes.
Cubre: crear, listar, obtener, actualizar, eliminar y restaurar.
"""
import pytest
from uuid import uuid4


def uid() -> str:
    return uuid4().hex[:8]


def club_valido() -> dict:
    return {
        "nombre": f"Club Test {uid()}",
        "provincia": "Río Negro",
        "ciudad": f"Ciudad {uid()}",
        "direccion": "Av. Bustillo 1000",
        "telefono": "2944123456",
        "email": f"test{uid()}@club.com",
    }


# ─── Crear ────────────────────────────────────────────────────────────────────

def test_crear_club_exitoso(client_superuser):
    datos = club_valido()
    response = client_superuser.post("/api/clubes/", json=datos)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == datos["nombre"]
    assert data["ciudad"] == datos["ciudad"]
    assert "id_club" in data


def test_crear_club_sin_nombre_falla(client_superuser):
    payload = club_valido()
    del payload["nombre"]
    response = client_superuser.post("/api/clubes/", json=payload)
    assert response.status_code == 422


# ─── Listar ───────────────────────────────────────────────────────────────────

def test_listar_clubes_publico(client_publico, client_superuser):
    client_superuser.post("/api/clubes/", json=club_valido())
    response = client_publico.get("/api/clubes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ─── Obtener ──────────────────────────────────────────────────────────────────

def test_obtener_club_existente(client_publico, client_superuser):
    creado = client_superuser.post("/api/clubes/", json=club_valido()).json()
    id_club = creado["id_club"]

    response = client_publico.get(f"/api/clubes/{id_club}")
    assert response.status_code == 200
    assert response.json()["id_club"] == id_club


def test_obtener_club_inexistente(client_publico):
    response = client_publico.get("/api/clubes/99999")
    assert response.status_code == 404


# ─── Actualizar ───────────────────────────────────────────────────────────────

def test_actualizar_club(client_superuser):
    creado = client_superuser.post("/api/clubes/", json=club_valido()).json()
    id_club = creado["id_club"]
    nuevo_nombre = f"Club Modificado {uid()}"

    response = client_superuser.put(
        f"/api/clubes/{id_club}",
        json={"nombre": nuevo_nombre, "ciudad": f"Ciudad {uid()}"},
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == nuevo_nombre


# ─── Eliminar y restaurar ─────────────────────────────────────────────────────

def test_eliminar_club(client_superuser):
    creado = client_superuser.post("/api/clubes/", json=club_valido()).json()
    response = client_superuser.delete(f"/api/clubes/{creado['id_club']}")
    assert response.status_code == 204


def test_restaurar_club(client_superuser):
    creado = client_superuser.post("/api/clubes/", json=club_valido()).json()
    id_club = creado["id_club"]

    client_superuser.delete(f"/api/clubes/{id_club}")
    response = client_superuser.post(f"/api/clubes/{id_club}/restore")
    assert response.status_code == 200
    assert response.json()["id_club"] == id_club
