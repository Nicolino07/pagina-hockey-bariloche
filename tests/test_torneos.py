"""
Tests de integración para /api/torneos y /torneos/{id}/inscripciones.

Flujo por test: torneo (con nombre único via uid).
Para inscripciones: club → equipo → torneo → inscripción.
"""
import pytest
from uuid import uuid4


# ─── Helpers ──────────────────────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


def torneo_valido(genero: str = "MASCULINO", categoria: str = "MAYORES") -> dict:
    return {
        "nombre": f"Torneo {uid()}",
        "categoria": categoria,
        "genero": genero,
        "fecha_inicio": "2024-03-01",
        "activo": True,
    }


def crear_torneo(client, genero: str = "MASCULINO", categoria: str = "MAYORES") -> int:
    resp = client.post("/api/torneos/", json=torneo_valido(genero, categoria))
    assert resp.status_code == 201, resp.text
    return resp.json()["id_torneo"]


def crear_club(client) -> int:
    resp = client.post("/api/clubes/", json={
        "nombre": f"Club {uid()}",
        "provincia": "Río Negro",
        "ciudad": f"Ciudad {uid()}",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_club"]


def crear_equipo(client, id_club: int, genero: str = "MASCULINO") -> int:
    resp = client.post("/api/equipos/", json={
        "nombre": f"Equipo {uid()}",
        "id_club": id_club,
        "categoria": "MAYORES",
        "genero": genero,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_equipo"]


# ─── Tests: Crear torneo ──────────────────────────────────────────────────────

def test_crear_torneo_exitoso(client_superuser):
    datos = torneo_valido()
    response = client_superuser.post("/api/torneos/", json=datos)
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == datos["nombre"]
    assert data["categoria"] == datos["categoria"]
    assert data["genero"] == datos["genero"]
    assert "id_torneo" in data


def test_crear_torneo_sin_nombre_falla(client_superuser):
    datos = torneo_valido()
    del datos["nombre"]
    response = client_superuser.post("/api/torneos/", json=datos)
    assert response.status_code == 422


def test_crear_torneo_categoria_invalida(client_superuser):
    datos = torneo_valido()
    datos["categoria"] = "INVALIDA"
    response = client_superuser.post("/api/torneos/", json=datos)
    assert response.status_code == 422


def test_crear_torneo_genero_invalido(client_superuser):
    datos = torneo_valido()
    datos["genero"] = "OTRO"
    response = client_superuser.post("/api/torneos/", json=datos)
    assert response.status_code == 422


def test_crear_torneo_fecha_fin_anterior_a_inicio_falla(client_superuser):
    datos = torneo_valido()
    datos["fecha_inicio"] = "2024-06-01"
    datos["fecha_fin"] = "2024-03-01"
    response = client_superuser.post("/api/torneos/", json=datos)
    assert response.status_code == 422


# ─── Tests: Listar torneos ────────────────────────────────────────────────────

def test_listar_torneos_publico(client_publico, client_superuser):
    crear_torneo(client_superuser)
    response = client_publico.get("/api/torneos/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_listar_torneos_solo_activos_por_defecto(client_publico, client_superuser):
    response = client_publico.get("/api/torneos/")
    assert response.status_code == 200
    for t in response.json():
        assert t["activo"] is True


# ─── Tests: Obtener torneo ───────────────────────────────────────────────────

def test_obtener_torneo_existente(client_publico, client_superuser):
    id_torneo = crear_torneo(client_superuser)
    response = client_publico.get(f"/api/torneos/{id_torneo}")
    assert response.status_code == 200
    assert response.json()["id_torneo"] == id_torneo


def test_obtener_torneo_inexistente(client_publico):
    response = client_publico.get("/api/torneos/99999")
    assert response.status_code == 404


# ─── Tests: Actualizar torneo ────────────────────────────────────────────────

def test_actualizar_torneo(client_superuser):
    id_torneo = crear_torneo(client_superuser)
    nuevo_nombre = f"Torneo Modificado {uid()}"
    response = client_superuser.put(f"/api/torneos/{id_torneo}", json={
        "nombre": nuevo_nombre,
        "categoria": "MAYORES",
        "genero": "MASCULINO",
        "fecha_inicio": "2024-03-01",
    })
    assert response.status_code == 200
    assert response.json()["nombre"] == nuevo_nombre


# ─── Tests: Finalizar torneo ─────────────────────────────────────────────────

def test_finalizar_torneo(client_superuser):
    id_torneo = crear_torneo(client_superuser)
    response = client_superuser.post(f"/api/torneos/{id_torneo}/finalizar", json={
        "fecha_fin": "2024-12-01"
    })
    assert response.status_code == 200
    assert response.json()["activo"] is False


def test_reabrir_torneo_finalizado(client_superuser):
    id_torneo = crear_torneo(client_superuser)
    client_superuser.post(f"/api/torneos/{id_torneo}/finalizar")
    response = client_superuser.post(f"/api/torneos/{id_torneo}/reabrir")
    assert response.status_code == 200
    assert response.json()["activo"] is True


# ─── Tests: Eliminar y restaurar ─────────────────────────────────────────────

def test_eliminar_torneo_soft(client_superuser):
    id_torneo = crear_torneo(client_superuser)
    response = client_superuser.delete(f"/api/torneos/{id_torneo}")
    assert response.status_code == 200
    data = response.json()
    assert data["id_torneo"] == id_torneo
    assert "borrado_en" in data


def test_restaurar_torneo(client_superuser):
    id_torneo = crear_torneo(client_superuser)
    client_superuser.delete(f"/api/torneos/{id_torneo}")
    response = client_superuser.post(f"/api/torneos/{id_torneo}/restaurar")
    assert response.status_code == 200
    assert response.json()["id_torneo"] == id_torneo


# ─── Tests: Inscripciones ────────────────────────────────────────────────────

def test_inscribir_equipo_en_torneo(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club, genero="MASCULINO")
    id_torneo = crear_torneo(client_superuser, genero="MASCULINO")

    response = client_superuser.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )
    assert response.status_code == 201


def test_inscribir_equipo_genero_incorrecto(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club, genero="FEMENINO")
    id_torneo = crear_torneo(client_superuser, genero="MASCULINO")

    response = client_superuser.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )
    assert response.status_code in (400, 409, 422)


def test_no_inscribir_equipo_duplicado(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club, genero="MASCULINO")
    id_torneo = crear_torneo(client_superuser, genero="MASCULINO")

    client_superuser.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )
    response = client_superuser.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )
    assert response.status_code in (400, 409, 422)


def test_listar_inscripciones_torneo(client_publico, client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club, genero="MASCULINO")
    id_torneo = crear_torneo(client_superuser, genero="MASCULINO")

    client_superuser.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )

    response = client_publico.get(f"/api/torneos/{id_torneo}/inscripciones/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1
