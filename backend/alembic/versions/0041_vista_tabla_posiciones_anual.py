"""Vista `vw_tabla_posiciones_anual`: suma de los torneos REGULAR de una temporada

La tabla anual es la suma de las tablas de los torneos que la temporada marcó
como `REGULAR` (Apertura + Clausura, típicamente). No recalcula nada desde los
partidos: `posicion` ya está mantenida por `recalcular_tabla_posiciones` vía
triggers, y ya está normalizada por `id_equipo` (no por inscripción), así que
el mismo equipo inscripto en los dos semestres agrega solo.

Eso también fija qué significa "el mismo equipo" a lo largo del año: la
identidad es `equipo.id_equipo`. Como `equipo_unq_club_categoria` incluye el
nombre, renombrar un equipo a mitad de año crea otro `id_equipo` y le parte la
campaña en dos filas. Es una limitación conocida; se avisa desde el ABM.

Reglas de negocio (confirmadas con la liga):

  - Un equipo que jugó solo uno de los torneos **entra igual**, con lo que
    sumó. De ahí que sea un agregado plano y no un JOIN entre torneos: no se
    exige presencia en todos. `torneos_computados` deja ver de cuántos viene
    cada campaña.
  - Desempate: puntos → diferencia de gol → goles a favor. Sin enfrentamiento
    directo, así que se resuelve entero acá y nadie tiene que reordenar después.

`puesto` viene calculado porque la vista es la fuente de la siembra del playoff
anual: los N primeros clasifican, y conviene que el corte lo defina la misma
consulta que se le muestra a la gente.

Revision ID: 0041
Revises: 0040
Create Date: 2026-08-28
"""
from alembic import op

revision = '0041'
down_revision = '0040'
branch_labels = None
depends_on = None


_VISTA = """
CREATE OR REPLACE VIEW vw_tabla_posiciones_anual AS
SELECT
    tmp.id_temporada,
    tmp.nombre        AS temporada,
    tmp.anio,
    tmp.categoria,
    tmp.division,
    tmp.genero,
    pos.id_equipo,
    e.nombre          AS equipo,
    e.id_club,

    COUNT(DISTINCT pos.id_torneo)        AS torneos_computados,
    SUM(pos.partidos_jugados)::INT       AS partidos_jugados,
    SUM(pos.ganados)::INT                AS ganados,
    SUM(pos.empatados)::INT              AS empatados,
    SUM(pos.perdidos)::INT               AS perdidos,
    SUM(pos.goles_a_favor)::INT          AS goles_a_favor,
    SUM(pos.goles_en_contra)::INT        AS goles_en_contra,
    (SUM(pos.goles_a_favor) - SUM(pos.goles_en_contra))::INT AS diferencia_gol,
    SUM(pos.puntos)::INT                 AS puntos,

    ROW_NUMBER() OVER (
        PARTITION BY tmp.id_temporada
        ORDER BY
            SUM(pos.puntos) DESC,
            (SUM(pos.goles_a_favor) - SUM(pos.goles_en_contra)) DESC,
            SUM(pos.goles_a_favor) DESC,
            e.nombre
    )::INT AS puesto

FROM posicion pos
JOIN torneo t
  ON t.id_torneo = pos.id_torneo
 AND t.rol_en_temporada = 'REGULAR'
 AND t.borrado_en IS NULL
JOIN temporada tmp
  ON tmp.id_temporada = t.id_temporada
 AND tmp.borrado_en IS NULL
JOIN equipo e
  ON e.id_equipo = pos.id_equipo
 AND e.borrado_en IS NULL

GROUP BY
    tmp.id_temporada,
    tmp.nombre,
    tmp.anio,
    tmp.categoria,
    tmp.division,
    tmp.genero,
    pos.id_equipo,
    e.nombre,
    e.id_club;
"""


def upgrade() -> None:
    op.execute(_VISTA)
    op.execute("GRANT SELECT ON vw_tabla_posiciones_anual TO hockey_app, hockey_readonly;")


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_tabla_posiciones_anual;")
