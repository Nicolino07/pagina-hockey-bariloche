-- =============================================================================
-- Limpieza puntual: purga de los torneos soft-deleteados
-- =============================================================================
--
-- Contexto
-- --------
-- El soft delete de torneos se reemplazó por borrado definitivo (ver
-- torneos_services.eliminar_torneo_definitivo). Quedaron torneos viejos con
-- borrado_en != NULL. Se revisaron TODOS contra una copia del VPS y se confirmó
-- que son basura o cargas duplicadas, seguros de borrar:
--
--   id 11  'FINALES '          SUB_14/FEM  -> 0 goles (basura, fixture abandonado)
--   id 12  'FINALES APERTUTA'  SUB_14/FEM  -> 0 partidos (basura, typo)
--   id 13  'FINALES APERTURA'  SUB_14/FEM  -> 31 goles, PERO es DUPLICADO exacto
--          del torneo 10 ('APERTURA FINALES', finalizado, mismos equipos, cruces
--          y goles). El dato real queda en el 10. Ver runbook.
--   id 14  'FINALES APERTURA'  SUB_16/FEM  -> 0 partidos (basura, duplicado)
--
-- Los finales ACTIVOS y legítimos de otras categorías (id 15 SUB_16, id 16 SUB_19)
-- NO son soft-deleteados y NO se tocan acá: si hay duplicados entre ellos, los
-- resuelve el admin con las planillas, usando el flujo de eliminación del sistema.
--
-- Nota: el bug de origen fue de uso (crearon los finales sin torneo_base_id). No
-- se arregla acá.
--
-- CUÁNDO / CÓMO
-- ------------
-- Correr a mano (pgAdmin por túnel SSH), UNA vez. NO es migración ni va en db/init.
-- Hacé BACKUP antes: es irreversible.
--
-- ANTES de ejecutar, reconfirmá en el VPS que los soft-deleteados siguen siendo
-- solo estos (por si se agregaron nuevos desde la copia):
--   SELECT id_torneo, nombre, categoria, genero,
--          (SELECT count(*) FROM gol g JOIN partido p ON p.id_partido=g.id_partido
--           WHERE p.id_torneo = torneo.id_torneo) AS goles
--   FROM torneo WHERE borrado_en IS NOT NULL ORDER BY id_torneo;
--
-- =============================================================================

BEGIN;

-- 1) Suspensiones (referencian torneo y partido; NO ACTION -> primero).
DELETE FROM suspension
WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE borrado_en IS NOT NULL)
   OR id_partido_origen IN (
        SELECT id_partido FROM partido
        WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE borrado_en IS NOT NULL)
   );

-- 2) Partidos: goles, tarjetas y participan_partido caen por CASCADE.
DELETE FROM partido
WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE borrado_en IS NOT NULL);

-- 3) Posiciones (FK a torneo sin cascada).
DELETE FROM posicion
WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE borrado_en IS NOT NULL);

-- 4) Inscripciones (RESTRICT hacia torneo): ya sin partidos que las referencien.
DELETE FROM inscripcion_torneo
WHERE id_torneo IN (SELECT id_torneo FROM torneo WHERE borrado_en IS NOT NULL);

-- 5) Torneos: fases, fixture_fecha y fixture_playoff_ronda caen por CASCADE.
DELETE FROM torneo WHERE borrado_en IS NOT NULL;

-- Revisá los conteos afectados y, si está OK, cambiá a COMMIT.
-- ROLLBACK;
COMMIT;
