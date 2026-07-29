"""Plantel por torneo

Hasta ahora `plantel` colgaba solo de `equipo` (un plantel activo por equipo,
con `temporada` como string), sin ninguna arista hacia `torneo`. Eso hacía
imposible saber la nómina de cada torneo: 24 de 65 equipos juegan 2 o 3 torneos
compartiendo un único plantel.

Esta migración es **puramente aditiva**: agrega `plantel.id_torneo` nullable y
los constraints que permiten N planteles activos por equipo (uno por torneo).
Los planteles existentes quedan con `id_torneo IS NULL` = bucket histórico, y
NO se tocan: `participan_partido.id_plantel_integrante` es ON DELETE CASCADE, así
que borrar o repuntar integrantes destruiría goles y tarjetas de partidos ya
jugados.

Se aprovecha para corregir `validar_rol_unico_por_club`, que decidía el conflicto
con `pl.activo = true`. Con N planteles activos por equipo esa regla se degradaría
sola (un jugador de un torneo terminado cuyo plantel quedó activo no podría
ficharse en otro club). Se cambia por "plantel vigente" = activo Y (histórico o
de un torneo activo). Se hace acá a propósito: mientras todos los planteles
tienen `id_torneo IS NULL`, el predicado nuevo es demostrablemente equivalente
al viejo, así que el cambio riesgoso se aplica cuando es un no-op verificable.

Revision ID: 0033
Revises: 0032
Create Date: 2026-07-28
"""
from alembic import op

revision = '0033'
down_revision = '0032'
branch_labels = None
depends_on = None


# Resolución canónica del plantel de un equipo en un torneo. Espejo SQL de
# app/services/plantel_resolver.py — si se toca uno hay que tocar el otro
# (hay un test de paridad que recorre los pares equipo/torneo inscriptos).
_FN_RESOLVER = """
CREATE OR REPLACE FUNCTION fn_plantel_de_equipo_en_torneo(
    p_id_equipo INT,
    p_id_torneo INT
)
RETURNS INT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id_torneo_base INT;
    v_id_plantel     INT;
BEGIN
    -- Los playoffs comparten el plantel de su torneo base.
    SELECT COALESCE(t.torneo_base_id, t.id_torneo)
    INTO v_id_torneo_base
    FROM torneo t
    WHERE t.id_torneo = p_id_torneo;

    IF v_id_torneo_base IS NULL THEN
        v_id_torneo_base := p_id_torneo;
    END IF;

    -- 1) Plantel propio del torneo. Se devuelve aunque esté cerrado: las
    --    lecturas históricas de un torneo terminado tienen que seguir andando.
    SELECT pl.id_plantel
    INTO v_id_plantel
    FROM plantel pl
    WHERE pl.id_equipo = p_id_equipo
      AND pl.id_torneo = v_id_torneo_base
      AND pl.borrado_en IS NULL
    ORDER BY pl.activo DESC
    LIMIT 1;

    IF v_id_plantel IS NOT NULL THEN
        RETURN v_id_plantel;
    END IF;

    -- 2) Fallback al plantel histórico (id_torneo NULL). Es único gracias a
    --    uq_plantel_legacy_activo, así que la resolución es determinista.
    SELECT pl.id_plantel
    INTO v_id_plantel
    FROM plantel pl
    WHERE pl.id_equipo = p_id_equipo
      AND pl.id_torneo IS NULL
      AND pl.activo = true
      AND pl.borrado_en IS NULL
    LIMIT 1;

    RETURN v_id_plantel;
END;
$$;
"""

# Las columnas nuevas van al FINAL del SELECT: CREATE OR REPLACE VIEW solo
# permite agregar columnas al final. Insertarlas en el medio obligaría a
# DROP VIEW, con el riesgo de arrastrar dependientes por CASCADE.
_VIEW_CON_TORNEO = """
CREATE OR REPLACE VIEW vw_plantel_detallado AS
SELECT
    pl.id_plantel,
    pl.nombre AS nombre_plantel,
    pl.temporada,
    pl.activo AS plantel_activo,
    pl.borrado_en AS plantel_borrado_en,

    e.id_equipo,
    e.nombre AS nombre_equipo,

    pi.id_plantel_integrante,
    pi.rol_en_plantel,
    pi.numero_camiseta,
    pi.fecha_alta,
    pi.fecha_baja,

    per.id_persona,
    per.nombre AS nombre_persona,
    per.apellido AS apellido_persona,
    per.documento,

    -- Agregado en 0033. NULL = plantel histórico previo a la migración.
    pl.id_torneo,
    t.nombre AS nombre_torneo
FROM plantel pl
JOIN equipo e ON e.id_equipo = pl.id_equipo
LEFT JOIN torneo t ON t.id_torneo = pl.id_torneo
LEFT JOIN plantel_integrante pi ON pi.id_plantel = pl.id_plantel AND pi.fecha_baja IS NULL
LEFT JOIN persona per ON per.id_persona = pi.id_persona
WHERE pl.borrado_en IS NULL;
"""

_VIEW_SIN_TORNEO = """
CREATE OR REPLACE VIEW vw_plantel_detallado AS
SELECT
    pl.id_plantel,
    pl.nombre AS nombre_plantel,
    pl.temporada,
    pl.activo AS plantel_activo,
    pl.borrado_en AS plantel_borrado_en,
    e.id_equipo,
    e.nombre AS nombre_equipo,
    pi.id_plantel_integrante,
    pi.rol_en_plantel,
    pi.numero_camiseta,
    pi.fecha_alta,
    pi.fecha_baja,
    per.id_persona,
    per.nombre AS nombre_persona,
    per.apellido AS apellido_persona,
    per.documento
FROM plantel pl
JOIN equipo e ON e.id_equipo = pl.id_equipo
LEFT JOIN plantel_integrante pi ON pi.id_plantel = pl.id_plantel AND pi.fecha_baja IS NULL
LEFT JOIN persona per ON per.id_persona = pi.id_persona
WHERE pl.borrado_en IS NULL;
"""


def _fn_rol_unico(predicado_plantel: str) -> str:
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
    AND pi.fecha_baja IS NULL
    {predicado_plantel}
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


# "Plantel vigente": activo y, si pertenece a un torneo, que ese torneo siga
# activo. Sin esto, los planteles de torneos terminados seguirían bloqueando
# fichajes en otros clubes para siempre.
_PREDICADO_NUEVO = """
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
"""

_PREDICADO_VIEJO = "    AND pl.activo = true"


def upgrade() -> None:
    # 1. Columna + FK + índice.
    #    RESTRICT y no SET NULL: con SET NULL, borrar un torneo convertiría sus
    #    planteles en "históricos" en silencio y podría colisionar con los
    #    índices del bucket legacy.
    op.execute("ALTER TABLE plantel ADD COLUMN id_torneo INT;")
    op.execute(
        """
        ALTER TABLE plantel
            ADD CONSTRAINT fk_plantel_torneo
                FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
                ON UPDATE CASCADE ON DELETE RESTRICT;
        """
    )
    op.execute("CREATE INDEX ix_plantel_id_torneo ON plantel (id_torneo);")

    # 2. Se cae la unicidad por temporada: prohíbe justo el caso a habilitar
    #    (un equipo con 2-3 torneos dentro de la misma temporada).
    op.execute("ALTER TABLE plantel DROP CONSTRAINT IF EXISTS uq_equipo_temporada;")
    op.execute("DROP INDEX IF EXISTS idx_solamente_un_plantel_activo;")

    # 3. La temporada pasa a derivarse del torneo, así que deja de ser obligatoria.
    op.execute("ALTER TABLE plantel ALTER COLUMN temporada DROP NOT NULL;")
    op.execute("ALTER TABLE plantel DROP CONSTRAINT IF EXISTS chk_plantel_temporada_formato;")
    op.execute(
        """
        ALTER TABLE plantel
            ADD CONSTRAINT chk_plantel_temporada_formato
                CHECK (temporada IS NULL OR temporada ~ '^[0-9]{4}(-[0-9]{4})?$');
        """
    )

    # 4. Unicidad nueva, separada por bucket. Si algún registro existente no la
    #    cumpliera, el CREATE INDEX aborta la migración (fail-fast deseable).
    op.execute(
        """
        CREATE UNIQUE INDEX uq_plantel_equipo_torneo
            ON plantel (id_equipo, id_torneo)
            WHERE id_torneo IS NOT NULL AND borrado_en IS NULL;
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_plantel_legacy_equipo_temporada
            ON plantel (id_equipo, temporada)
            WHERE id_torneo IS NULL AND borrado_en IS NULL;
        """
    )
    # Hace determinista el fallback al plantel histórico.
    op.execute(
        """
        CREATE UNIQUE INDEX uq_plantel_legacy_activo
            ON plantel (id_equipo)
            WHERE id_torneo IS NULL AND activo = true AND borrado_en IS NULL;
        """
    )

    # 5. Resolver canónico, vista con torneo y corrección de R1.
    op.execute(_FN_RESOLVER)
    op.execute(_VIEW_CON_TORNEO)
    op.execute(_fn_rol_unico(_PREDICADO_NUEVO))


def downgrade() -> None:
    """OJO: solo es seguro inmediatamente después del upgrade.

    Si ya se creó más de un plantel activo para el mismo equipo (que es
    justamente lo que habilita esta migración), `idx_solamente_un_plantel_activo`
    no se puede recrear y el downgrade falla a mitad de camino. Es el
    comportamiento correcto: no debe borrar datos para poder revertirse.
    """
    op.execute(_fn_rol_unico(_PREDICADO_VIEJO))
    op.execute(_VIEW_SIN_TORNEO)
    op.execute("DROP FUNCTION IF EXISTS fn_plantel_de_equipo_en_torneo(INT, INT);")

    op.execute("DROP INDEX IF EXISTS uq_plantel_legacy_activo;")
    op.execute("DROP INDEX IF EXISTS uq_plantel_legacy_equipo_temporada;")
    op.execute("DROP INDEX IF EXISTS uq_plantel_equipo_torneo;")

    op.execute("ALTER TABLE plantel DROP CONSTRAINT IF EXISTS chk_plantel_temporada_formato;")
    op.execute(
        """
        ALTER TABLE plantel
            ADD CONSTRAINT chk_plantel_temporada_formato
                CHECK (temporada ~ '^[0-9]{4}(-[0-9]{4})?$');
        """
    )
    op.execute("ALTER TABLE plantel ALTER COLUMN temporada SET NOT NULL;")

    op.execute(
        """
        CREATE UNIQUE INDEX idx_solamente_un_plantel_activo
            ON plantel (id_equipo)
            WHERE (activo = true AND borrado_en IS NULL);
        """
    )
    op.execute("ALTER TABLE plantel ADD CONSTRAINT uq_equipo_temporada UNIQUE (id_equipo, temporada);")

    op.execute("DROP INDEX IF EXISTS ix_plantel_id_torneo;")
    op.execute("ALTER TABLE plantel DROP CONSTRAINT IF EXISTS fk_plantel_torneo;")
    op.execute("ALTER TABLE plantel DROP COLUMN IF EXISTS id_torneo;")
