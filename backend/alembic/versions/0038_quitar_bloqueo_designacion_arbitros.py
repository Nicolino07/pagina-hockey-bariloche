"""Quitar el bloqueo de designación de árbitros (pasa a advertencia)

Las reglas de árbitros (rol ARBITRO vigente, no integrar un plantel del
torneo, no tener rol activo en un club del partido) dejan de ser un bloqueo
de base de datos y pasan a ser una advertencia confirmable manejada en la
aplicación:

  - el frontend marca a los árbitros no habilitados y muestra el motivo;
  - el backend pre-valida en Python y responde 409 CONFIRMACION_REQUERIDA;
  - si el admin confirma, el request se reenvía con `forzar=true` y se guarda.

Con la validación resuelta arriba, el trigger solo agregaba un rechazo duro
que además rompía la carga de planillas (que escribe id_arbitro1/id_arbitro2
sin pasar por el flujo de designación). Se elimina el trigger y su función,
incluido el bypass de sesión `app.forzar_designacion_arbitro` que existía
solo para esquivarlo (migración 0031).

Las funciones auxiliares fn_arbitro_en_torneo_del_partido y
fn_arbitro_en_club_del_partido NO se tocan: las sigue usando el backend para
calcular la disponibilidad que se muestra en pantalla.

Revision ID: 0038
Revises: 0037
Create Date: 2026-08-23
"""
from alembic import op

revision = '0038'
down_revision = '0037'
branch_labels = None
depends_on = None


# Estado previo, para poder restaurarlo en el downgrade.
_FN_TRIGGER_PREVIA = """
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


def upgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_validar_designacion_arbitros ON partido")
    op.execute("DROP FUNCTION IF EXISTS fn_validar_designacion_arbitros()")


def downgrade() -> None:
    op.execute(_FN_TRIGGER_PREVIA)
    op.execute(
        """
        CREATE TRIGGER trg_validar_designacion_arbitros
        BEFORE INSERT OR UPDATE OF id_arbitro1, id_arbitro2 ON partido
        FOR EACH ROW
        EXECUTE FUNCTION fn_validar_designacion_arbitros()
        """
    )
