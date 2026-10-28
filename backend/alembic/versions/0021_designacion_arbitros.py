"""Designación de árbitros: rol ADMIN_ARBITROS, torneo.es_competitiva y validación en DB

Revision ID: 0021
Revises: 0020
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = '0021'
down_revision = '0020'
branch_labels = None
depends_on = None


# Regla 1 (exceptuable): la persona tiene un rol activo en el club local o visitante.
_FN_CLUB = """
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

# Regla 2 (absoluta): la persona integra un plantel de un equipo inscripto en el torneo.
_FN_TORNEO = """
CREATE OR REPLACE FUNCTION fn_arbitro_en_torneo_del_partido(
    p_id_persona INT,
    p_id_partido INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id_torneo INT;
BEGIN
    SELECT p.id_torneo INTO v_id_torneo
    FROM partido p
    WHERE p.id_partido = p_id_partido;

    RETURN EXISTS (
        SELECT 1
        FROM plantel_integrante pi
        JOIN plantel pl ON pl.id_plantel = pi.id_plantel
        JOIN equipo e   ON e.id_equipo = pl.id_equipo
        JOIN inscripcion_torneo it ON it.id_equipo = e.id_equipo
        WHERE it.id_torneo = v_id_torneo
          AND pi.id_persona = p_id_persona
          AND pi.fecha_baja IS NULL
          AND pl.activo = TRUE
    );
END;
$$;
"""

# Trigger: valida la designación de árbitros al asignarlos sobre un partido.
_FN_TRIGGER = """
CREATE OR REPLACE FUNCTION fn_validar_designacion_arbitros()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_es_competitiva BOOLEAN;
    v_id_arbitro     INT;
    v_nombre         TEXT;
BEGIN
    SELECT t.es_competitiva
    INTO v_es_competitiva
    FROM torneo t
    JOIN partido p ON p.id_torneo = t.id_torneo
    WHERE p.id_partido = NEW.id_partido;

    FOREACH v_id_arbitro IN ARRAY ARRAY[NEW.id_arbitro1, NEW.id_arbitro2]
    LOOP
        CONTINUE WHEN v_id_arbitro IS NULL;

        SELECT nombre || ' ' || apellido
        INTO v_nombre
        FROM persona
        WHERE id_persona = v_id_arbitro;

        -- La persona designada debe tener el rol ARBITRO vigente.
        IF NOT EXISTS (
            SELECT 1 FROM persona_rol pr
            WHERE pr.id_persona = v_id_arbitro
              AND pr.rol = 'ARBITRO'
              AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= NEW.fecha)
        ) THEN
            RAISE EXCEPTION
                'La persona % no tiene el rol ARBITRO vigente y no puede ser designada.',
                v_nombre
            USING ERRCODE = 'check_violation';
        END IF;

        -- Regla 2 (absoluta): no puede integrar un plantel del mismo torneo.
        IF fn_arbitro_en_torneo_del_partido(v_id_arbitro, NEW.id_partido) THEN
            RAISE EXCEPTION
                'La persona % integra un plantel de este torneo y no puede arbitrar en él.',
                v_nombre
            USING ERRCODE = 'check_violation';
        END IF;

        -- Regla 1 (exceptuable): rol activo en el club local o visitante.
        -- Solo aplica en torneos competitivos.
        IF v_es_competitiva
           AND fn_arbitro_en_club_del_partido(v_id_arbitro, NEW.id_partido) THEN
            RAISE EXCEPTION
                'La persona % tiene un rol activo en uno de los clubes del partido y no puede arbitrarlo.',
                v_nombre
            USING ERRCODE = 'check_violation';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;
"""


def upgrade() -> None:
    # 1. Nuevo tipo de usuario (no se usa en esta misma migración).
    op.execute("ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'ADMIN_ARBITROS'")

    # 2. Marca de torneo competitivo (default estricto).
    op.add_column(
        "torneo",
        sa.Column(
            "es_competitiva",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    # 3. Funciones de validación + trigger sobre partido.
    op.execute(_FN_CLUB)
    op.execute(_FN_TORNEO)
    op.execute(_FN_TRIGGER)
    op.execute("DROP TRIGGER IF EXISTS trg_validar_designacion_arbitros ON partido")
    op.execute(
        """
        CREATE TRIGGER trg_validar_designacion_arbitros
        BEFORE INSERT OR UPDATE OF id_arbitro1, id_arbitro2 ON partido
        FOR EACH ROW
        EXECUTE FUNCTION fn_validar_designacion_arbitros()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_validar_designacion_arbitros ON partido")
    op.execute("DROP FUNCTION IF EXISTS fn_validar_designacion_arbitros()")
    op.execute("DROP FUNCTION IF EXISTS fn_arbitro_en_torneo_del_partido(INT, INT)")
    op.execute("DROP FUNCTION IF EXISTS fn_arbitro_en_club_del_partido(INT, INT)")
    op.drop_column("torneo", "es_competitiva")
    # El valor 'ADMIN_ARBITROS' del enum tipo_usuario no se elimina:
    # PostgreSQL no soporta quitar valores de un ENUM de forma simple.
