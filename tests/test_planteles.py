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


def test_crear_plantel_sin_temporada_ok(client_superuser):
    """Desde la migración 0033 `temporada` es opcional: se deriva del torneo.

    En un plantel histórico (sin torneo) lo obligatorio pasa a ser el nombre.
    """
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)

    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
        "nombre": "Plantel sin temporada",
    })
    assert response.status_code == 201, response.text


def test_crear_plantel_historico_sin_nombre_falla(client_superuser):
    """Sin torneo no hay de dónde derivar el nombre, así que es obligatorio."""
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)

    response = client_superuser.post("/api/planteles/", json={
        "id_equipo": id_equipo,
    })
    assert response.status_code in (400, 422), response.text


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


# ─── Plantel por torneo (migración 0033) ─────────────────────────────────────

def _crear_torneo(client, categoria="MAYORES", genero="MASCULINO") -> int:
    resp = client.post("/api/torneos/", json={
        "nombre": f"Torneo {uid()}",
        "categoria": categoria,
        "genero": genero,
        "fecha_inicio": "2026-01-01",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_torneo"]


def _inscribir(client, id_torneo: int, id_equipo: int) -> None:
    resp = client.post(f"/api/torneos/{id_torneo}/inscripciones/", json={
        "id_equipo": id_equipo,
        "id_torneo": id_torneo,
    })
    assert resp.status_code in (200, 201), resp.text


def test_dos_planteles_activos_en_torneos_distintos_se_permite(client_superuser):
    """El punto del cambio: un equipo puede tener una nómina por torneo."""
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)
    t1 = _crear_torneo(client_superuser)
    t2 = _crear_torneo(client_superuser)
    _inscribir(client_superuser, t1, id_equipo)
    _inscribir(client_superuser, t2, id_equipo)

    r1 = client_superuser.post("/api/planteles/", json={"id_equipo": id_equipo, "id_torneo": t1})
    r2 = client_superuser.post("/api/planteles/", json={"id_equipo": id_equipo, "id_torneo": t2})

    assert r1.status_code == 201, r1.text
    assert r2.status_code == 201, r2.text
    assert r1.json()["id_plantel"] != r2.json()["id_plantel"]


def test_dos_planteles_en_el_mismo_torneo_falla(client_superuser):
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)
    t1 = _crear_torneo(client_superuser)
    _inscribir(client_superuser, t1, id_equipo)

    client_superuser.post("/api/planteles/", json={"id_equipo": id_equipo, "id_torneo": t1})
    r2 = client_superuser.post("/api/planteles/", json={"id_equipo": id_equipo, "id_torneo": t1})
    assert r2.status_code == 409, r2.text


def test_plantel_de_torneo_sin_inscripcion_falla(client_superuser):
    """No tiene sentido una nómina para un torneo que el equipo no juega."""
    id_club = crear_club(client_superuser)
    id_equipo = crear_equipo(client_superuser, id_club)
    t1 = _crear_torneo(client_superuser)

    r = client_superuser.post("/api/planteles/", json={"id_equipo": id_equipo, "id_torneo": t1})
    assert r.status_code in (400, 422), r.text


def test_plantel_cerrado_no_se_puede_modificar(client_superuser, db):
    """Una nómina cerrada es de solo lectura.

    Ya no hay cierre manual: el plantel se cierra al finalizar su torneo, así
    que acá se cierra directo en la base para aislar la regla que se prueba.
    """
    from sqlalchemy import text
    datos = flujo_completo(client_superuser)
    id_plantel = datos["id_plantel"]

    db.execute(
        text("UPDATE plantel SET activo = false, fecha_cierre = CURRENT_DATE "
             "WHERE id_plantel = :p"),
        {"p": id_plantel},
    )
    db.commit()

    # Otra persona fichada en el mismo club, para que solo falle por el cierre.
    id_persona = crear_persona(client_superuser)
    id_fichaje = crear_fichaje(client_superuser, id_persona, datos["id_club"])

    resp = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel,
        "id_persona": id_persona,
        "id_fichaje_rol": id_fichaje,
        "rol_en_plantel": "JUGADOR",
    })
    assert resp.status_code in (400, 409, 422), resp.text
    assert "cerrado" in resp.text.lower()


def test_integrante_que_jugo_sigue_visible_tras_la_baja(client_superuser, db):
    """Quien jugó no desaparece de la nómina: queda marcado como de baja.

    Es el registro de quiénes integraron el equipo en ese torneo.
    """
    from sqlalchemy import text
    from app.services import planteles_services

    fila = db.execute(text("""
        SELECT pi.id_plantel, pi.id_plantel_integrante
        FROM participan_partido pp
        JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
        WHERE pi.fecha_baja IS NULL
        LIMIT 1
    """)).first()
    if fila is None:
        pytest.skip("No hay integrantes con partidos jugados")
    id_plantel, id_pi = fila

    db.execute(
        text("UPDATE plantel_integrante SET fecha_baja = CURRENT_DATE WHERE id_plantel_integrante = :i"),
        {"i": id_pi},
    )
    db.flush()

    visibles = planteles_services.listar_integrantes_por_plantel(db, id_plantel, solo_activos=True)
    ids = [i.id_plantel_integrante for i in visibles]
    db.rollback()

    assert id_pi in ids, "Un integrante que jugó desapareció de la nómina al darle de baja"


def test_no_se_puede_pasar_de_club_si_ya_jugo_aunque_este_de_baja(client_superuser, db):
    """Darle de baja no debe habilitar el pase a otro club durante el torneo."""
    from sqlalchemy import text

    fila = db.execute(text("""
        SELECT pi.id_persona, pi.id_plantel_integrante, eq.id_club, pi.rol_en_plantel::text
        FROM participan_partido pp
        JOIN partido p ON p.id_partido = pp.id_partido
        JOIN torneo t ON t.id_torneo = p.id_torneo AND t.activo AND t.borrado_en IS NULL
        JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
        JOIN plantel pl ON pl.id_plantel = pi.id_plantel AND pl.activo
        JOIN equipo eq ON eq.id_equipo = pl.id_equipo
        WHERE pi.fecha_baja IS NULL
        LIMIT 1
    """)).first()
    if fila is None:
        pytest.skip("No hay jugadores con partidos en torneos activos")
    id_persona, id_pi, id_club, rol = fila

    otro_club = db.execute(
        text("SELECT id_club FROM club WHERE id_club != :c LIMIT 1"), {"c": id_club}
    ).scalar()

    def conflicto():
        return db.execute(
            text("SELECT validar_rol_unico_por_club(:p, :r, :c)"),
            {"p": id_persona, "r": rol, "c": otro_club},
        ).scalar()

    assert conflicto() is not None, "Debería bloquear el pase estando activo"

    db.execute(
        text("UPDATE plantel_integrante SET fecha_baja = CURRENT_DATE WHERE id_plantel_integrante = :i"),
        {"i": id_pi},
    )
    db.flush()
    bloqueado_tras_baja = conflicto()
    db.rollback()

    assert bloqueado_tras_baja is not None, (
        "Dar de baja permitió el pase a otro club en pleno torneo"
    )


def test_se_puede_borrar_un_plantel_con_jugadores_que_nunca_jugo(client_superuser):
    """Un plantel cargado por error no es historia de nada: se borra completo."""
    datos = flujo_completo(client_superuser)
    id_plantel = datos["id_plantel"]

    # flujo_completo deja todo listo pero no da el alta: la hacemos acá para
    # que el plantel tenga jugadores y aun así sea borrable (nunca jugó).
    alta = client_superuser.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel,
        "id_persona": datos["id_persona"],
        "id_fichaje_rol": datos["id_fichaje_rol"],
        "rol_en_plantel": "JUGADOR",
    })
    assert alta.status_code == 201, alta.text

    impacto = client_superuser.get(f"/api/planteles/{id_plantel}/impacto-eliminacion")
    assert impacto.status_code == 200, impacto.text
    cuerpo = impacto.json()
    assert cuerpo["integrantes"] > 0, "El test necesita un plantel con integrantes"
    assert cuerpo["participaciones"] == 0
    assert cuerpo["puede_eliminar"] is True

    resp = client_superuser.delete(f"/api/planteles/{id_plantel}")
    assert resp.status_code == 200, resp.text

    # Y deja de existir
    assert client_superuser.get(f"/api/planteles/{id_plantel}/integrantes").json() == []


def test_no_se_puede_borrar_un_plantel_que_ya_jugo(client_superuser, db):
    """Borrarlo arrastraría goles y tarjetas por el CASCADE de participan_partido."""
    from sqlalchemy import text

    id_plantel = db.execute(text("""
        SELECT pi.id_plantel
        FROM participan_partido pp
        JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
        LIMIT 1
    """)).scalar()
    if id_plantel is None:
        pytest.skip("No hay planteles con partidos jugados")

    impacto = client_superuser.get(f"/api/planteles/{id_plantel}/impacto-eliminacion").json()
    assert impacto["participaciones"] > 0
    assert impacto["puede_eliminar"] is False

    resp = client_superuser.delete(f"/api/planteles/{id_plantel}")
    assert resp.status_code in (400, 409), resp.text
