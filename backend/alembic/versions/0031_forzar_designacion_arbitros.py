"""Permitir forzar la designación de árbitros no designables

El frontend deja de bloquear la selección de árbitros no designables: los
marca en rojo y, si el admin igual los asigna, pide confirmación explícita
("asignar de todas formas"). Para que ese guardado no sea rechazado por el
trigger de validación, se agrega un bypass controlado por la variable de
sesión `app.forzar_designacion_arbitro`, que el backend enciende (SET LOCAL,
alcance de la transacción) solo cuando el request llega con `forzar=true`.
Las reglas de negocio en sí no cambian.

Revision ID: 0031
Revises: 0030
Create Date: 2026-07-27
"""
from alembic import op

revision = '0031'
down_revision = '0030'
branch_labels = None
depends_on = None


_FN_TRIGGER_CON_BYPASS = """
CREATE OR REPLACE FUNCTION fn_validar_designacion_arbitros()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_es_competitiva BOOLEAN;
    v_id_arbitro     INT;
    v_nombre         TEXT;
BEGIN
    -- Bypass explícito: el backend lo enciende (SET LOCAL, por transacción)
    -- solo cuando el admin confirmó designar de todas formas a un árbitro
    -- marcado como no designable.
    IF current_setting('app.forzar_designacion_arbitro', true) = 'true' THEN
        RETURN NEW;
    END IF;

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

_FN_TRIGGER_SIN_BYPASS = """
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

        IF fn_arbitro_en_torneo_del_partido(v_id_arbitro, NEW.id_partido) THEN
            RAISE EXCEPTION
                'La persona % integra un plantel de este torneo y no puede arbitrar en él.',
                v_nombre
            USING ERRCODE = 'check_violation';
        END IF;

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
    op.execute(_FN_TRIGGER_CON_BYPASS)


def downgrade() -> None:
    op.execute(_FN_TRIGGER_SIN_BYPASS)
