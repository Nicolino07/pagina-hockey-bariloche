"""
Tests de integración para /api/planteles e /api/planteles/integrantes.

Flujo completo por test:
  club → equipo → persona (con PersonaRol) → fichaje → plantel → integrante

Así cada test es autónomo y no depende del estado que dejen otros tests.
"""
import pytest
from uuid import uuid4


# ─── Helpers de construcción ─────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


def crear_club(client, nombre=None) -> int:
    resp = client.post("/api/clubes/", json={
        "nombre": nombre or f"Club {uid()}",
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


def crear_persona(client, genero: str = "MASCULINO") -> int:
    """Crea una persona con su PersonaRol (JUGADOR). Devuelve id_persona."""
    resp = client.post("/api/personas", json={
        "persona": {
            "nombre": f"Test {uid()}",
            "apellido": f"Jugador {uid()}",
            "genero": genero,
        },
        "rol": {
            "rol": "JUGADOR",
            "fecha_desde": "2024-01-01",
        },
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_persona"]


def crear_fichaje(client, id_persona: int, id_club: int) -> int:
    """Ficha a la persona en el club como JUGADOR. Devuelve id_fichaje_rol."""
    resp = client.post("/api/fichajes", json={
        "id_persona": id_persona,
        "id_club": id_club,
        "rol": "JUGADOR",
        "fecha_inicio": "2024-01-01",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_fichaje_rol"]


def crear_plantel(client, id_equipo: int) -> int:
    resp = client.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel Test",
        "temporada": "2024",
        "activo": True,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_plantel"]


def flujo_completo(client, genero_equipo: str = "MASCULINO") -> dict:
    """
    Construye el árbol completo y devuelve todos los IDs relevantes.
    club → equipo → persona → fichaje → plantel
    """
    id_club = crear_club(client)
    id_equipo = crear_equipo(client, id_club, genero=genero_equipo)
    id_persona = crear_persona(client, genero=genero_equipo)
    id_fichaje_rol = crear_fichaje(client, id_persona, id_club)
    id_plantel = crear_plantel(client, id_equipo)
    return {
        "id_club": id_club,
        "id_equipo": id_equipo,
        "id_persona": id_persona,
        "id_fichaje_rol": id_fichaje_rol,
        "id_plantel": id_plantel,
    }


# ─── Tests: Plantel ───────────────────────────────────────────────────────────

def test_crear_plantel_exitoso(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)

    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel 2024",
        "temporada": "2024",
        "activo": True,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["id_equipo"] == id_equipo
    assert data["nombre"] == "Plantel 2024"
    assert "id_plantel" in data


def test_no_se_pueden_crear_dos_planteles_activos_mismo_equipo(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)

    client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel A",
        "temporada": "2024",
        "activo": True,
    })
    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel B",
        "temporada": "2024",
        "activo": True,
    })
    assert response.status_code == 409


def test_crear_plantel_sin_temporada_falla(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)

    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel sin temporada",
    })
    assert response.status_code == 422


def test_crear_plantel_equipo_inexistente(client_superuser):
    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": 99999,
        "nombre": "Plantel",
        "temporada": "2024",
    })
    assert response.status_code in (404, 400, 409, 422)


# ─── Tests: Obtener plantel activo ───────────────────────────────────────────

def test_obtener_plantel_activo(client_publico, client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)
    crear_plantel(client_superuser, id_equipo)

    response = client_publico.get(f"/api/planteles/activo/{id_equipo}")
    assert response.status_code == 200
    assert response.json()["id_equipo"] == id_equipo


def test_obtener_plantel_activo_equipo_sin_plantel(client_publico):
    response = client_publico.get("/api/planteles/activo/99999")
    assert response.status_code == 404


# ─── Tests: Integrantes ──────────────────────────────────────────────────────

def test_agregar_integrante_flujo_completo(client_superuser):
    """
    Flujo real: club → equipo → persona → fichaje → plantel → agregar integrante.
    El id_fichaje_rol se obtiene del fichaje creado, no se hardcodea.
    """
    ids = flujo_completo(client_superuser)

    response = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": ids["id_plantel"],
        "id_persona": ids["id_persona"],
        "id_fichaje_rol": ids["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
        "numero_camiseta": 10,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["id_persona"] == ids["id_persona"]
    assert data["id_plantel"] == ids["id_plantel"]
    assert data["numero_camiseta"] == 10


def test_no_agregar_integrante_sin_fichaje(client_superuser):
    """
    Sin fichaje activo en el club, el servicio debe rechazar el alta.
    """
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)
    id_persona = crear_persona(client_superuser)
    # ← NO se crea fichaje
    id_plantel = crear_plantel(client_superuser, id_equipo)

    response = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel,
        "id_persona": id_persona,
        "id_fichaje_rol": 99999,  # ficticio
        "rol_en_plantel": "JUGADOR",
    })
    assert response.status_code in (400, 404, 422)


def test_no_agregar_jugador_genero_incorrecto(client_superuser):
    """
    Equipo masculino no puede tener jugadora femenina.
    """
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club, genero="MASCULINO")
    id_persona = crear_persona(client_superuser, genero="FEMENINO")
    id_fichaje_rol = crear_fichaje(client_superuser, id_persona, id_club)
    id_plantel = crear_plantel(client_superuser, id_equipo)

    response = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel,
        "id_persona": id_persona,
        "id_fichaje_rol": id_fichaje_rol,
        "rol_en_plantel": "JUGADOR",
    })
    assert response.status_code in (400, 422)


def test_no_agregar_integrante_duplicado(client_superuser):
    """
    El mismo jugador no puede estar dos veces activo en el mismo plantel con el mismo rol.
    """
    ids = flujo_completo(client_superuser)

    payload = {
        "id_plantel": ids["id_plantel"],
        "id_persona": ids["id_persona"],
        "id_fichaje_rol": ids["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
    }
    client_superuser.post("/api/planteles/integrantes", json=payload)
    response = client_superuser.post("/api/planteles/integrantes", json=payload)
    assert response.status_code == 409


def test_listar_integrantes_plantel(client_publico, client_superuser):
    ids = flujo_completo(client_superuser)

    client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": ids["id_plantel"],
        "id_persona": ids["id_persona"],
        "id_fichaje_rol": ids["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
        "numero_camiseta": 7,
    })

    response = client_publico.get(f"/api/planteles/{ids['id_plantel']}/integrantes")
    assert response.status_code == 200
    integrantes = response.json()
    assert len(integrantes) == 1
    assert integrantes[0]["id_persona"] == ids["id_persona"]


def test_dar_baja_integrante(client_superuser):
    ids = flujo_completo(client_superuser)

    integrante = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": ids["id_plantel"],
        "id_persona": ids["id_persona"],
        "id_fichaje_rol": ids["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
    }).json()

    response = client_superuser.delete(
        f"/api/planteles/integrantes/{integrante['id_plantel_integrante']}"
    )
    assert response.status_code == 204


def test_dar_baja_integrante_ya_dado_de_baja(client_superuser):
    ids = flujo_completo(client_superuser)

    integrante = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": ids["id_plantel"],
        "id_persona": ids["id_persona"],
        "id_fichaje_rol": ids["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
    }).json()

    id_integrante = integrante["id_plantel_integrante"]
    client_superuser.delete(f"/api/planteles/integrantes/{id_integrante}")

    # Segunda baja: debe fallar
    response = client_superuser.delete(f"/api/planteles/integrantes/{id_integrante}")
    assert response.status_code in (400, 422)
