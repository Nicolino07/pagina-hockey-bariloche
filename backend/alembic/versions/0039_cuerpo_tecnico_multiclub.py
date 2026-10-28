"""El cuerpo técnico puede repetirse en varios equipos y clubes

Nueva regla de negocio: los roles de cuerpo técnico

    DT, ARBITRO, ASISTENTE, MEDICO, PREPARADOR_FISICO

dejan de ser exclusivos de un club/equipo. La misma persona puede estar
fichada como DT (o árbitro, asistente, médico, PF) en varios clubes a la vez
y figurar en el plantel de varios equipos del mismo torneo, incluso de
clubes distintos.

Las reglas de exclusividad siguen vigentes para JUGADOR y DELEGADO.

Se toca todo lo que bloqueaba esto:

  1. `es_rol_cuerpo_tecnico(rol)`: función nueva, única fuente de verdad de
     qué roles están exentos.
  2. `validar_rol_unico_por_club` (mismo rol en otro club): sale temprano
     para cuerpo técnico. Se reescribe completa manteniendo el filtro de la
     migración 0035 (quien ya jugó sigue tomada aunque esté de baja).
  3. `validar_equipo_unico_en_torneo_mismo_club` (dos equipos del mismo club
     en el mismo torneo, migración 0036): idem.
  4. `validar_antes_de_agregar_a_plantel`: el chequeo de fichaje activo en
     otro club deja de aplicar al cuerpo técnico. El chequeo de fichaje en
     ESTE club se mantiene: para entrar a un plantel hay que estar fichado.
  5. Índice único parcial `unq_persona_rol_activo_uniclub`
     (fichaje_rol: id_persona + rol activo en un solo club): pasa a excluir
     los roles de cuerpo técnico. `unq_persona_club_rol_activo` no se toca:
     sigue sin poder repetirse el mismo rol dos veces en el mismo club.

Revision ID: 0039
Revises: 0038
Create Date: 2026-08-23
"""
from alembic import op

revision = '0039'
down_revision = '0038'
branch_labels = None
depends_on = None


ROLES_CUERPO_TECNICO = "'DT', 'ARBITRO', 'ASISTENTE', 'MEDICO', 'PREPARADOR_FISICO'"


_FN_ES_CUERPO_TECNICO = """
CREATE OR REPLACE FUNCTION es_rol_cuerpo_tecnico(p_rol tipo_rol_persona)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_rol IN (
        'DT',
        'ARBITRO',
        'ASISTENTE',
        'MEDICO',
        'PREPARADOR_FISICO'
    );
$$;
"""


# --------------------------------------------------------------------------
# validar_antes_de_agregar_a_plantel
# --------------------------------------------------------------------------
_FN_ANTES_DE_AGREGAR_NUEVA = """
CREATE OR REPLACE FUNCTION validar_antes_de_agregar_a_plantel()
RETURNS TRIGGER AS $$
DECLARE
    v_id_club INT;
    v_tiene_fichaje_activo BOOLEAN;
    v_tiene_rol_en_otro_club BOOLEAN;
BEGIN
    -- Obtener club del plantel
    SELECT c.id_club INTO v_id_club
    FROM plantel pl
    JOIN equipo e ON pl.id_equipo = e.id_equipo
    JOIN club c ON e.id_club = c.id_club
    WHERE pl.id_plantel = NEW.id_plantel;

    -- Verificar que tenga fichaje activo en este club con este rol
    SELECT EXISTS (
        SELECT 1 FROM fichaje_rol
        WHERE id_persona = NEW.id_persona
          AND id_club = v_id_club
          AND rol = NEW.rol_en_plantel
          AND activo = TRUE
          AND fecha_fin IS NULL
    ) INTO v_tiene_fichaje_activo;

    IF NOT v_tiene_fichaje_activo THEN
        RAISE EXCEPTION
            'La persona % no está fichada como % en este club. '
            'Primero debe ficharla.',
            (SELECT nombre || ' ' || apellido FROM persona WHERE id_persona = NEW.id_persona),
            NEW.rol_en_plantel;
    END IF;

    -- Verificar que no tenga el mismo rol activo en otro club
    -- (el cuerpo técnico está exento: puede estar fichado en varios clubes)
    IF NEW.fecha_baja IS NULL AND NOT es_rol_cuerpo_tecnico(NEW.rol_en_plantel) THEN
        SELECT EXISTS (
            SELECT 1 FROM fichaje_rol
            WHERE id_persona = NEW.id_persona
              AND rol = NEW.rol_en_plantel
              AND activo = TRUE
              AND fecha_fin IS NULL
              AND id_club != v_id_club
        ) INTO v_tiene_rol_en_otro_club;

        IF v_tiene_rol_en_otro_club THEN
            RAISE EXCEPTION
                'La persona ya tiene el rol % activo en otro club. '
                'No puede tener el mismo rol en dos clubes simultáneamente.',
                NEW.rol_en_plantel;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

_FN_ANTES_DE_AGREGAR_PREVIA = _FN_ANTES_DE_AGREGAR_NUEVA.replace(
    "    -- Verificar que no tenga el mismo rol activo en otro club\n"
    "    -- (el cuerpo técnico está exento: puede estar fichado en varios clubes)\n"
    "    IF NEW.fecha_baja IS NULL AND NOT es_rol_cuerpo_tecnico(NEW.rol_en_plantel) THEN",
    "    -- Verificar que no tenga el mismo rol activo en otro club\n"
    "    IF NEW.fecha_baja IS NULL THEN",
)


# --------------------------------------------------------------------------
# validar_rol_unico_por_club  (solo cambia el early return del encabezado)
# --------------------------------------------------------------------------
_GUARDA_ROL_UNICO = """
    -- El cuerpo técnico puede cumplir el mismo rol en varios clubes.
    IF es_rol_cuerpo_tecnico(p_rol) THEN
        RETURN NULL;
    END IF;
"""

_FN_ROL_UNICO = """
CREATE OR REPLACE FUNCTION validar_rol_unico_por_club(
    p_id_persona INT,
    p_rol tipo_rol_persona,
    p_id_club_destino INT,
    p_excluir_id_plantel_integrante INT DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_club_conflicto_nombre VARCHAR(100);
    v_equipo_conflicto_nombre VARCHAR(100);
    v_categoria_conflicto tipo_categoria;
    v_fecha_alta_conflicto DATE;
    v_mensaje VARCHAR;
BEGIN
{guarda}
    -- Buscar si ya existe el mismo rol en otro club
    SELECT
        c.nombre,
        eq.nombre,
        eq.categoria,
        pi.fecha_alta
    INTO
        v_club_conflicto_nombre,
        v_equipo_conflicto_nombre,
        v_categoria_conflicto,
        v_fecha_alta_conflicto
    FROM plantel_integrante pi
    JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    JOIN club c ON eq.id_club = c.id_club
    WHERE pi.id_persona = p_id_persona
    AND pi.rol_en_plantel = p_rol                     -- Mismo rol
    AND eq.id_club != p_id_club_destino              -- Club diferente
    -- Solo activos, con una excepción: si ya jugó un partido de un torneo en
    -- curso sigue "tomada" por ese club aunque se la haya dado de baja del
    -- plantel (migración 0035).
    AND (
        pi.fecha_baja IS NULL
        OR EXISTS (
            SELECT 1
            FROM participan_partido pp
            JOIN partido p2 ON p2.id_partido = pp.id_partido
            JOIN torneo t2  ON t2.id_torneo = p2.id_torneo
            WHERE pp.id_plantel_integrante = pi.id_plantel_integrante
              AND t2.activo = TRUE
              AND t2.borrado_en IS NULL
        )
    )
    -- "Plantel vigente": activo y, si es de un torneo, que el torneo siga
    -- activo. Sin la segunda parte, los planteles de torneos ya terminados
    -- bloquearían fichajes en otros clubes para siempre (ver migración 0033).
    AND pl.borrado_en IS NULL
    AND pl.activo = true
    AND (
        pl.id_torneo IS NULL
        OR EXISTS (
            SELECT 1 FROM torneo t
            WHERE t.id_torneo = pl.id_torneo
              AND t.activo = TRUE
              AND t.borrado_en IS NULL
        )
    )
    AND pi.id_plantel_integrante != COALESCE(p_excluir_id_plantel_integrante, -1)
    LIMIT 1;

    IF v_club_conflicto_nombre IS NOT NULL THEN
        v_mensaje := format(
            'La persona ya tiene el rol "%s" activo en otro club. ' ||
            'Detalles del conflicto: ' ||
            'Club: %s, ' ||
            'Equipo: %s (%s), ' ||
            'Fecha de alta: %s. ' ||
            'Regla: No se puede tener el mismo rol en clubes diferentes.',
            p_rol,
            v_club_conflicto_nombre,
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

_FN_ROL_UNICO_NUEVA = _FN_ROL_UNICO.format(guarda=_GUARDA_ROL_UNICO)
_FN_ROL_UNICO_PREVIA = _FN_ROL_UNICO.format(guarda="")


# --------------------------------------------------------------------------
# validar_equipo_unico_en_torneo_mismo_club
# --------------------------------------------------------------------------
_GUARDA_EQUIPO_UNICO = """
    -- El cuerpo técnico puede repetirse en varios equipos del mismo torneo.
    IF es_rol_cuerpo_tecnico(p_rol) THEN
        RETURN NULL;
    END IF;
"""

_FN_EQUIPO_UNICO = """
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
{guarda}
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

_FN_EQUIPO_UNICO_NUEVA = _FN_EQUIPO_UNICO.format(guarda=_GUARDA_EQUIPO_UNICO)
_FN_EQUIPO_UNICO_PREVIA = _FN_EQUIPO_UNICO.format(guarda="")


def upgrade() -> None:
    op.execute(_FN_ES_CUERPO_TECNICO)
    op.execute(_FN_ANTES_DE_AGREGAR_NUEVA)
    op.execute(_FN_ROL_UNICO_NUEVA)
    op.execute(_FN_EQUIPO_UNICO_NUEVA)

    # Índice único parcial: ahora exceptúa al cuerpo técnico.
    op.execute("DROP INDEX IF EXISTS unq_persona_rol_activo_uniclub;")
    op.execute(f"""
        CREATE UNIQUE INDEX unq_persona_rol_activo_uniclub
        ON fichaje_rol (id_persona, rol)
        WHERE activo = TRUE
          AND fecha_fin IS NULL
          AND rol NOT IN ({ROLES_CUERPO_TECNICO});
    """)
    op.execute("""
        COMMENT ON INDEX unq_persona_rol_activo_uniclub IS
        'Evita que una persona tenga el mismo rol activo en más de un club (no aplica al cuerpo técnico)';
    """)


def downgrade() -> None:
    # Ojo: si mientras tanto se cargaron fichajes de cuerpo técnico en varios
    # clubes, el índice restaurado va a fallar hasta darlos de baja.
    op.execute("DROP INDEX IF EXISTS unq_persona_rol_activo_uniclub;")
    op.execute("""
        CREATE UNIQUE INDEX unq_persona_rol_activo_uniclub
        ON fichaje_rol (id_persona, rol)
        WHERE activo = TRUE AND fecha_fin IS NULL;
    """)
    op.execute("""
        COMMENT ON INDEX unq_persona_rol_activo_uniclub IS
        'Evita que una persona tenga el mismo rol activo en más de un club';
    """)

    op.execute(_FN_EQUIPO_UNICO_PREVIA)
    op.execute(_FN_ROL_UNICO_PREVIA)
    op.execute(_FN_ANTES_DE_AGREGAR_PREVIA)
    op.execute("DROP FUNCTION IF EXISTS es_rol_cuerpo_tecnico(tipo_rol_persona);")
