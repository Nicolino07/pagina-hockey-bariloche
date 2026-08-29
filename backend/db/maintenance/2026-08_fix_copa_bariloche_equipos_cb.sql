-- =====================================================================
-- Reparación de COPA BARILOCHE (torneo 29): equipos duplicados «CB»
-- =====================================================================
--
-- Qué pasó. El torneo se armó al revés del orden correcto (crear torneo →
-- inscribir equipos → crear planteles): en vez de crearle a cada equipo su
-- nómina para este torneo, se crearon **equipos nuevos** terminados en «CB»
-- (San Esteban CB, Estudiantes CB, …), se les cargó el plantel ahí, y se dio
-- de baja la inscripción de los equipos reales, que ya estaban anotados.
--
-- Consecuencias: cinco equipos fantasma en cada club, la tabla del torneo
-- partida en dos mitades (los reales en cero, los CB con los puntos), y los
-- partidos jugados apuntando a los duplicados.
--
-- Qué hace este script. Devuelve todo al equipo real sin perder un solo dato
-- de juego. La clave es que **el plantel se muda entero**: `plantel_integrante`,
-- `participan_partido`, `gol` y `tarjeta` cuelgan de `id_plantel_integrante`,
-- que no se toca, así que goles, tarjetas y planillas quedan intactos.
--
-- Además corrige el tipo del torneo: se cargó como COPA y se juega como LIGA.
--
-- Verificado antes de escribirlo:
--   * los cinco equipos CB existen SOLO en este torneo: no hay ninguna otra
--     inscripción, partido, plantel ni fila de posición que los referencie;
--   * ninguno de los equipos reales tiene ya un plantel para el torneo 29, así
--     que mudar los CB no choca con `uq_plantel_equipo_torneo`;
--   * las inscripciones de los equipos reales siguen existiendo, solo fueron
--     dadas de baja el 25/08: se reactivan en vez de crear otras.
--
-- Ensayado con ROLLBACK antes de aplicar: los marcadores quedan idénticos
-- (3-3 y 9-4) y las nóminas conservan sus 12, 11, 11 y 13 integrantes.
--
-- Correr una sola vez por base:
--     docker compose exec -T db psql -U <user> -d <db> \
--       < backend/db/maintenance/2026-08_fix_copa_bariloche_equipos_cb.sql

BEGIN;

-- Mapa del error: por cada club, el equipo duplicado «CB» y el real.
CREATE TEMP TABLE mapa_cb (id_cb INT, id_real INT, insc_cb INT, insc_real INT) ;
INSERT INTO mapa_cb VALUES
    (83, 5, 182, 177),   -- San Esteban CB   -> San Esteban A
    (84, 8, 183, 179),   -- Estudiantes CB   -> Estudiantes
    (85, 7, 186, 178),   -- Vuriclub CB      -> Vuriclub
    (86, 9, 184, 180),   -- Esc.Municipal CB -> Esc. Municipal
    (87, 4, 185, 181);   -- Pehuenes CB      -> Pehuenes A

-- 1. Reactivar la inscripción del equipo real, que fue dada de baja por error.
UPDATE inscripcion_torneo i SET fecha_baja = NULL, actualizado_por = 'fix-copa-bariloche'
FROM mapa_cb m WHERE i.id_inscripcion = m.insc_real;

-- 2. Mudar la nómina al equipo real. Se mueve el plantel entero, así que
--    `plantel_integrante`, `participan_partido`, `gol` y `tarjeta` quedan
--    intactos: todos cuelgan de `id_plantel_integrante`, que no se toca.
UPDATE plantel pl
SET id_equipo       = m.id_real,
    nombre          = e.nombre || ' - COPA BARILOCHE',
    actualizado_por = 'fix-copa-bariloche'
FROM mapa_cb m JOIN equipo e ON e.id_equipo = m.id_real
WHERE pl.id_equipo = m.id_cb AND pl.id_torneo = 29 AND pl.borrado_en IS NULL;

-- 3. Repuntar los partidos al equipo y a la inscripción correctos.
UPDATE partido p
SET id_inscripcion_local = m.insc_real, id_equipo_local = m.id_real,
    actualizado_por = 'fix-copa-bariloche'
FROM mapa_cb m WHERE p.id_torneo = 29 AND p.id_inscripcion_local = m.insc_cb;

UPDATE partido p
SET id_inscripcion_visitante = m.insc_real, id_equipo_visitante = m.id_real,
    actualizado_por = 'fix-copa-bariloche'
FROM mapa_cb m WHERE p.id_torneo = 29 AND p.id_inscripcion_visitante = m.insc_cb;

-- 4. Sacar lo que quedó del error: posiciones, inscripciones y los equipos.
DELETE FROM posicion           WHERE id_torneo = 29 AND id_equipo IN (SELECT id_cb FROM mapa_cb);
DELETE FROM inscripcion_torneo WHERE id_inscripcion IN (SELECT insc_cb FROM mapa_cb);
DELETE FROM equipo             WHERE id_equipo IN (SELECT id_cb FROM mapa_cb);

-- 5. Es una liga, no una copa: se cargó mal el tipo.
UPDATE torneo SET tipo = 'LIGA', actualizado_por = 'fix-copa-bariloche' WHERE id_torneo = 29;

-- 6. Recalcular la tabla con los equipos ya corregidos.
SELECT recalcular_tabla_posiciones(29);

COMMIT;

-- Control de lo que quedó.
SELECT e.nombre AS equipo, po.puntos, po.partidos_jugados,
       po.goles_a_favor, po.goles_en_contra,
       (SELECT count(*) FROM plantel pl WHERE pl.id_equipo = po.id_equipo
          AND pl.id_torneo = 29 AND pl.borrado_en IS NULL) AS tiene_plantel
FROM posicion po JOIN equipo e USING (id_equipo)
WHERE po.id_torneo = 29
ORDER BY po.puntos DESC, po.goles_a_favor DESC;
