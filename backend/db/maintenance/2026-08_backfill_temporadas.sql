-- =====================================================================
-- Backfill de temporadas para los torneos anteriores al check
-- =====================================================================
--
-- Desde la migración 0040 cada torneo puede pertenecer a una `temporada` (la
-- agrupación anual de una liga) y declarar si suma a la tabla anual, con el
-- check «Suma a la tabla anual» del alta. Los torneos creados ANTES de eso
-- quedaron con `id_temporada IS NULL`, así que no producen tabla anual.
--
-- Este script los pone al día. Es idempotente: se puede correr las veces que
-- haga falta, y hay que volver a correrlo **después de restaurar un dump de
-- producción**, porque el dump no trae la tabla `temporada`.
--
--     docker compose exec -T db psql -U <user> -d <db> \
--       -f /ruta/2026-08_backfill_temporadas.sql
--
-- Criterio, sin depender de nombres:
--
--   * La temporada se identifica por la TUPLA del torneo — año de
--     `fecha_inicio` + categoría + género + división — igual que hace
--     `temporadas_services.aplicar_computa_anual()`. El nombre que se le pone
--     es solo un rótulo editable desde el ABM.
--   * Computan (`REGULAR`) los torneos de tipo LIGA: son los que reparten
--     puntos de liga.
--   * Los de tipo COPA y PLAYOFF definen un campeón pero no suman: quedan
--     `NO_COMPUTA` si su liga ya tiene temporada, y fuera si no la tiene (no se
--     crea una temporada solo para excluir a alguien de ella).
--
-- De acá en adelante el check del alta hace este mismo trabajo solo; esto es
-- únicamente para lo que ya estaba cargado.

BEGIN;

-- 1. Una temporada por cada liga que tenga al menos un torneo de tipo LIGA.
INSERT INTO temporada (nombre, anio, categoria, division, genero, creado_por)
SELECT DISTINCT
    initcap(replace(t.categoria::text, '_', ' '))
        || ' ' ||
        CASE t.genero::text
            WHEN 'MASCULINO' THEN 'Caballeros'
            WHEN 'FEMENINO'  THEN 'Damas'
            ELSE 'Mixto'
        END
        || COALESCE(' ' || t.division, '')          AS nombre,
    EXTRACT(YEAR FROM t.fecha_inicio)::INT          AS anio,
    t.categoria,
    t.division,
    t.genero,
    'backfill'                                      AS creado_por
FROM torneo t
WHERE t.borrado_en IS NULL
  AND t.tipo = 'LIGA'
  AND t.fecha_inicio IS NOT NULL
  -- Ya existe la temporada de esa tupla: nada que crear.
  AND NOT EXISTS (
      SELECT 1 FROM temporada tm
      WHERE tm.borrado_en IS NULL
        AND tm.anio      = EXTRACT(YEAR FROM t.fecha_inicio)::INT
        AND tm.categoria = t.categoria
        AND tm.genero    = t.genero
        AND tm.division IS NOT DISTINCT FROM t.division
  );

-- 2. Las ligas suman: REGULAR.
UPDATE torneo t
SET id_temporada     = tm.id_temporada,
    rol_en_temporada = 'REGULAR',
    actualizado_por  = 'backfill'
FROM temporada tm
WHERE t.borrado_en IS NULL
  AND t.tipo = 'LIGA'
  AND t.fecha_inicio IS NOT NULL
  AND tm.borrado_en IS NULL
  AND tm.anio      = EXTRACT(YEAR FROM t.fecha_inicio)::INT
  AND tm.categoria = t.categoria
  AND tm.genero    = t.genero
  AND tm.division IS NOT DISTINCT FROM t.division
  AND t.rol_en_temporada IS DISTINCT FROM 'REGULAR';

-- 3. Copas y playoffs: se agrupan en el año si su liga tiene temporada, pero
--    no suman. Si no hay temporada de esa tupla quedan sueltos, que es lo
--    correcto (ej. COPA BARILOCHE, que es Mayores Femenino sin división y no
--    corresponde a ninguna liga).
UPDATE torneo t
SET id_temporada     = tm.id_temporada,
    rol_en_temporada = 'NO_COMPUTA',
    actualizado_por  = 'backfill'
FROM temporada tm
WHERE t.borrado_en IS NULL
  AND t.tipo IN ('COPA', 'PLAYOFF')
  AND t.fecha_inicio IS NOT NULL
  AND tm.borrado_en IS NULL
  AND tm.anio      = EXTRACT(YEAR FROM t.fecha_inicio)::INT
  AND tm.categoria = t.categoria
  AND tm.genero    = t.genero
  AND tm.division IS NOT DISTINCT FROM t.division
  AND t.rol_en_temporada IS DISTINCT FROM 'NO_COMPUTA';

COMMIT;

-- Resumen de lo que quedó.
SELECT
    tm.id_temporada,
    tm.nombre,
    tm.anio,
    count(*) FILTER (WHERE t.rol_en_temporada = 'REGULAR')    AS suman,
    count(*) FILTER (WHERE t.rol_en_temporada = 'NO_COMPUTA') AS no_suman
FROM temporada tm
LEFT JOIN torneo t ON t.id_temporada = tm.id_temporada AND t.borrado_en IS NULL
WHERE tm.borrado_en IS NULL
GROUP BY tm.id_temporada, tm.nombre, tm.anio
ORDER BY tm.id_temporada;
