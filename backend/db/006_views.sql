-- =====================================================
-- 006_views.sql (VERSIÓN CORREGIDA)
-- Vistas de lectura del sistema
-- =====================================================

BEGIN;

-- =====================================================
-- VISTA: EQUIPOS POR TORNEO (CORREGIDA)
-- =====================================================
CREATE OR REPLACE VIEW vw_equipos_torneo AS
SELECT
    t.id_torneo,
    t.nombre        AS torneo,
    e.id_equipo,
    e.nombre        AS equipo,
    c.nombre        AS club,
    e.categoria,
    e.genero        AS genero_equipo,
    t.genero        AS genero_torneo,
    it.fecha_inscripcion
FROM torneo t
JOIN inscripcion_torneo it ON it.id_torneo = t.id_torneo
JOIN equipo e              ON e.id_equipo = it.id_equipo
JOIN club c                ON c.id_club = e.id_club
ORDER BY t.id_torneo, e.nombre;

-- =====================================================
-- VISTA: FIXTURE COMPLETO (CORREGIDA)
-- =====================================================
CREATE OR REPLACE VIEW vw_fixture AS
SELECT
    p.id_partido,
    t.id_torneo,
    t.nombre        AS torneo,
    p.fecha,
    p.horario,
    el.id_equipo    AS id_local,
    el.nombre       AS equipo_local,
    ev.id_equipo    AS id_visitante,
    ev.nombre       AS equipo_visitante,
    p.goles_local,
    p.goles_visitante,
    p.confirmado_en,
    p.confirmado_por,
    p.ubicacion,
    p.observaciones,
    -- Información de árbitros
    a1.nombre || ' ' || COALESCE(a1.apellido, '') AS arbitro_1,
    a2.nombre || ' ' || COALESCE(a2.apellido, '') AS arbitro_2
FROM partido p
JOIN torneo t      ON t.id_torneo = p.id_torneo
JOIN equipo el     ON el.id_equipo = p.id_local
JOIN equipo ev     ON ev.id_equipo = p.id_visitante
LEFT JOIN persona a1 ON a1.id_persona = p.id_arbitro1
LEFT JOIN persona a2 ON a2.id_persona = p.id_arbitro2
ORDER BY p.fecha DESC, p.horario;

-- =====================================================
-- VISTA: TABLA DE POSICIONES (CORREGIDA)
-- =====================================================
CREATE OR REPLACE VIEW vw_posiciones AS
SELECT
    ROW_NUMBER() OVER (
        PARTITION BY p.id_torneo 
        ORDER BY 
            p.puntos DESC,
            p.diferencia_gol DESC,
            p.goles_a_favor DESC,
            p.partidos_ganados DESC
    ) AS posicion,
    p.id_torneo,
    t.nombre        AS torneo,
    p.id_equipo,
    e.nombre        AS equipo,
    c.nombre        AS club,
    p.puntos,
    p.partidos_jugados,
    p.ganados       AS partidos_ganados,
    p.empatados     AS partidos_empatados,
    p.perdidos      AS partidos_perdidos,
    p.goles_a_favor,
    p.goles_en_contra,
    p.diferencia_gol,
    ROUND(
        CASE 
            WHEN p.partidos_jugados > 0 
            THEN (p.puntos::DECIMAL / (p.partidos_jugados * 3)) * 100 
            ELSE 0 
        END, 2
    ) AS porcentaje_rendimiento,
    p.actualizado_en
FROM posicion p
JOIN torneo t  ON t.id_torneo = p.id_torneo
JOIN equipo e  ON e.id_equipo = p.id_equipo
JOIN club c    ON c.id_club = e.id_club
WHERE t.activo = TRUE
ORDER BY
    p.id_torneo,
    p.puntos DESC,
    p.diferencia_gol DESC,
    p.goles_a_favor DESC;

-- =====================================================
-- VISTA: GOLEADORES (CORREGIDA - VERSIÓN MEJORADA)
-- =====================================================
CREATE OR REPLACE VIEW vw_goleadores AS
SELECT
    ROW_NUMBER() OVER (
        PARTITION BY p.id_torneo 
        ORDER BY COUNT(g.id_gol) DESC
    ) AS posicion,
    p.id_torneo,
    t.nombre        AS torneo,
    per.id_persona,
    per.nombre || ' ' || per.apellido AS jugador,
    e.id_equipo,
    e.nombre        AS equipo,
    COUNT(g.id_gol)     AS total_goles,
    COUNT(CASE WHEN g.es_autogol = FALSE THEN 1 END) AS goles_favor,
    COUNT(CASE WHEN g.es_autogol = TRUE THEN 1 END) AS autogoles,
    COUNT(CASE WHEN g.referencia_gol = 'GJ' THEN 1 END) AS goles_jugada,
    COUNT(CASE WHEN g.referencia_gol = 'GP' THEN 1 END) AS goles_penal,
    COUNT(CASE WHEN g.referencia_gol = 'GC' THEN 1 END) AS goles_corner,
    COUNT(CASE WHEN g.referencia_gol = 'DP' THEN 1 END) AS goles_penales
FROM gol g
JOIN partido p      ON p.id_partido = g.id_partido
JOIN torneo t       ON t.id_torneo = p.id_torneo
JOIN participan_partido pp ON pp.id_participante_partido = g.id_participante_partido
JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
JOIN persona per    ON per.id_persona = pi.id_persona
JOIN plantel pl     ON pl.id_plantel = pi.id_plantel
JOIN equipo e       ON e.id_equipo = pl.id_equipo
WHERE g.anulado = FALSE
  AND pi.rol_en_plantel = 'jugador'
GROUP BY
    p.id_torneo, t.nombre, per.id_persona, 
    per.nombre, per.apellido, e.id_equipo, e.nombre
ORDER BY
    p.id_torneo, total_goles DESC;

-- =====================================================
-- VISTA: TARJETAS (CORREGIDA - VERSIÓN MEJORADA)
-- =====================================================
CREATE OR REPLACE VIEW vw_tarjetas AS
SELECT
    p.id_torneo,
    t.nombre        AS torneo,
    per.id_persona,
    per.nombre || ' ' || per.apellido AS jugador,
    e.id_equipo,
    e.nombre        AS equipo,
    ta.tipo,
    COUNT(*)        AS cantidad,
    -- Resumen por tipo
    COUNT(CASE WHEN ta.tipo = 'amarilla' THEN 1 END) AS amarillas,
    COUNT(CASE WHEN ta.tipo = 'roja' THEN 1 END) AS rojas,
    COUNT(CASE WHEN ta.tipo = 'verde' THEN 1 END) AS verdes,
    MAX(ta.creado_en) AS ultima_tarjeta
FROM tarjeta ta
JOIN partido p      ON p.id_partido = ta.id_partido
JOIN torneo t       ON t.id_torneo = p.id_torneo
JOIN participan_partido pp ON pp.id_participante_partido = ta.id_participante_partido
JOIN plantel_integrante pi ON pi.id_plantel_integrante = pp.id_plantel_integrante
JOIN persona per    ON per.id_persona = pi.id_persona
JOIN plantel pl     ON pl.id_plantel = pi.id_plantel
JOIN equipo e       ON e.id_equipo = pl.id_equipo
WHERE pi.rol_en_plantel = 'jugador'
GROUP BY
    p.id_torneo, t.nombre, per.id_persona, 
    per.nombre, per.apellido, e.id_equipo, e.nombre, ta.tipo
ORDER BY
    p.id_torneo, cantidad DESC;

-- =====================================================
-- VISTA: SUSPENSIONES ACTIVAS
-- =====================================================
CREATE OR REPLACE VIEW vw_suspensiones_activas AS
SELECT
    s.id_suspension,
    per.id_persona,
    per.nombre || ' ' || per.apellido AS persona,
    per.dni,
    e.id_equipo,
    e.nombre        AS equipo,
    t.id_torneo,
    t.nombre        AS torneo,
    s.tipo_suspension,
    s.motivo,
    s.fechas_suspension,
    s.fecha_fin_suspension,
    s.cumplidas,
    s.activa,
    s.creado_en,
    CASE 
        WHEN s.tipo_suspension = 'por_fecha' THEN
            'Hasta ' || TO_CHAR(s.fecha_fin_suspension, 'DD/MM/YYYY')
        WHEN s.tipo_suspension = 'por_partidos' THEN
            s.cumplidas || ' de ' || s.fechas_suspension || ' partidos cumplidos'
    END AS estado
FROM suspension s
JOIN persona per ON per.id_persona = s.id_persona
JOIN torneo t    ON t.id_torneo = s.id_torneo
JOIN plantel_integrante pi ON pi.id_persona = s.id_persona
JOIN plantel pl  ON pl.id_plantel = pi.id_plantel AND pl.id_torneo = s.id_torneo
JOIN equipo e    ON e.id_equipo = pl.id_equipo
WHERE s.activa = TRUE
ORDER BY s.fecha_fin_suspension DESC, s.creado_en DESC;

-- =====================================================
-- VISTA: JUGADORES POR EQUIPO (PARA PLANTELES)
-- =====================================================
CREATE OR REPLACE VIEW vw_jugadores_equipo AS
SELECT
    pl.id_plantel,
    e.id_equipo,
    e.nombre        AS equipo,
    t.id_torneo,
    t.nombre        AS torneo,
    pi.id_plantel_integrante,
    per.id_persona,
    per.nombre || ' ' || per.apellido AS jugador,
    per.dni,
    per.fecha_nacimiento,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, per.fecha_nacimiento)) AS edad,
    pi.numero_camiseta,
    pi.rol_en_plantel,
    pi.fecha_alta,
    pi.fecha_baja,
    CASE 
        WHEN pi.fecha_baja IS NULL THEN 'Activo'
        ELSE 'Inactivo'
    END AS estado
FROM plantel_integrante pi
JOIN plantel pl   ON pl.id_plantel = pi.id_plantel
JOIN equipo e     ON e.id_equipo = pl.id_equipo
JOIN torneo t     ON t.id_torneo = pl.id_torneo
JOIN persona per  ON per.id_persona = pi.id_persona
WHERE pi.rol_en_plantel = 'jugador'
ORDER BY e.nombre, pi.numero_camiseta NULLS LAST;

-- =====================================================
-- VISTA: PARTIDOS POR JUGADOR (ESTADÍSTICAS INDIVIDUALES)
-- =====================================================
CREATE OR REPLACE VIEW vw_estadisticas_jugador AS
SELECT
    per.id_persona,
    per.nombre || ' ' || per.apellido AS jugador,
    e.id_equipo,
    e.nombre        AS equipo,
    t.id_torneo,
    t.nombre        AS torneo,
    COUNT(DISTINCT p.id_partido) AS partidos_jugados,
    COUNT(g.id_gol) AS goles,
    COUNT(CASE WHEN g.es_autogol = FALSE THEN 1 END) AS goles_favor,
    COUNT(CASE WHEN g.es_autogol = TRUE THEN 1 END) AS autogoles,
    COUNT(CASE WHEN ta.tipo = 'amarilla' THEN 1 END) AS tarjetas_amarillas,
    COUNT(CASE WHEN ta.tipo = 'roja' THEN 1 END) AS tarjetas_rojas,
    COUNT(CASE WHEN ta.tipo = 'verde' THEN 1 END) AS tarjetas_verdes
FROM persona per
LEFT JOIN plantel_integrante pi ON pi.id_persona = per.id_persona AND pi.rol_en_plantel = 'jugador'
LEFT JOIN plantel pl ON pl.id_plantel = pi.id_plantel
LEFT JOIN equipo e ON e.id_equipo = pl.id_equipo
LEFT JOIN torneo t ON t.id_torneo = pl.id_torneo
LEFT JOIN participan_partido pp ON pp.id_plantel_integrante = pi.id_plantel_integrante
LEFT JOIN partido p ON p.id_partido = pp.id_partido AND p.id_torneo = t.id_torneo
LEFT JOIN gol g ON g.id_participante_partido = pp.id_participante_partido AND g.anulado = FALSE
LEFT JOIN tarjeta ta ON ta.id_participante_partido = pp.id_participante_partido
WHERE per.id_persona IS NOT NULL
GROUP BY 
    per.id_persona, per.nombre, per.apellido,
    e.id_equipo, e.nombre, t.id_torneo, t.nombre
ORDER BY goles DESC, partidos_jugados DESC;

-- =====================================================
-- VISTA: FIXTURE PROGRAMADO (PARA CALENDARIO)
-- =====================================================
CREATE OR REPLACE VIEW vw_fixture_programado AS
SELECT
    ff.id_fixture_fecha,
    t.id_torneo,
    t.nombre        AS torneo,
    ff.numero_fecha,
    ff.rueda,
    ff.fecha_programada,
    el.nombre       AS equipo_local,
    ev.nombre       AS equipo_visitante,
    fp.jugado,
    p.id_partido    AS id_partido_real,
    p.goles_local,
    p.goles_visitante
FROM fixture_fecha ff
JOIN torneo t ON t.id_torneo = ff.id_torneo
JOIN fixture_partido fp ON fp.id_fixture_fecha = ff.id_fixture_fecha
JOIN equipo el ON el.id_equipo = fp.id_equipo_local
JOIN equipo ev ON ev.id_equipo = fp.id_equipo_visitante
LEFT JOIN partido p ON p.id_partido = fp.id_partido_real
ORDER BY ff.fecha_programada, ff.numero_fecha;

COMMIT;