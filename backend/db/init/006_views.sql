-- =====================================================
-- 006_views.sql
-- Vistas del sistema
-- =====================================================

BEGIN;

-- =====================================================
-- 1. JUGADORES CON SUS ROLES
-- =====================================================

CREATE OR REPLACE VIEW vw_persona_roles AS
SELECT
    p.id_persona,
    p.nombre,
    p.apellido,
    p.documento,
    p.genero,
    pr.rol,
    pr.fecha_desde,
    pr.fecha_hasta
FROM persona p
LEFT JOIN persona_rol pr
       ON pr.id_persona = p.id_persona;


-- =====================================================
-- 2. PLANTEL detallado
-- =====================================================


CREATE OR REPLACE VIEW vw_plantel_detallado AS
SELECT
    -- Datos del Plantel
    pl.id_plantel,
    pl.nombre AS nombre_plantel,
    pl.temporada,
    pl.activo AS plantel_activo,
    pl.borrado_en AS plantel_borrado_en,
    
    -- Datos del Equipo
    e.id_equipo,
    e.nombre AS nombre_equipo,
    
    -- Datos del Integrante (pueden ser NULL)
    pi.id_plantel_integrante,
    pi.rol_en_plantel,
    pi.numero_camiseta,
    pi.fecha_alta,
    pi.fecha_baja,
    
    -- Datos de la Persona (pueden ser NULL)
    per.id_persona,
    per.nombre AS nombre_persona,
    per.apellido AS apellido_persona,
    per.documento 
FROM plantel pl
JOIN equipo e ON e.id_equipo = pl.id_equipo
LEFT JOIN plantel_integrante pi ON pi.id_plantel = pl.id_plantel AND pi.fecha_baja IS NULL
LEFT JOIN persona per ON per.id_persona = pi.id_persona
WHERE pl.borrado_en IS NULL;

-- =====================================================
-- 3. FIXTURE DE PARTIDOS
-- =====================================================

CREATE OR REPLACE VIEW vw_fixture_partidos AS
SELECT
    p.id_partido,
    p.id_torneo,
    p.fecha,
    p.horario,
    p.estado_partido,
    el.id_equipo AS id_equipo_local,
    el.nombre AS equipo_local,
    ev.id_equipo AS id_equipo_visitante,
    ev.nombre AS equipo_visitante

FROM partido p
JOIN inscripcion_torneo itl
  ON itl.id_inscripcion = p.id_inscripcion_local
JOIN equipo el
  ON el.id_equipo = itl.id_equipo
JOIN inscripcion_torneo itv
  ON itv.id_inscripcion = p.id_inscripcion_visitante
JOIN equipo ev
  ON ev.id_equipo = itv.id_equipo;



-- =====================================================
-- 4. TABLA DE POSICIONES
-- =====================================================

CREATE OR REPLACE VIEW vw_tabla_posiciones AS
SELECT
    pos.id_torneo,
    t.nombre AS torneo,
    pos.id_equipo,
    e.nombre AS equipo,
    pos.partidos_jugados,
    pos.ganados,
    pos.empatados,
    pos.perdidos,
    pos.goles_a_favor,
    pos.goles_en_contra,
    pos.diferencia_gol,
    pos.puntos
FROM posicion pos
JOIN torneo t
  ON t.id_torneo = pos.id_torneo
JOIN equipo e
  ON e.id_equipo = pos.id_equipo
ORDER BY
    pos.id_torneo,
    pos.puntos DESC,
    (pos.goles_a_favor - pos.goles_en_contra) DESC;


-- =====================================================
-- 5. SUSPENSIONES ACTIVAS
-- =====================================================

CREATE OR REPLACE VIEW vw_suspensiones_activas AS
SELECT
    s.id_suspension,
    pr.id_persona_rol,
    p.id_persona,
    p.nombre,
    p.apellido,
    s.id_torneo,
    t.nombre AS torneo,
    s.tipo_suspension,
    s.motivo,
    s.fechas_suspension,
    s.cumplidas,
    s.fecha_fin_suspension,

    -- columna calculada
    TRUE AS activa

FROM suspension s
JOIN persona_rol pr
    ON pr.id_persona_rol = s.id_persona_rol
JOIN persona p
    ON p.id_persona = pr.id_persona
JOIN torneo t
    ON t.id_torneo = s.id_torneo

WHERE
    s.estado_suspension = 'ACTIVA'
    AND s.anulada_en IS NULL
    AND (
        (s.tipo_suspension = 'POR_PARTIDOS'
         AND s.cumplidas < s.fechas_suspension)
        OR
        (s.tipo_suspension = 'POR_FECHA'
         AND s.fecha_fin_suspension >= CURRENT_DATE)
    );

-- =================================================
-- vista resultados por partido 
-- ================================================

CREATE OR REPLACE VIEW vw_resultado_partido AS
SELECT
    p.id_partido,
    p.id_torneo,
    p.id_inscripcion_local,
    p.id_inscripcion_visitante,

    -- goles local
    SUM(
        CASE
            WHEN (
                it.id_inscripcion = p.id_inscripcion_local
                AND NOT g.es_autogol
            )
            OR (
                it.id_inscripcion = p.id_inscripcion_visitante
                AND g.es_autogol
            )
            THEN 1
            ELSE 0
        END
    ) AS goles_local,

    -- goles visitante
    SUM(
        CASE
            WHEN (
                it.id_inscripcion = p.id_inscripcion_visitante
                AND NOT g.es_autogol
            )
            OR (
                it.id_inscripcion = p.id_inscripcion_local
                AND g.es_autogol
            )
            THEN 1
            ELSE 0
        END
    ) AS goles_visitante

FROM partido p
LEFT JOIN gol g
  ON g.id_partido = p.id_partido
LEFT JOIN participan_partido pp
  ON pp.id_participante_partido = g.id_participante_partido
LEFT JOIN plantel_integrante pi
  ON pi.id_plantel_integrante = pp.id_plantel_integrante
LEFT JOIN plantel pl
  ON pl.id_plantel = pi.id_plantel
LEFT JOIN inscripcion_torneo it
  ON it.id_equipo = pl.id_equipo

GROUP BY
    p.id_partido,
    p.id_torneo,
    p.id_inscripcion_local,
    p.id_inscripcion_visitante;





-- =============================
-- Vistas para tarjetas 
-- =============================

-- PRIMERO: Tarjetas con detalles (vista base)
CREATE OR REPLACE VIEW vw_tarjetas_detalle_torneo AS
SELECT
    -- Torneo
    tor.id_torneo,
    tor.nombre              AS torneo,

    -- Partido
    p.id_partido,
    p.fecha                 AS fecha_partido,
    p.numero_fecha,

    -- Persona
    per.id_persona,
    per.nombre              AS nombre_persona,
    per.apellido            AS apellido_persona,

    -- Rol / plantel
    pi.id_plantel_integrante,
    pi.rol_en_plantel,
    pi.numero_camiseta,

    -- Equipo
    e.id_equipo,
    e.nombre                AS equipo,

    -- Tarjeta
    t.id_tarjeta,
    t.tipo                  AS tipo_tarjeta,
    t.minuto,
    t.cuarto,
    t.observaciones,
    t.estado_tarjeta,

    -- Flags útiles
    CASE WHEN t.tipo = 'VERDE' THEN 1 ELSE 0 END AS verdes,
    CASE WHEN t.tipo = 'AMARILLA' THEN 1 ELSE 0 END AS amarillas,
    CASE WHEN t.tipo = 'ROJA' THEN 1 ELSE 0 END AS rojas

FROM tarjeta t
JOIN participan_partido pp
    ON pp.id_participante_partido = t.id_participante_partido
JOIN plantel_integrante pi
    ON pi.id_plantel_integrante = pp.id_plantel_integrante
JOIN persona per
    ON per.id_persona = pi.id_persona
JOIN plantel pl
    ON pl.id_plantel = pi.id_plantel
JOIN equipo e
    ON e.id_equipo = pl.id_equipo
JOIN partido p
    ON p.id_partido = t.id_partido
JOIN torneo tor
    ON tor.id_torneo = p.id_torneo
WHERE t.estado_tarjeta = 'VALIDA';

-- LUEGO: Total acumuladas por torneo (depende de la vista anterior)
CREATE OR REPLACE VIEW vw_tarjetas_acumuladas_torneo AS
SELECT
    id_torneo,
    torneo,
    id_persona,
    nombre_persona,
    apellido_persona,
    id_equipo,
    equipo,
    COUNT(*)                       AS total_tarjetas,
    SUM(verdes)                    AS total_verdes,
    SUM(amarillas)                 AS total_amarillas,
    SUM(rojas)                     AS total_rojas
FROM vw_tarjetas_detalle_torneo
GROUP BY
    id_torneo,
    torneo,
    id_persona,
    nombre_persona,
    apellido_persona,
    id_equipo,
    equipo;

    
-- =======================================================
-- vista de torneos activos + detalles
-- =======================================================

CREATE OR REPLACE VIEW vw_inscripciones_torneo_detalle AS
SELECT
    it.id_inscripcion,
    it.id_torneo,
    it.id_equipo,

    e.nombre        AS nombre_equipo,
    e.categoria     AS categoria_equipo,
    e.genero        AS genero_equipo,

    c.id_club,
    c.nombre        AS nombre_club,

    it.fecha_inscripcion,
    it.fecha_baja

FROM inscripcion_torneo it
JOIN equipo e ON e.id_equipo = it.id_equipo
JOIN club c   ON c.id_club   = e.id_club
WHERE it.fecha_baja IS NULL;

-- =======================================================
-- jugadores por club
-- =======================================================

-- Vista: Jugadores por club
CREATE OR REPLACE VIEW vista_jugadores_club AS
SELECT 
    c.id_club,
    c.nombre as club_nombre,
    p.id_persona,
    p.nombre,
    p.apellido,
    p.documento,
    p.fecha_nacimiento,
    p.genero,
    fr.fecha_inicio as fecha_fichaje,
    fr.creado_en,
    -- Último plantel activo
    (SELECT pl.nombre 
     FROM plantel_integrante pi
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE pi.id_persona = p.id_persona
       AND pi.rol_en_plantel = 'JUGADOR'
       AND pi.fecha_baja IS NULL
       AND pl.activo = TRUE
       AND pl.id_equipo IN (SELECT id_equipo FROM equipo WHERE id_club = c.id_club)
     LIMIT 1) as plantel_actual
FROM fichaje_rol fr
JOIN club c ON fr.id_club = c.id_club
JOIN persona p ON fr.id_persona = p.id_persona
WHERE fr.rol = 'JUGADOR'
  AND fr.activo = TRUE
  AND c.borrado_en IS NULL
  AND p.borrado_en IS NULL
ORDER BY c.nombre, p.apellido, p.nombre;

-- Vista: Personas disponibles para fichar (no tienen rol activo en ningún club)
CREATE OR REPLACE VIEW vista_personas_disponibles_fichaje AS
SELECT 
    p.id_persona,
    p.nombre,
    p.apellido,
    p.documento,
    pr.rol,
    pr.fecha_desde,
    pr.fecha_hasta
FROM persona p
JOIN persona_rol pr ON p.id_persona = pr.id_persona
WHERE (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= CURRENT_DATE)
  AND p.borrado_en IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM fichaje_rol fr
      WHERE fr.id_persona = p.id_persona
        AND fr.rol = pr.rol
        AND fr.activo = TRUE
        AND fr.fecha_fin IS NULL
  )
ORDER BY p.apellido, p.nombre, pr.rol;

-- =======================================================
-- vista club-personas-roles (desde fichaje y plantel)
-- =======================================================

CREATE OR REPLACE VIEW vw_club_personas_roles AS

-- =========================
-- ROLES DESDE FICHAJE
-- =========================
SELECT
    fr.id_club,
    p.id_persona,
    p.nombre,
    p.apellido,
    p.documento,

    fr.rol,
    'FICHAJE'::text AS origen_rol,

    NULL::INT AS id_equipo,
    NULL::INT AS id_plantel,

    fr.fecha_inicio,
    fr.fecha_fin,
    fr.activo
FROM fichaje_rol fr
JOIN persona p ON p.id_persona = fr.id_persona
WHERE fr.borrado_en IS NULL

UNION ALL

-- =========================
-- ROLES DESDE PLANTEL
-- =========================
SELECT
    c.id_club,
    p.id_persona,
    p.nombre,
    p.apellido,
    p.documento,
    pi.rol_en_plantel AS rol,
    'PLANTEL'::text AS origen_rol,
    e.id_equipo,
    pl.id_plantel,
    pi.fecha_alta AS fecha_inicio,
    pi.fecha_baja AS fecha_fin,
    (pi.fecha_baja IS NULL) AS activo
FROM plantel_integrante pi
JOIN plantel pl ON pl.id_plantel = pi.id_plantel
JOIN equipo e ON e.id_equipo = pl.id_equipo
JOIN club c ON c.id_club = e.id_club
JOIN persona p ON p.id_persona = pi.id_persona;



-- =====================================================
-- Vista: v_personas_roles_clubes
-- Propósito: Mostrar personas con sus roles y clubes actuales
--            para la visualización en frontend
-- =====================================================
CREATE OR REPLACE VIEW v_personas_roles_clubes AS
SELECT 
    p.id_persona,
    pr.id_persona_rol,
    p.nombre,
    p.apellido,
    pr.rol,

    -- Información del fichaje
    fr.activo AS fichaje_activo,
    fr.fecha_inicio AS fecha_fichaje,
    fr.fecha_fin AS fecha_fin_fichaje,

    -- Información del club
    c.id_club,
    c.nombre AS nombre_club,
    c.provincia AS provincia_club,
    c.ciudad AS ciudad_club,

    -- Estado del fichaje para mostrar
    CASE 
        WHEN fr.id_fichaje_rol IS NOT NULL THEN 'FICHADO'
        ELSE 'SIN_FICHAR'
    END AS estado_fichaje,

    -- Orden de roles por persona (fichado primero)
    ROW_NUMBER() OVER (
        PARTITION BY p.id_persona 
        ORDER BY 
            CASE 
                WHEN fr.id_fichaje_rol IS NOT NULL THEN 1
                ELSE 2
            END,
            fr.fecha_inicio DESC
    ) AS orden_roles

FROM persona p
INNER JOIN persona_rol pr 
    ON p.id_persona = pr.id_persona
   AND pr.fecha_hasta IS NULL

LEFT JOIN fichaje_rol fr 
    ON pr.id_persona_rol = fr.id_persona_rol
   AND fr.activo = TRUE
   AND fr.fecha_fin IS NULL

LEFT JOIN club c 
    ON fr.id_club = c.id_club

WHERE p.borrado_en IS NULL
  AND pr.fecha_desde <= CURRENT_DATE
  AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= CURRENT_DATE);


-- =====================================================
-- Vista: v_personas_frontend
-- Propósito: Vista simplificada para el frontend
-- Formato: Nombre, Apellido, Rol → Estado Fichaje
-- =====================================================

CREATE OR REPLACE VIEW v_personas_frontend AS
SELECT 
    p.nombre,
    p.apellido,
    pr.rol,
    COALESCE(c.nombre, 'Sin fichar') AS club_asignado,
    -- Para agrupar por persona
    p.id_persona
FROM persona p
INNER JOIN persona_rol pr ON p.id_persona = pr.id_persona
    AND pr.fecha_hasta IS NULL  -- Solo roles activos
LEFT JOIN fichaje_rol fr ON pr.id_persona_rol = fr.id_persona_rol
    AND fr.activo = TRUE  -- Solo fichajes activos
    AND fr.fecha_fin IS NULL
LEFT JOIN club c ON fr.id_club = c.id_club
WHERE p.borrado_en IS NULL
ORDER BY p.apellido, p.nombre, pr.rol;

-- ====================================
-- vista para obtener arbitros activos
-- ====================================

CREATE VIEW vista_arbitros_activos AS
SELECT 
    pr.id_persona_rol, 
    p.nombre, 
    p.apellido, 
    p.documento, 
    pr.rol 
FROM persona p
JOIN persona_rol pr ON p.id_persona = pr.id_persona
WHERE pr.rol = 'ARBITRO' 
  AND pr.fecha_hasta IS NULL;


-- =====================================================
-- vista_goleadores.sql
-- Goleadores por torneo (con totales en el torneo y total carrera)
-- =====================================================

CREATE OR REPLACE VIEW v_goleadores_torneo AS
WITH 
-- Goles válidos por jugador y torneo
goles_por_torneo AS (
    SELECT 
        p.id_persona,
        p.nombre,
        p.apellido,
        p.documento,
        t.id_torneo,
        t.nombre AS nombre_torneo,
        t.categoria,
        t.genero,
        t.fecha_inicio,
        t.fecha_fin,
        c.id_club,
        c.nombre AS nombre_club,
        eq.id_equipo,
        eq.nombre AS nombre_equipo,
        COUNT(g.id_gol) AS goles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_en_torneo,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = FALSE) AS goles_netos_en_torneo
    FROM gol g
    INNER JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
    INNER JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
    INNER JOIN persona p ON pi.id_persona = p.id_persona
    INNER JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    INNER JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    INNER JOIN club c ON eq.id_club = c.id_club
    INNER JOIN partido pa ON g.id_partido = pa.id_partido
    INNER JOIN torneo t ON pa.id_torneo = t.id_torneo
    WHERE g.estado_gol = 'VALIDO'
      AND (pi.fecha_baja IS NULL OR pi.fecha_baja > pa.fecha)
      AND (t.borrado_en IS NULL)
    GROUP BY p.id_persona, p.nombre, p.apellido, p.documento,
             t.id_torneo, t.nombre, t.categoria, t.genero, t.fecha_inicio, t.fecha_fin,
             c.id_club, c.nombre, eq.id_equipo, eq.nombre
),
-- Goles totales en la carrera del jugador (válidos)
goles_carrera AS (
    SELECT 
        p.id_persona,
        COUNT(g.id_gol) AS goles_totales_carrera,
        COUNT(g.id_gol) FILTER (WHERE g.es_autogol = TRUE) AS autogoles_totales_carrera,
        COUNT(DISTINCT t.id_torneo) AS torneos_disputados
    FROM persona p
    LEFT JOIN plantel_integrante pi ON p.id_persona = pi.id_persona
    LEFT JOIN participan_partido pp ON pi.id_plantel_integrante = pp.id_plantel_integrante
    LEFT JOIN gol g ON pp.id_participante_partido = g.id_participante_partido 
        AND g.estado_gol = 'VALIDO'
    LEFT JOIN partido pa ON g.id_partido = pa.id_partido
    LEFT JOIN torneo t ON pa.id_torneo = t.id_torneo AND t.borrado_en IS NULL
    WHERE p.borrado_en IS NULL
    GROUP BY p.id_persona
)
SELECT 
    gt.id_persona,
    gt.nombre,
    gt.apellido,
    gt.documento,
    gt.id_torneo,
    gt.nombre_torneo,
    gt.categoria,
    gt.genero,
    gt.fecha_inicio,
    gt.fecha_fin,
    gt.id_club,
    gt.nombre_club,
    gt.id_equipo,
    gt.nombre_equipo,
    gt.goles_en_torneo,
    gt.autogoles_en_torneo,
    gt.goles_netos_en_torneo,
    COALESCE(gc.goles_totales_carrera, 0) AS goles_totales_carrera,
    COALESCE(gc.autogoles_totales_carrera, 0) AS autogoles_totales_carrera,
    COALESCE(gc.torneos_disputados, 0) AS torneos_disputados,
    -- Ranking en el torneo actual
    RANK() OVER (PARTITION BY gt.id_torneo ORDER BY gt.goles_netos_en_torneo DESC) AS ranking_en_torneo
FROM goles_por_torneo gt
LEFT JOIN goles_carrera gc ON gt.id_persona = gc.id_persona;

-- =======================================
-- Vista partidos detallados
-- =======================================

CREATE OR REPLACE VIEW vw_partidos_detallados AS
SELECT
    p.id_partido,
    p.id_torneo,
    t.nombre AS nombre_torneo,
    p.fecha,
    p.horario,
    p.ubicacion,
    p.numero_fecha,
    p.observaciones,
    p.creado_por,
    p.creado_en,
    
    -- Equipos
    el.nombre AS equipo_local_nombre,
    ev.nombre AS equipo_visitante_nombre,

    -- Marcador Final
    COALESCE((SELECT COUNT(*) FROM gol g JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol) OR (pl.id_equipo = itv.id_equipo AND g.es_autogol))), 0) AS goles_local,
    COALESCE((SELECT COUNT(*) FROM gol g JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante JOIN plantel pl ON pi.id_plantel = pl.id_plantel
              WHERE g.id_partido = p.id_partido AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol) OR (pl.id_equipo = itl.id_equipo AND g.es_autogol))), 0) AS goles_visitante,

    -- LISTADO DE JUGADORES (Apellido|Nombre|Camiseta)
    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || pp.numero_camiseta, '; ' ORDER BY pp.numero_camiseta ASC)
     FROM participan_partido pp
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_jugadores_local,

    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || pp.numero_camiseta, '; ' ORDER BY pp.numero_camiseta ASC)
     FROM participan_partido pp
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE pp.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_jugadores_visitante,

    -- DETALLE GOLES LOCAL
    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
     FROM gol g 
     JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE g.id_partido = p.id_partido 
     AND ((pl.id_equipo = itl.id_equipo AND NOT g.es_autogol) OR (pl.id_equipo = itv.id_equipo AND g.es_autogol))) AS lista_goles_local,

    -- DETALLE TARJETAS LOCAL
    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
     FROM tarjeta tj
     JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itl.id_equipo) AS lista_tarjetas_local,

    -- DETALLE GOLES VISITANTE
    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || g.minuto || '|' || g.cuarto || '|' || g.es_autogol::text, '; ')
     FROM gol g 
     JOIN participan_partido pp ON g.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE g.id_partido = p.id_partido 
     AND ((pl.id_equipo = itv.id_equipo AND NOT g.es_autogol) OR (pl.id_equipo = itl.id_equipo AND g.es_autogol))) AS lista_goles_visitante,

    -- DETALLE TARJETAS VISITANTE
    (SELECT string_agg(per.apellido || '|' || per.nombre || '|' || tj.minuto || '|' || tj.cuarto || '|' || tj.tipo::text, '; ')
     FROM tarjeta tj
     JOIN participan_partido pp ON tj.id_participante_partido = pp.id_participante_partido
     JOIN plantel_integrante pi ON pp.id_plantel_integrante = pi.id_plantel_integrante
     JOIN persona per ON pi.id_persona = per.id_persona
     JOIN plantel pl ON pi.id_plantel = pl.id_plantel
     WHERE tj.id_partido = p.id_partido AND pl.id_equipo = itv.id_equipo) AS lista_tarjetas_visitante

FROM partido p
JOIN torneo t ON p.id_torneo = t.id_torneo
JOIN inscripcion_torneo itl ON p.id_inscripcion_local = itl.id_inscripcion
JOIN equipo el ON itl.id_equipo = el.id_equipo
JOIN inscripcion_torneo itv ON p.id_inscripcion_visitante = itv.id_inscripcion
JOIN equipo ev ON itv.id_equipo = ev.id_equipo;


COMMIT;