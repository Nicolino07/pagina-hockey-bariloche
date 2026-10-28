"""Separar la definición por penales de los goles del partido

Hasta ahora `DP` era un valor más del enum `tipo_gol`, así que una tanda de
penales se cargaba como un gol dentro de la tabla `gol`. Eso está mal: un penal
de la tanda no suma al marcador, no cuenta para el ranking de goleadores ni para
goles a favor / en contra. Su único efecto es decidir quién pasa de ronda.

Mientras viviera como etiqueta dentro de `gol`, cada consulta nueva tenía que
acordarse de filtrarla — y ninguna de las siete que cuentan goles lo hacía.

Esta migración hace tres cosas:

1. **Reclasifica los 6 registros `DP` existentes a `GP`.** La auditoría mostró
   que no eran tandas: uno solo por partido, todos en torneos de LIGA sin fase,
   cinco de los seis en partidos que ni siquiera estaban empatados, y todos con
   minuto y cuarto asignados. Eran goles de penal cargados con la etiqueta
   equivocada, así que se quedan en `gol` con el tipo correcto. El marcador, la
   tabla y el ranking no se mueven ni un punto.

2. **Crea `penal_definicion`**, la estructura propia de la tanda. Referencia al
   jugador vía `participan_partido` (la convocatoria de ESE partido) y al lado
   vía `inscripcion_torneo`, nunca por club: si se enfrentan dos equipos del
   mismo club, comparar por club daría verdadero para los dos lados y los
   penales se contarían doble.

3. **Crea `vw_penales_partido`**, una vista chica con los penales de cada lado y
   el detalle de ejecutantes. Va aparte a propósito: `vw_partidos_detallados` no
   se toca, así que el marcador no puede cambiar por accidente y el downgrade es
   un DROP limpio.

`DP` queda vivo en el enum `tipo_gol` (los enums de Postgres no permiten quitar
valores sin recrear el tipo) pero sale de la interfaz: pasa a ser un valor
muerto que ya no se puede escribir.

Revision ID: 0044
Revises: 0043
Create Date: 2026-09-23
"""
from alembic import op

revision = '0044'
down_revision = '0043'
branch_labels = None
depends_on = None


# Los 6 goles que estaban como DP. Se guardan explícitos para que el downgrade
# devuelva exactamente estos y no toque ningún GP legítimo.
IDS_DP_RECLASIFICADOS = (1079, 1220, 1284, 1462, 1827, 2896)


def upgrade() -> None:
    # =========================================================
    # 1. Reclasificar los DP existentes como goles de penal
    # =========================================================
    op.execute("""
        UPDATE gol
           SET referencia_gol = 'GP'
         WHERE referencia_gol = 'DP';
    """)

    # =========================================================
    # 2. Tabla propia para la tanda de penales
    # =========================================================
    op.execute("""
        CREATE TABLE IF NOT EXISTS penal_definicion (
            id_penal_definicion     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

            id_partido              INTEGER NOT NULL
                REFERENCES partido(id_partido) ON DELETE CASCADE,

            -- El ejecutante, a través de la convocatoria de ESTE partido.
            id_participante_partido INTEGER NOT NULL
                REFERENCES participan_partido(id_participante_partido) ON DELETE CASCADE,

            -- El lado, por inscripción al torneo. Nunca por club: dos equipos
            -- del mismo club enfrentados romperían la deducción.
            id_inscripcion          INTEGER NOT NULL
                REFERENCES inscripcion_torneo(id_inscripcion) ON DELETE CASCADE,

            -- Orden de ejecución dentro de la serie (1, 2, 3...). Permite
            -- reconstruir la tanda tal como se pateó.
            orden                   INTEGER,

            convertido              BOOLEAN NOT NULL DEFAULT FALSE,

            creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizado_en          TIMESTAMP,
            creado_por              VARCHAR(100),
            actualizado_por         VARCHAR(100),

            CONSTRAINT chk_penal_orden_positivo CHECK (orden IS NULL OR orden > 0)
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_penal_definicion_partido
            ON penal_definicion (id_partido);
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_penal_definicion_inscripcion
            ON penal_definicion (id_inscripcion);
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_penal_definicion_participante
            ON penal_definicion (id_participante_partido);
    """)

    _grant("penal_definicion", escritura=True)

    # =========================================================
    # 3. Vista de la tanda, separada del marcador
    # =========================================================
    op.execute("""
        CREATE OR REPLACE VIEW vw_penales_partido AS
        SELECT p.id_partido,
            p.id_inscripcion_local,
            p.id_inscripcion_visitante,
            COALESCE(( SELECT count(*) FROM penal_definicion pd
                        WHERE pd.id_partido = p.id_partido
                          AND pd.id_inscripcion = p.id_inscripcion_local
                          AND pd.convertido ), 0)::integer AS penales_local,
            COALESCE(( SELECT count(*) FROM penal_definicion pd
                        WHERE pd.id_partido = p.id_partido
                          AND pd.id_inscripcion = p.id_inscripcion_visitante
                          AND pd.convertido ), 0)::integer AS penales_visitante,
            COALESCE(( SELECT count(*) FROM penal_definicion pd
                        WHERE pd.id_partido = p.id_partido ), 0)::integer AS total_penales,
            ( SELECT string_agg(
                    ((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text
                    || pd.convertido::text,
                    '; '::text ORDER BY pd.orden NULLS LAST, pd.id_penal_definicion)
                FROM penal_definicion pd
                JOIN participan_partido pp
                  ON pd.id_participante_partido = pp.id_participante_partido
                JOIN plantel_integrante pi
                  ON pp.id_plantel_integrante = pi.id_plantel_integrante
                JOIN persona per ON pi.id_persona = per.id_persona
               WHERE pd.id_partido = p.id_partido
                 AND pd.id_inscripcion = p.id_inscripcion_local
            ) AS lista_penales_local,
            ( SELECT string_agg(
                    ((per.apellido::text || '|'::text) || per.nombre::text) || '|'::text
                    || pd.convertido::text,
                    '; '::text ORDER BY pd.orden NULLS LAST, pd.id_penal_definicion)
                FROM penal_definicion pd
                JOIN participan_partido pp
                  ON pd.id_participante_partido = pp.id_participante_partido
                JOIN plantel_integrante pi
                  ON pp.id_plantel_integrante = pi.id_plantel_integrante
                JOIN persona per ON pi.id_persona = per.id_persona
               WHERE pd.id_partido = p.id_partido
                 AND pd.id_inscripcion = p.id_inscripcion_visitante
            ) AS lista_penales_visitante
          FROM partido p;
    """)

    _grant("vw_penales_partido", escritura=False)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_penales_partido;")
    op.execute("DROP TABLE IF EXISTS penal_definicion;")

    # Devolver a DP exactamente los goles que la 0044 reclasificó.
    ids = ", ".join(str(i) for i in IDS_DP_RECLASIFICADOS)
    op.execute(f"""
        UPDATE gol
           SET referencia_gol = 'DP'
         WHERE id_gol IN ({ids});
    """)


def _grant(objeto: str, *, escritura: bool) -> None:
    """Aplica los grants del proyecto, si los roles existen en esta instancia."""
    permisos_app = "SELECT, INSERT, UPDATE, DELETE" if escritura else "SELECT"
    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hockey_app') THEN
                GRANT {permisos_app} ON {objeto} TO hockey_app;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hockey_readonly') THEN
                GRANT SELECT ON {objeto} TO hockey_readonly;
            END IF;
        END $$;
    """)
