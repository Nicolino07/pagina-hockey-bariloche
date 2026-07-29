"""Paridad entre el resolver de plantel en Python y su espejo en SQL.

`resolver_plantel` (app/services/plantel_resolver.py) y
`fn_plantel_de_equipo_en_torneo` (migración 0033) implementan la misma regla en
dos lenguajes. Si se desincronizan, las vistas y el backend empiezan a resolver
planteles distintos para el mismo partido, que es un bug silencioso y difícil de
rastrear. Este test recorre todos los pares (equipo, torneo) realmente
inscriptos y exige que ambas devuelvan el mismo id.
"""
from sqlalchemy import text

from app.services.plantel_resolver import resolver_id_plantel, torneo_de_plantel


def _pares_inscriptos(db):
    filas = db.execute(
        text("SELECT id_equipo, id_torneo FROM inscripcion_torneo ORDER BY id_equipo, id_torneo")
    ).all()
    return [(f[0], f[1]) for f in filas]


def test_resolver_python_y_sql_coinciden(db):
    pares = _pares_inscriptos(db)
    assert pares, "No hay inscripciones cargadas: el test no estaría verificando nada"

    discrepancias = []
    for id_equipo, id_torneo in pares:
        esperado = db.execute(
            text("SELECT fn_plantel_de_equipo_en_torneo(:e, :t)"),
            {"e": id_equipo, "t": id_torneo},
        ).scalar()
        obtenido = resolver_id_plantel(db, id_equipo, id_torneo)
        if esperado != obtenido:
            discrepancias.append((id_equipo, id_torneo, esperado, obtenido))

    assert not discrepancias, (
        "El resolver de Python y el de SQL difieren en (equipo, torneo, sql, python): "
        f"{discrepancias}"
    )


def test_resolver_sin_fallback_no_devuelve_plantel_historico(db):
    """En modo escritura nunca se debe escribir sobre el plantel histórico."""
    pares = _pares_inscriptos(db)

    for id_equipo, id_torneo in pares:
        sin_fallback = resolver_id_plantel(db, id_equipo, id_torneo, permitir_fallback=False)
        if sin_fallback is None:
            continue
        # Si devolvió algo, tiene que ser un plantel del torneo, no el histórico.
        id_torneo_plantel = db.execute(
            text("SELECT id_torneo FROM plantel WHERE id_plantel = :p"),
            {"p": sin_fallback},
        ).scalar()
        assert id_torneo_plantel is not None, (
            f"resolver_plantel(permitir_fallback=False) devolvió el plantel histórico "
            f"{sin_fallback} para equipo={id_equipo} torneo={id_torneo}"
        )


def test_playoff_resuelve_al_torneo_base(db):
    """Un torneo con torneo_base_id debe resolver al plantel del torneo base."""
    fila = db.execute(
        text("SELECT id_torneo, torneo_base_id FROM torneo WHERE torneo_base_id IS NOT NULL LIMIT 1")
    ).first()
    if fila is None:
        import pytest
        pytest.skip("No hay torneos de playoff cargados")

    id_torneo, id_base = fila[0], fila[1]
    assert torneo_de_plantel(db, id_torneo) == id_base
