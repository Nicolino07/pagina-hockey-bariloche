"""Una persona no puede jugar para dos equipos del mismo club en el mismo torneo

`validar_rol_unico_por_club` solo bloqueaba el mismo rol en un club
**distinto** (`eq.id_club != p_id_club_destino`). Un club con dos equipos (p.ej.
Primera y Reserva) inscriptos en el **mismo** torneo podía anotar a la misma
persona en ambos planteles: la validación nunca se disparaba porque el club
era el mismo.

Se agrega una segunda validación, `validar_equipo_unico_en_torneo_mismo_club`,
que bloquea el alta cuando la persona ya está activa con ese rol en **otro
equipo del mismo club**, dentro del **mismo torneo**. Reutiliza la misma
excepción de "ya jugó" que `validar_rol_unico_por_club` (migración 0035): si
ya jugó un partido de ese torneo con el otro equipo, sigue bloqueando aunque
se la haya dado de baja del plantel viejo.

Planteles sin torneo (históricos) no entran en esta regla: sin torneo no hay
"mismo torneo" que comparar.

Revision ID: 0036
Revises: 0035
Create Date: 2026-08-02
"""
from alembic import op

revision = '0036'
down_revision = '0035'
branch_labels = None
depends_on = None


_CREAR_FUNCION_VALIDACION = """
CREATE OR REPLACE FUNCTION validar_equipo_unico_en_torneo_mismo_club(
    p_id_persona INT,
    p_rol tipo_rol_persona,
    p_id_equipo_destino INT,
    p_id_torneo_destino INT,
    p_excluir_id_plantel_integrante INT DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id_club_destino INT;
    v_equipo_conflicto_nombre VARCHAR(100);
    v_categoria_conflicto tipo_categoria;
    v_fecha_alta_conflicto DATE;
    v_mensaje VARCHAR;
BEGIN
    -- Sin torneo (plantel histórico) no hay "mismo torneo" que comparar.
    IF p_id_torneo_destino IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id_club INTO v_id_club_destino FROM equipo WHERE id_equipo = p_id_equipo_destino;

    SELECT
        eq.nombre,
        eq.categoria,
        pi.fecha_alta
    INTO
        v_equipo_conflicto_nombre,
        v_categoria_conflicto,
        v_fecha_alta_conflicto
    FROM plantel_integrante pi
    JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    WHERE pi.id_persona = p_id_persona
    AND pi.rol_en_plantel = p_rol                    -- Mismo rol
    AND eq.id_club = v_id_club_destino                -- Mismo club
    AND eq.id_equipo != p_id_equipo_destino           -- Equipo distinto
    AND pl.id_torneo = p_id_torneo_destino            -- Mismo torneo
    AND pl.borrado_en IS NULL
    AND pl.activo = true
    AND (
        pi.fecha_baja IS NULL
        OR EXISTS (
            -- Si ya jugó un partido de este torneo con el otro equipo, sigue
            -- "tomada" aunque se la haya dado de baja del plantel viejo
            -- (mismo criterio que validar_rol_unico_por_club, migración 0035).
            SELECT 1
            FROM participan_partido pp
            JOIN partido p2 ON p2.id_partido = pp.id_partido
            WHERE pp.id_plantel_integrante = pi.id_plantel_integrante
              AND p2.id_torneo = p_id_torneo_destino
        )
    )
    AND pi.id_plantel_integrante != COALESCE(p_excluir_id_plantel_integrante, -1)
    LIMIT 1;

    IF v_equipo_conflicto_nombre IS NOT NULL THEN
        v_mensaje := format(
            'La persona ya tiene el rol "%s" activo en otro equipo del mismo club '
            'para este mismo torneo. '
            'Detalles del conflicto: '
            'Equipo: %s (%s), '
            'Fecha de alta: %s. '
            'Regla: no puede jugar para dos equipos del mismo club en el mismo torneo.',
            p_rol,
            v_equipo_conflicto_nombre,
            v_categoria_conflicto,
            v_fecha_alta_conflicto
        );
        RETURN v_mensaje;
    END IF;

    RETURN NULL;
END;
$$;
"""

_TRIGGER_FN_NUEVA = """
CREATE OR REPLACE FUNCTION fn_plantel_integrante_validar_rol_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_club_destino INT;
    v_id_equipo_destino INT;
    v_id_torneo_destino INT;
    v_mensaje_error VARCHAR;
BEGIN
    -- 1. Validar que el rol existe en persona_rol (validación original)
    IF NOT EXISTS (
        SELECT 1
        FROM persona_rol pr
        WHERE pr.id_persona = NEW.id_persona
          AND pr.rol = NEW.rol_en_plantel
          AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= NEW.fecha_alta)
    ) THEN
        RAISE EXCEPTION
            'La persona % no está habilitada para el rol %',
            NEW.id_persona, NEW.rol_en_plantel;
    END IF;

    SELECT e.id_club, e.id_equipo, p.id_torneo
    INTO v_id_club_destino, v_id_equipo_destino, v_id_torneo_destino
    FROM plantel p
    JOIN equipo e ON p.id_equipo = e.id_equipo
    WHERE p.id_plantel = NEW.id_plantel;

    -- 2. Validar regla de rol único por club (distinto club)
    v_mensaje_error := validar_rol_unico_por_club(
        NEW.id_persona,
        NEW.rol_en_plantel,
        v_id_club_destino,
        CASE
            WHEN TG_OP = 'UPDATE' THEN OLD.id_plantel_integrante
            ELSE NULL
        END
    );

    IF v_mensaje_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_mensaje_error
        USING HINT = 'Para tener este rol en este club, primero debe dar de baja el mismo rol en otro club.';
    END IF;

    -- 3. Validar que no juegue para dos equipos del mismo club en el mismo torneo
    v_mensaje_error := validar_equipo_unico_en_torneo_mismo_club(
        NEW.id_persona,
        NEW.rol_en_plantel,
        v_id_equipo_destino,
        v_id_torneo_destino,
        CASE
            WHEN TG_OP = 'UPDATE' THEN OLD.id_plantel_integrante
            ELSE NULL
        END
    );

    IF v_mensaje_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_mensaje_error
        USING HINT = 'Para tener este rol en este equipo, primero debe dar de baja el mismo rol en el otro equipo del club.';
    END IF;

    RETURN NEW;
END;
$$;
"""

_TRIGGER_FN_VIEJA = """
CREATE OR REPLACE FUNCTION fn_plantel_integrante_validar_rol_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_club_destino INT;
    v_mensaje_error VARCHAR;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM persona_rol pr
        WHERE pr.id_persona = NEW.id_persona
          AND pr.rol = NEW.rol_en_plantel
          AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= NEW.fecha_alta)
    ) THEN
        RAISE EXCEPTION
            'La persona % no está habilitada para el rol %',
            NEW.id_persona, NEW.rol_en_plantel;
    END IF;

    SELECT e.id_club INTO v_id_club_destino
    FROM plantel p
    JOIN equipo e ON p.id_equipo = e.id_equipo
    WHERE p.id_plantel = NEW.id_plantel;

    v_mensaje_error := validar_rol_unico_por_club(
        NEW.id_persona,
        NEW.rol_en_plantel,
        v_id_club_destino,
        CASE
            WHEN TG_OP = 'UPDATE' THEN OLD.id_plantel_integrante
            ELSE NULL
        END
    );

    IF v_mensaje_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_mensaje_error
        USING HINT = 'Para tener este rol en este club, primero debe dar de baja el mismo rol en otro club.';
    END IF;

    RETURN NEW;
END;
$$;
"""


def upgrade() -> None:
    op.execute(_CREAR_FUNCION_VALIDACION)
    op.execute(_TRIGGER_FN_NUEVA)


def downgrade() -> None:
    op.execute(_TRIGGER_FN_VIEJA)
    op.execute("DROP FUNCTION IF EXISTS validar_equipo_unico_en_torneo_mismo_club(INT, tipo_rol_persona, INT, INT, INT);")
