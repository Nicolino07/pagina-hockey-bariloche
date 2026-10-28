"""Un jugador que ya jugó no puede pasar a otro club durante el torneo

`validar_rol_unico_por_club` filtraba `pi.fecha_baja IS NULL`, así que bastaba
con dar de baja a la persona en su plantel para que dejara de bloquear el alta
en otro club: un pase en medio del torneo, saltándose la regla.

La pertenencia se puede dar de baja (la persona dejó el equipo), pero haber
jugado un partido de un torneo en curso es un hecho consumado: mientras ese
torneo siga activo, la persona sigue "tomada" por ese club para ese rol.

Se agrega esa excepción al filtro de baja. El resto de la función no cambia.

Revision ID: 0035
Revises: 0034
Create Date: 2026-07-29
"""
from alembic import op

revision = '0035'
down_revision = '0034'
branch_labels = None
depends_on = None


def _fn(filtro_baja: str) -> str:
    return f"""
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
    AND pi.rol_en_plantel = p_rol
    AND eq.id_club != p_id_club_destino
    {filtro_baja}
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


# Sigue contando aunque esté de baja, si ya jugó un partido de un torneo en curso.
_FILTRO_NUEVO = """
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
"""

_FILTRO_VIEJO = "    AND pi.fecha_baja IS NULL"


def upgrade() -> None:
    op.execute(_fn(_FILTRO_NUEVO))


def downgrade() -> None:
    op.execute(_fn(_FILTRO_VIEJO))
