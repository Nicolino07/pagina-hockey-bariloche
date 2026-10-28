"""
Tests de integración para /api/partidos.

Flujo completo por test:
  club → equipo (x2) → torneo → inscripción (x2) → plantel (x2)
  → integrante (x2) → planilla del partido.

Así cada test es autónomo.
"""
from uuid import uuid4


# ─── Helpers básicos ──────────────────────────────────────────────────────────

def uid() -> str:
    return uuid4().hex[:8]


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


def crear_torneo(client, genero: str = "MASCULINO") -> int:
    resp = client.post("/api/torneos/", json={
        "nombre": f"Torneo {uid()}",
        "categoria": "MAYORES",
        "genero": genero,
        "fecha_inicio": "2024-03-01",
        "activo": True,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_torneo"]


def inscribir_equipo(client, id_torneo: int, id_equipo: int) -> int:
    resp = client.post(
        f"/api/torneos/{id_torneo}/inscripciones/",
        json={"id_equipo": id_equipo},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id_inscripcion"]


def crear_persona(client, genero: str = "MASCULINO") -> int:
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
        "nombre": f"Plantel {uid()}",
        "temporada": "2024",
        "activo": True,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_plantel"]


def agregar_integrante(client, id_plantel: int, id_persona: int, id_fichaje_rol: int, numero: int = 10) -> int:
    resp = client.post("/api/planteles/integrantes", json={
        "id_plantel": id_plantel,
        "id_persona": id_persona,
        "id_fichaje_rol": id_fichaje_rol,
        "rol_en_plantel": "JUGADOR",
        "numero_camiseta": numero,
    })
    assert resp.status_code == 201, resp.text
    return resp.json()["id_plantel_integrante"]


def flujo_partido(client, genero: str = "MASCULINO") -> dict:
    """
    Construye el árbol completo para poder crear una planilla de partido.
    Devuelve todos los IDs relevantes.
    """
    # Dos clubes con sus equipos
    id_club_local = crear_club(client)
    id_club_visitante = crear_club(client)
    id_equipo_local = crear_equipo(client, id_club_local, genero)
    id_equipo_visitante = crear_equipo(client, id_club_visitante, genero)

    # Torneo e inscripciones
    id_torneo = crear_torneo(client, genero)
    id_inscripcion_local = inscribir_equipo(client, id_torneo, id_equipo_local)
    id_inscripcion_visitante = inscribir_equipo(client, id_torneo, id_equipo_visitante)

    # Planteles
    id_plantel_local = crear_plantel(client, id_equipo_local)
    id_plantel_visitante = crear_plantel(client, id_equipo_visitante)

    # Un jugador por equipo
    id_persona_local = crear_persona(client, genero)
    id_fichaje_local = crear_fichaje(client, id_persona_local, id_club_local)
    id_integrante_local = agregar_integrante(client, id_plantel_local, id_persona_local, id_fichaje_local, numero=1)

    id_persona_visitante = crear_persona(client, genero)
    id_fichaje_visitante = crear_fichaje(client, id_persona_visitante, id_club_visitante)
    id_integrante_visitante = agregar_integrante(client, id_plantel_visitante, id_persona_visitante, id_fichaje_visitante, numero=1)

    return {
        "id_torneo": id_torneo,
        "id_inscripcion_local": id_inscripcion_local,
        "id_inscripcion_visitante": id_inscripcion_visitante,
        "id_equipo_local": id_equipo_local,
        "id_integrante_local": id_integrante_local,
        "id_integrante_visitante": id_integrante_visitante,
        "id_persona_local": id_persona_local,
        "id_persona_visitante": id_persona_visitante,
    }


def planilla_minima(ids: dict) -> dict:
    """Payload mínimo para crear una planilla de partido."""
    return {
        "partido": {
            "id_torneo": ids["id_torneo"],
            "id_inscripcion_local": ids["id_inscripcion_local"],
            "id_inscripcion_visitante": ids["id_inscripcion_visitante"],
            "fecha": "2024-05-15",
        },
        "participantes": {
            "local": [{"id_plantel_integrante": ids["id_integrante_local"]}],
            "visitante": [{"id_plantel_integrante": ids["id_integrante_visitante"]}],
        },
        "goles": [],
        "tarjetas": [],
    }


# ─── Tests: Crear planilla ────────────────────────────────────────────────────

def _get_id_partido(client, ids: dict) -> int:
    """Crea una planilla y devuelve el id_partido buscándolo por torneo."""
    resp = client.post("/api/partidos/planilla", json=planilla_minima(ids))
    assert resp.status_code == 201, resp.text
    # PartidoBase no incluye id_partido; lo obtenemos de recientes
    partidos = client.get(f"/api/partidos/recientes?torneo_id={ids['id_torneo']}").json()
    assert len(partidos) >= 1
    return partidos[0]["id_partido"]


def test_crear_planilla_partido_exitoso(client_superuser):
    ids = flujo_partido(client_superuser)
    response = client_superuser.post("/api/partidos/planilla", json=planilla_minima(ids))
    assert response.status_code == 201
    data = response.json()
    assert data["id_torneo"] == ids["id_torneo"]
    assert data["id_inscripcion_local"] == ids["id_inscripcion_local"]


def test_crear_planilla_con_gol(client_superuser):
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["goles"] = [{
        "id_plantel_integrante": ids["id_integrante_local"],
        "minuto": 15,
        "referencia_gol": "GJ",
        "cuarto": 1,
        "es_autogol": False,
    }]
    response = client_superuser.post("/api/partidos/planilla", json=payload)
    assert response.status_code == 201


def test_crear_planilla_con_tarjeta(client_superuser):
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["tarjetas"] = [{
        "id_plantel_integrante": ids["id_integrante_visitante"],
        "tipo": "AMARILLA",
        "minuto": 30,
    }]
    response = client_superuser.post("/api/partidos/planilla", json=payload)
    assert response.status_code == 201


def test_crear_planilla_inscripcion_inexistente(client_superuser):
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["partido"]["id_inscripcion_local"] = 99999
    response = client_superuser.post("/api/partidos/planilla", json=payload)
    assert response.status_code in (400, 404, 422)


# ─── Tests: Listar partidos recientes ────────────────────────────────────────

def test_listar_partidos_recientes(client_publico, client_superuser):
    ids = flujo_partido(client_superuser)
    client_superuser.post("/api/partidos/planilla", json=planilla_minima(ids))

    response = client_publico.get("/api/partidos/recientes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_listar_partidos_recientes_filtrar_por_torneo(client_publico, client_superuser):
    ids = flujo_partido(client_superuser)
    client_superuser.post("/api/partidos/planilla", json=planilla_minima(ids))

    response = client_publico.get(f"/api/partidos/recientes?torneo_id={ids['id_torneo']}")
    assert response.status_code == 200
    partidos = response.json()
    assert isinstance(partidos, list)
    for p in partidos:
        assert p["id_torneo"] == ids["id_torneo"]


# ─── Tests: Detalle de partido ────────────────────────────────────────────────

def test_obtener_detalle_partido(client_publico, client_superuser):
    ids = flujo_partido(client_superuser)
    id_partido = _get_id_partido(client_superuser, ids)

    response = client_publico.get(f"/api/partidos/{id_partido}")
    assert response.status_code == 200
    assert response.json()["id_partido"] == id_partido


def test_obtener_detalle_partido_inexistente(client_publico):
    response = client_publico.get("/api/partidos/99999")
    assert response.status_code == 404


# ─── Tests: Historial por equipo ─────────────────────────────────────────────

def test_historial_equipo(client_publico, client_superuser):
    ids = flujo_partido(client_superuser)
    client_superuser.post("/api/partidos/planilla", json=planilla_minima(ids))

    response = client_publico.get(f"/api/partidos/equipos/{ids['id_equipo_local']}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_historial_equipo_sin_partidos(client_publico):
    response = client_publico.get("/api/partidos/equipos/99999")
    assert response.status_code == 200
    assert response.json() == []


# ─── Tests: Eliminar partido ─────────────────────────────────────────────────

def test_eliminar_partido_terminado_falla(client_superuser):
    """
    El servicio crear_planilla siempre finaliza el partido como TERMINADO.
    El endpoint DELETE solo permite borrar partidos en estado BORRADOR,
    por lo que eliminar un partido recién cargado debe fallar con 400.
    """
    ids = flujo_partido(client_superuser)
    id_partido = _get_id_partido(client_superuser, ids)

    response = client_superuser.delete(f"/api/partidos/{id_partido}")
    assert response.status_code == 400


def test_eliminar_partido_inexistente(client_superuser):
    response = client_superuser.delete("/api/partidos/99999")
    assert response.status_code == 404


# ─── Test: Flujo completo con goles y tarjetas ───────────────────────────────

def test_partido_completo_con_goles_y_tarjetas(client_superuser):
    """
    Flujo completo real:
      - 2 clubes, 2 equipos, 1 torneo, 2 inscripciones, 2 planteles
      - 2 jugadores por equipo (4 en total), cada uno fichado en su club
      - Planilla con 3 goles (2 local, 1 visitante) y 2 tarjetas (1 por equipo)
    Verifica que el partido queda TERMINADO y el marcador es correcto.
    """
    # ── Infraestructura ──────────────────────────────────────────────
    id_club_local = crear_club(client_superuser)
    id_club_visitante = crear_club(client_superuser)
    id_equipo_local = crear_equipo(client_superuser, id_club_local)
    id_equipo_visitante = crear_equipo(client_superuser, id_club_visitante)

    id_torneo = crear_torneo(client_superuser)
    id_insc_local = inscribir_equipo(client_superuser, id_torneo, id_equipo_local)
    id_insc_visitante = inscribir_equipo(client_superuser, id_torneo, id_equipo_visitante)

    id_plantel_local = crear_plantel(client_superuser, id_equipo_local)
    id_plantel_visitante = crear_plantel(client_superuser, id_equipo_visitante)

    # ── Jugadores locales ────────────────────────────────────────────
    id_persona_l1 = crear_persona(client_superuser)
    id_fichaje_l1 = crear_fichaje(client_superuser, id_persona_l1, id_club_local)
    id_int_l1 = agregar_integrante(client_superuser, id_plantel_local, id_persona_l1, id_fichaje_l1, numero=9)

    id_persona_l2 = crear_persona(client_superuser)
    id_fichaje_l2 = crear_fichaje(client_superuser, id_persona_l2, id_club_local)
    id_int_l2 = agregar_integrante(client_superuser, id_plantel_local, id_persona_l2, id_fichaje_l2, numero=7)

    # ── Jugadores visitantes ─────────────────────────────────────────
    id_persona_v1 = crear_persona(client_superuser)
    id_fichaje_v1 = crear_fichaje(client_superuser, id_persona_v1, id_club_visitante)
    id_int_v1 = agregar_integrante(client_superuser, id_plantel_visitante, id_persona_v1, id_fichaje_v1, numero=10)

    id_persona_v2 = crear_persona(client_superuser)
    id_fichaje_v2 = crear_fichaje(client_superuser, id_persona_v2, id_club_visitante)
    id_int_v2 = agregar_integrante(client_superuser, id_plantel_visitante, id_persona_v2, id_fichaje_v2, numero=5)

    # ── Planilla ─────────────────────────────────────────────────────
    payload = {
        "partido": {
            "id_torneo": id_torneo,
            "id_inscripcion_local": id_insc_local,
            "id_inscripcion_visitante": id_insc_visitante,
            "fecha": "2024-06-10",
            "ubicacion": "Cancha Central",
            "numero_fecha": 1,
        },
        "participantes": {
            "local": [
                {"id_plantel_integrante": id_int_l1, "numero_camiseta": "9"},
                {"id_plantel_integrante": id_int_l2, "numero_camiseta": "7"},
            ],
            "visitante": [
                {"id_plantel_integrante": id_int_v1, "numero_camiseta": "10"},
                {"id_plantel_integrante": id_int_v2, "numero_camiseta": "5"},
            ],
        },
        "goles": [
            {"id_plantel_integrante": id_int_l1, "minuto": 10, "cuarto": 1, "referencia_gol": "GJ", "es_autogol": False},
            {"id_plantel_integrante": id_int_l2, "minuto": 25, "cuarto": 2, "referencia_gol": "GC", "es_autogol": False},
            {"id_plantel_integrante": id_int_v1, "minuto": 33, "cuarto": 3, "referencia_gol": "GP", "es_autogol": False},
        ],
        "tarjetas": [
            {"id_plantel_integrante": id_int_l2, "tipo": "AMARILLA", "minuto": 18, "cuarto": 1},
            {"id_plantel_integrante": id_int_v2, "tipo": "VERDE",    "minuto": 40, "cuarto": 4},
        ],
    }

    response = client_superuser.post("/api/partidos/planilla", json=payload)
    assert response.status_code == 201, response.text

    # ── Verificar detalle ────────────────────────────────────────────
    partidos = client_superuser.get(f"/api/partidos/recientes?torneo_id={id_torneo}").json()
    assert len(partidos) == 1
    detalle = partidos[0]

    assert detalle["goles_local"] == 2
    assert detalle["goles_visitante"] == 1
    assert detalle["lista_goles_local"] is not None
    assert detalle["lista_goles_visitante"] is not None
    assert detalle["lista_tarjetas_local"] is not None


# ─── Tests: suspensión automática por acumulación de amarillas ───────────────

def _tarjeta(id_integrante: int, tipo: str, minuto: int) -> dict:
    return {"id_plantel_integrante": id_integrante, "tipo": tipo, "minuto": minuto}


def _suspensiones(client, id_persona: int, id_torneo: int) -> list[dict]:
    resp = client.get(f"/api/suspensiones/?id_persona={id_persona}&id_torneo={id_torneo}")
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_tres_amarillas_generan_suspension_automatica(client_superuser):
    """3 amarillas en el torneo = 1 fecha de suspensión, aunque caigan todas en
    el mismo partido. La sesión es autoflush=False, así que si el recálculo
    corre antes del flush las tarjetas recién cargadas no se cuentan."""
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["tarjetas"] = [
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 10),
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 20),
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 30),
    ]
    resp = client_superuser.post("/api/partidos/planilla", json=payload)
    assert resp.status_code == 201, resp.text

    suspensiones = _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
    automaticas = [s for s in suspensiones if s["origen"] == "AUTOMATICA_AMARILLAS"]
    assert len(automaticas) == 1, f"Esperaba 1 suspensión automática, hay {suspensiones}"
    assert automaticas[0]["fechas_suspension"] == 1


def test_dos_amarillas_no_generan_suspension(client_superuser):
    """El umbral es 3: con 2 no se sanciona."""
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["tarjetas"] = [
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 10),
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 20),
    ]
    resp = client_superuser.post("/api/partidos/planilla", json=payload)
    assert resp.status_code == 201, resp.text

    suspensiones = _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
    assert [s for s in suspensiones if s["origen"] == "AUTOMATICA_AMARILLAS"] == []


def test_roja_genera_suspension_automatica(client_superuser):
    """Cada roja son 1 fecha, sin acumular."""
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["tarjetas"] = [_tarjeta(ids["id_integrante_visitante"], "ROJA", 40)]
    resp = client_superuser.post("/api/partidos/planilla", json=payload)
    assert resp.status_code == 201, resp.text

    suspensiones = _suspensiones(client_superuser, ids["id_persona_visitante"], ids["id_torneo"])
    automaticas = [s for s in suspensiones if s["origen"] == "AUTOMATICA_ROJA"]
    assert len(automaticas) == 1, f"Esperaba 1 suspensión por roja, hay {suspensiones}"


def test_la_suspension_no_se_cumple_en_el_partido_que_la_origino(client_superuser):
    """El partido de la tarjeta ya está TERMINADO cuando se arma la cola: no
    puede ser el 'próximo partido a cumplir', o la sanción se pagaría sola."""
    ids = flujo_partido(client_superuser)
    payload = planilla_minima(ids)
    payload["tarjetas"] = [_tarjeta(ids["id_integrante_local"], "ROJA", 5)]
    resp = client_superuser.post("/api/partidos/planilla", json=payload)
    assert resp.status_code == 201, resp.text

    suspensiones = _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
    automaticas = [s for s in suspensiones if s["origen"] == "AUTOMATICA_ROJA"]
    assert len(automaticas) == 1
    s = automaticas[0]
    assert s["estado_suspension"] == "ACTIVA", "Se dio por cumplida en el mismo partido"
    assert s["cumplidas"] == 0


def test_la_suspension_toma_un_partido_del_fixture_sin_fecha(client_superuser, db):
    """Si el fixture del torneo está sin programar (partidos en BORRADOR), la
    suspensión igual tiene que engancharse a uno: si no, queda ACTIVA para
    siempre, nunca pasa a CUMPLIDA y el asterisco público no aparece nunca."""
    from sqlalchemy import text

    ids = flujo_partido(client_superuser)

    # Un partido futuro del equipo local, todavía sin fecha (BORRADOR).
    id_borrador = db.execute(text("""
        INSERT INTO partido (id_torneo, id_equipo_local, id_equipo_visitante, estado_partido)
        SELECT :t, i1.id_equipo, i2.id_equipo, 'BORRADOR'
        FROM inscripcion_torneo i1, inscripcion_torneo i2
        WHERE i1.id_inscripcion = :il AND i2.id_inscripcion = :iv
        RETURNING id_partido
    """), {"t": ids["id_torneo"], "il": ids["id_inscripcion_local"],
           "iv": ids["id_inscripcion_visitante"]}).scalar()
    db.commit()

    payload = planilla_minima(ids)
    payload["tarjetas"] = [_tarjeta(ids["id_integrante_local"], "ROJA", 5)]
    resp = client_superuser.post("/api/partidos/planilla", json=payload)
    assert resp.status_code == 201, resp.text

    suspensiones = _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
    automaticas = [s for s in suspensiones if s["origen"] == "AUTOMATICA_ROJA"]
    assert len(automaticas) == 1
    assert automaticas[0]["id_partido_a_cumplir"] == id_borrador, (
        "La suspensión no se enganchó al partido pendiente del fixture"
    )


def test_ciclo_completo_suspension_y_asterisco_publico(client_superuser, client_publico, db):
    """Recorre el ciclo entero: 3 amarillas → suspensión ACTIVA con partido a
    cumplir → se juega ese partido → CUMPLIDA → el asterisco aparece en la
    tabla pública de tarjetas acumuladas."""
    from sqlalchemy import text

    ids = flujo_partido(client_superuser)

    # Segundo partido del torneo, ya programado: es el que se va a cumplir.
    id_segundo = db.execute(text("""
        INSERT INTO partido (id_torneo, id_equipo_local, id_equipo_visitante,
                             id_inscripcion_local, id_inscripcion_visitante,
                             fecha, estado_partido)
        SELECT :t, i1.id_equipo, i2.id_equipo, i1.id_inscripcion, i2.id_inscripcion,
               DATE '2024-06-01', 'PENDIENTE'
        FROM inscripcion_torneo i1, inscripcion_torneo i2
        WHERE i1.id_inscripcion = :il AND i2.id_inscripcion = :iv
        RETURNING id_partido
    """), {"t": ids["id_torneo"], "il": ids["id_inscripcion_local"],
           "iv": ids["id_inscripcion_visitante"]}).scalar()
    db.commit()

    # Partido 1: las 3 amarillas.
    payload = planilla_minima(ids)
    payload["tarjetas"] = [
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 10),
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 20),
        _tarjeta(ids["id_integrante_local"], "AMARILLA", 30),
    ]
    assert client_superuser.post("/api/partidos/planilla", json=payload).status_code == 201

    suspension = [s for s in _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
                  if s["origen"] == "AUTOMATICA_AMARILLAS"]
    assert len(suspension) == 1
    assert suspension[0]["id_partido_a_cumplir"] == id_segundo
    assert suspension[0]["estado_suspension"] == "ACTIVA"

    # Todavía no cumplió: sin asterisco.
    def acumuladas() -> dict:
        resp = client_publico.get(f"/api/vistas/tarjetas-acumuladas?id_torneo={ids['id_torneo']}")
        assert resp.status_code == 200, resp.text
        fila = [f for f in resp.json() if f["id_persona"] == ids["id_persona_local"]]
        assert len(fila) == 1, f"No encontré al jugador en la vista: {resp.json()}"
        return fila[0]

    assert acumuladas()["suspensiones_cumplidas_amarillas"] == 0

    # Se juega el partido que tenía que cumplir: el suspendido no está en la lista.
    db.execute(text("UPDATE partido SET estado_partido='TERMINADO' WHERE id_partido=:p"),
               {"p": id_segundo})
    db.commit()
    from app.database import SessionLocal
    from app.services.suspensiones_services import procesar_cumplimiento_suspensiones_partido
    from app.models.partido import Partido

    sesion = SessionLocal()
    try:
        procesar_cumplimiento_suspensiones_partido(
            sesion, sesion.get(Partido, id_segundo), None
        )
        sesion.commit()
    finally:
        sesion.close()

    cumplida = [s for s in _suspensiones(client_superuser, ids["id_persona_local"], ids["id_torneo"])
                if s["origen"] == "AUTOMATICA_AMARILLAS"][0]
    assert cumplida["estado_suspension"] == "CUMPLIDA", cumplida
    assert acumuladas()["suspensiones_cumplidas_amarillas"] == 1, "Falta el asterisco público"
