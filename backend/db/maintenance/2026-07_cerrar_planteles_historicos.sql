-- =============================================================================
-- Cierre de los planteles históricos previos a la migración 0033
-- =============================================================================
--
-- Contexto
-- --------
-- Hasta la 0033 un `plantel` colgaba solo del equipo y no tenía torneo. La
-- migración es aditiva: los planteles existentes quedaron con `id_torneo = NULL`
-- (el "bucket histórico") y siguen activos, porque son el fallback que usa
-- `resolver_plantel` mientras los equipos no tengan su nómina por torneo.
--
-- El cierre automático (torneos_services.finalizar_torneo -> cerrar_planteles_de_torneo)
-- solo alcanza a los planteles que PERTENECEN a un torneo. Los históricos no
-- pertenecen a ninguno, así que ningún finalizar los cierra. De ahí que sigan
-- abiertos aunque sus torneos hayan terminado.
--
-- Este script los cierra de una, para dejar de arrastrar nóminas editables de
-- competencias ya jugadas.
--
--
-- ⚠️  PRECAUCIÓN — leer antes de correrlo
-- ---------------------------------------
-- Un plantel histórico cerrado deja de servir como fallback: `resolver_plantel`
-- lo descarta (filtra activo = true). Para todo equipo que esté jugando un
-- torneo activo y NO tenga todavía su nómina propia de ese torneo, la planilla
-- del partido va a quedar SIN JUGADORES.
--
-- Por eso el script NO cierra a ciegas: excluye a los equipos inscriptos en
-- algún torneo activo que aún no tengan plantel propio para ese torneo. Esos
-- quedan abiertos y hay que resolverlos creándoles la nómina del torneo
-- (Nuevo plantel -> Traer nómina) antes de volver a correrlo.
--
-- Lo que NO se pierde al cerrarlos:
--   * Las estadísticas históricas (goleadores, tarjetas, posiciones) no dependen
--     de plantel.activo: viajan por participan_partido -> partido -> torneo.
--   * Un plantel cerrado SIGUE sirviendo como origen de "Traer nómina": la copia
--     solo rechaza los borrados, no los cerrados.
--
-- Reversible: basta con volver a poner activo = true y fecha_cierre = NULL.
--
--
-- Uso
-- ---
--   docker exec -i hockey_db psql -U hockey_user -d hockey_db < \
--     backend/db/maintenance/2026-07_cerrar_planteles_historicos.sql
-- =============================================================================

BEGIN;

-- Equipos que NO se deben tocar: están jugando un torneo activo y todavía
-- dependen del plantel histórico porque no cargaron el del torneo.
CREATE TEMP TABLE _equipos_en_riesgo ON COMMIT DROP AS
SELECT DISTINCT it.id_equipo
FROM inscripcion_torneo it
JOIN torneo t ON t.id_torneo = it.id_torneo
WHERE t.activo
  AND t.borrado_en IS NULL
  AND it.fecha_baja IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM plantel pl
      WHERE pl.id_equipo = it.id_equipo
        AND pl.id_torneo = COALESCE(t.torneo_base_id, t.id_torneo)
        AND pl.borrado_en IS NULL
  );

-- Informe previo
\echo ''
\echo '--- Planteles históricos abiertos ---'
SELECT
    count(*)                                                              AS total_abiertos,
    count(*) FILTER (WHERE pl.id_equipo IN (SELECT id_equipo FROM _equipos_en_riesgo)) AS se_omiten,
    count(*) FILTER (WHERE pl.id_equipo NOT IN (SELECT id_equipo FROM _equipos_en_riesgo)) AS se_cierran
FROM plantel pl
WHERE pl.id_torneo IS NULL AND pl.activo AND pl.borrado_en IS NULL;

\echo ''
\echo '--- Equipos omitidos (juegan un torneo activo sin nómina propia) ---'
SELECT e.id_equipo, e.nombre AS equipo, c.nombre AS club
FROM _equipos_en_riesgo r
JOIN equipo e ON e.id_equipo = r.id_equipo
JOIN club c   ON c.id_club = e.id_club
ORDER BY c.nombre, e.nombre;

-- Cierre. `fecha_cierre` es obligatoria cuando activo = false
-- (chk_plantel_cierre_si_inactivo) y no puede ser anterior a la apertura
-- (chk_plantel_fechas_validas).
UPDATE plantel pl
SET activo          = false,
    fecha_cierre    = GREATEST(CURRENT_DATE, pl.fecha_apertura),
    actualizado_en  = CURRENT_TIMESTAMP,
    actualizado_por = 'mantenimiento:cerrar_planteles_historicos'
WHERE pl.id_torneo IS NULL
  AND pl.activo
  AND pl.borrado_en IS NULL
  AND pl.id_equipo NOT IN (SELECT id_equipo FROM _equipos_en_riesgo);

\echo ''
\echo '--- Resultado ---'
SELECT
    count(*) FILTER (WHERE activo)     AS historicos_abiertos,
    count(*) FILTER (WHERE NOT activo) AS historicos_cerrados
FROM plantel
WHERE id_torneo IS NULL AND borrado_en IS NULL;

COMMIT;
