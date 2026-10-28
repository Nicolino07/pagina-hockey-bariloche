"""
Tests de integración para /api/personas.
Crear persona requiere rol + club, así que también se crea un club.
"""
import pytest
from uuid import uuid4


# ─── Helpers ──────────────────────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


def crear_club(client) -> int:
    resp = client.post("/api/clubes/", json={
        "nombre": f"Club Personas {uid()}",
        "provincia": "Río Negro",
        "ciudad": f"Ciudad {uid()}",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_club"]


def payload_persona(id_club: int) -> dict:
    u = uid()
    return {
        "persona": {
            "nombre": f"Juan {u}",
            "apellido": f"Pérez {u}",
            "genero": "MASCULINO",
        },
        "rol": {
            "rol": "JUGADOR",
            "fecha_desde": "2024-01-01",
            "id_club": id_club,
        },
    }


# ─── Crear ────────────────────────────────────────────────────────────────────

def test_crear_persona_exitoso(client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)

    response = client_superuser.post("/api/personas", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == payload["persona"]["nombre"]
    assert data["apellido"] == payload["persona"]["apellido"]
    assert "id_persona" in data


def test_crear_persona_sin_nombre_falla(client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    del payload["persona"]["nombre"]

    response = client_superuser.post("/api/personas", json=payload)
    assert response.status_code == 422


def test_crear_persona_genero_invalido(client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    payload["persona"]["genero"] = "OTRO"

    response = client_superuser.post("/api/personas", json=payload)
    assert response.status_code == 422


# ─── Listar ───────────────────────────────────────────────────────────────────

def test_listar_personas(client_editor, client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    client_superuser.post("/api/personas", json=payload)

    response = client_editor.get("/api/personas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ─── Obtener ──────────────────────────────────────────────────────────────────

def test_obtener_persona_existente(client_superuser, client_editor):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    creada = client_superuser.post("/api/personas", json=payload).json()

    response = client_editor.get(f"/api/personas/{creada['id_persona']}")
    assert response.status_code == 200
    assert response.json()["id_persona"] == creada["id_persona"]


def test_obtener_persona_inexistente(client_editor):
    response = client_editor.get("/api/personas/99999")
    assert response.status_code == 404


# ─── Actualizar ───────────────────────────────────────────────────────────────

def test_actualizar_persona(client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    creada = client_superuser.post("/api/personas", json=payload).json()

    response = client_superuser.put(
        f"/api/personas/{creada['id_persona']}",
        json={"nombre": "Carlos", "apellido": "Gómez"},
    )
    assert response.status_code == 200
    assert response.json()["nombre"] == "Carlos"


# ─── Eliminar ─────────────────────────────────────────────────────────────────

def test_eliminar_persona(client_superuser):
    id_club = crear_club(client_superuser)
    payload = payload_persona(id_club)
    creada = client_superuser.post("/api/personas", json=payload).json()

    response = client_superuser.delete(f"/api/personas/{creada['id_persona']}")
    assert response.status_code == 204
