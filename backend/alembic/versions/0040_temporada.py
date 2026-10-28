"""Temporada anual: agrupa apertura + clausura para una tabla de posiciones del año

Hasta ahora el torneo era la unidad máxima de competencia: no había forma de
decir que el Apertura y el Clausura de una misma liga son dos mitades del mismo
año. Esta migración agrega ese eje.

**Por qué una tabla nueva y no `torneo_base_id`**

`torneo_base_id` ya existe (migración 0016) pero significa otra cosa: vincula un
playoff/copa con la liga regular de la que hereda la nómina y las inscripciones.
Lo usan `plantel_resolver.py`, su espejo SQL `fn_plantel_de_equipo_en_torneo`,
`playoff_services` y varias vistas. Sobrecargarlo para "apertura y clausura van
juntos" rompería esos consumidores, así que queda intacto y la agrupación anual
viaja por un eje propio.

**El enum `rol_torneo_temporada`**

Un torneo asociado a una temporada declara qué papel juega dentro de ella:

  - `REGULAR`      suma a la tabla anual (Apertura, Clausura).
  - `NO_COMPUTA`   pertenece a la temporada pero no suma: relámpagos, copas
                   sueltas, y el playoff atado a un torneo puntual. Aparece
                   agrupado en el año sin contaminar la tabla.
  - `FINAL_ANUAL`  el playoff por el campeón del año. No suma; sus equipos
                   salen de la tabla anual (`vw_tabla_posiciones_anual`, 0041).

El rol también decide de dónde sale la nómina del playoff anual: solo los
planteles de torneos `REGULAR` son candidatos. Sin esta distinción, un equipo
con plantel de copa activo en paralelo al de la liga podría aportar la nómina
equivocada.

Todo lo existente queda con `id_temporada IS NULL`: la asignación a temporadas
es manual y no se puede inferir (nadie sabe qué torneos van juntos salvo quien
los creó). Nada cambia de comportamiento hasta que alguien arme la primera
temporada.

Revision ID: 0040
Revises: 0039
Create Date: 2026-08-28
"""
from alembic import op

revision = '0040'
down_revision = '0039'
branch_labels = None
depends_on = None


_TABLA = """
CREATE TABLE temporada (
    id_temporada    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    anio            INT NOT NULL CHECK (anio BETWEEN 1900 AND 2200),
    categoria       tipo_categoria NOT NULL,
    division        VARCHAR(30) DEFAULT NULL,
    genero          tipo_genero NOT NULL,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100)
);
"""

# `division` es nullable y en Postgres dos NULL no colisionan, así que un
# UNIQUE plano dejaría crear dos temporadas idénticas sin división (que es el
# caso más común: SUB_16, SUB_14 y SUB_12 no usan división). Con COALESCE la
# unicidad vale también para esas.
_UNIQUE = """
CREATE UNIQUE INDEX uq_temporada_anio_categoria
    ON temporada (anio, categoria, genero, COALESCE(division, ''))
    WHERE borrado_en IS NULL;
"""

_AUDITORIA = """
CREATE TRIGGER trg_audit_temporada
AFTER INSERT OR UPDATE OR DELETE
ON temporada
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria_generica();
"""


def upgrade() -> None:
    op.execute(
        "CREATE TYPE rol_torneo_temporada AS ENUM "
        "('REGULAR', 'NO_COMPUTA', 'FINAL_ANUAL');"
    )
    op.execute(_TABLA)
    op.execute(_UNIQUE)
    op.execute(_AUDITORIA)

    op.execute(
        "ALTER TABLE torneo ADD COLUMN id_temporada INT DEFAULT NULL "
        "REFERENCES temporada(id_temporada) ON DELETE SET NULL;"
    )
    # Sin temporada no hay rol que declarar: la columna queda NULL hasta que el
    # torneo se asigne a una. Se completa desde el ABM de temporadas.
    op.execute(
        "ALTER TABLE torneo ADD COLUMN rol_en_temporada rol_torneo_temporada "
        "DEFAULT NULL;"
    )
    op.execute(
        "ALTER TABLE torneo ADD CONSTRAINT chk_torneo_rol_requiere_temporada "
        "CHECK (rol_en_temporada IS NULL OR id_temporada IS NOT NULL);"
    )
    op.execute("CREATE INDEX ix_torneo_id_temporada ON torneo (id_temporada);")

    # La vista anual y la selección de planteles filtran por (temporada, rol),
    # siempre sobre el mismo par de columnas.
    op.execute(
        "CREATE INDEX ix_torneo_temporada_rol ON torneo (id_temporada, rol_en_temporada) "
        "WHERE id_temporada IS NOT NULL;"
    )

    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON temporada TO hockey_app;")
    op.execute("GRANT SELECT ON temporada TO hockey_readonly;")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_torneo_temporada_rol;")
    op.execute("DROP INDEX IF EXISTS ix_torneo_id_temporada;")
    op.execute("ALTER TABLE torneo DROP CONSTRAINT IF EXISTS chk_torneo_rol_requiere_temporada;")
    op.execute("ALTER TABLE torneo DROP COLUMN IF EXISTS rol_en_temporada;")
    op.execute("ALTER TABLE torneo DROP COLUMN IF EXISTS id_temporada;")
    op.execute("DROP TRIGGER IF EXISTS trg_audit_temporada ON temporada;")
    op.execute("DROP TABLE IF EXISTS temporada;")
    op.execute("DROP TYPE IF EXISTS rol_torneo_temporada;")
