"""Unificación (fase 3a): la regla de club propio usa id_equipo directo

Al materializar los fixtures programados, esos partidos tienen equipos pero no
inscripción. La regla 1 (club propio) pasaba por inscripción y no encontraba el
club en esos partidos. Se reescribe para leer los clubes desde id_equipo directo,
así la designación de árbitros funciona sobre los partidos programados del fixture.

Revision ID: 0024
Revises: 0023
Create Date: 2026-07-24
"""
from alembic import op

revision = '0024'
down_revision = '0023'
branch_labels = None
depends_on = None


_FN_CLUB_EQUIPO = """
CREATE OR REPLACE FUNCTION fn_arbitro_en_club_del_partido(
    p_id_persona INT,
    p_id_partido INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_club_local     INT;
    v_club_visitante INT;
BEGIN
    SELECT el.id_club, ev.id_club
    INTO v_club_local, v_club_visitante
    FROM partido p
    LEFT JOIN equipo el ON el.id_equipo = p.id_equipo_local
    LEFT JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
    WHERE p.id_partido = p_id_partido;

    RETURN EXISTS (
        SELECT 1
        FROM fichaje_rol fr
        WHERE fr.id_persona = p_id_persona
          AND fr.id_club IN (v_club_local, v_club_visitante)
          AND fr.activo = TRUE
          AND fr.fecha_fin IS NULL
    );
END;
$$;
"""

_FN_CLUB_INSCRIPCION = """
CREATE OR REPLACE FUNCTION fn_arbitro_en_club_del_partido(
    p_id_persona INT,
    p_id_partido INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_club_local     INT;
    v_club_visitante INT;
BEGIN
    SELECT el.id_club, ev.id_club
    INTO v_club_local, v_club_visitante
    FROM partido p
    JOIN inscripcion_torneo il ON il.id_inscripcion = p.id_inscripcion_local
    JOIN equipo el ON el.id_equipo = il.id_equipo
    JOIN inscripcion_torneo iv ON iv.id_inscripcion = p.id_inscripcion_visitante
    JOIN equipo ev ON ev.id_equipo = iv.id_equipo
    WHERE p.id_partido = p_id_partido;

    RETURN EXISTS (
        SELECT 1
        FROM fichaje_rol fr
        WHERE fr.id_persona = p_id_persona
          AND fr.id_club IN (v_club_local, v_club_visitante)
          AND fr.activo = TRUE
          AND fr.fecha_fin IS NULL
    );
END;
$$;
"""


def upgrade() -> None:
    op.execute(_FN_CLUB_EQUIPO)


def downgrade() -> None:
    op.execute(_FN_CLUB_INSCRIPCION)
