-- =====================================================================
-- Corrección de los dos «FINALES APERTURA» de Sub 19 y Sub 16 femenino
-- =====================================================================
--
-- Los torneos 15 y 16 se cargaron con dos errores:
--
--   1. `division = 'A'`, en categorías que nunca tuvieron divisiones. Como el
--      selector de categorías se deriva de la tupla (categoría, género,
--      división) de los torneos, eso inventaba dos ligas fantasma —
--      «Sub 19 A Femenino» y «Sub 16 A Femenino» — que aparecían con 0 torneos
--      en curso y separadas de la liga a la que en realidad pertenecen.
--
--   2. Sin `torneo_base_id`, cuando son la fase final de la APERTURA de su
--      categoría. Por eso quedaban listados como un torneo suelto en vez de
--      verse como pestaña dentro de su liga.
--
-- Verificado antes de correrlo:
--   * ninguno de los cuatro torneos (4, 5, 15, 16) tiene plantel propio: usan
--     el plantel histórico, así que fijar `torneo_base_id` no cambia cómo se
--     resuelven las nóminas de los partidos ya jugados;
--   * todos los equipos de cada FINALES están inscriptos en su APERTURA
--     (4 de 4 en Sub 19, 5 de 5 en Sub 16), así que la relación es real.
--
-- No es una migración a propósito: es la corrección de dos filas mal cargadas,
-- no la consecuencia de un cambio de código. Correr una sola vez por base.
--
--     docker compose exec -T db psql -U <user> -d <db> \
--       < backend/db/maintenance/2026-08_fix_finales_apertura_sub19_sub16.sql

BEGIN;

-- Sub 19 femenino: FINALES APERTURA → fase final de APERTURA (id 4)
UPDATE torneo
SET division        = NULL,
    torneo_base_id  = 4,
    actualizado_por = 'fix-finales-apertura'
WHERE id_torneo = 16
  AND categoria = 'SUB_19' AND genero = 'FEMENINO' AND tipo = 'PLAYOFF';

-- Sub 16 femenino: FINALES APERTURA → fase final de APERTURA (id 5)
UPDATE torneo
SET division        = NULL,
    torneo_base_id  = 5,
    actualizado_por = 'fix-finales-apertura'
WHERE id_torneo = 15
  AND categoria = 'SUB_16' AND genero = 'FEMENINO' AND tipo = 'PLAYOFF';

COMMIT;

-- Control: no debe quedar ninguna categoría con división 'A'.
SELECT id_torneo, nombre, tipo, categoria, genero, division, torneo_base_id
FROM torneo
WHERE borrado_en IS NULL AND categoria IN ('SUB_19', 'SUB_16')
ORDER BY categoria, id_torneo;
