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
-- 2. PLANTELES CON INTEGRANTES
-- =====================================================

CREATE OR REPLACE VIEW vw_plantel_integrantes AS
SELECT
    pl.id_plantel,
    e.id_equipo,
    e.nombre AS nombre_equipo,
    pi.id_plantel_integrante,
    pi.id_persona,
    p.nombre,
    p.apellido,
    pi.rol_en_plantel,
    pi.numero_camiseta,
    pi.fecha_alta,
    pi.fecha_baja
FROM plantel pl
JOIN equipo e
  ON e.id_equipo = pl.id_equipo
JOIN plantel_integrante pi
  ON pi.id_plantel = pl.id_plantel
JOIN persona p
  ON p.id_persona = pi.id_persona;


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

-- ==========================================
-- vista Integrantes de un plantel activo
-- ==========================================

CREATE VIEW vw_plantel_activo_integrantes AS
SELECT
    p.id_equipo,
    pl.id_plantel,
    pi.id_plantel_integrante,

    pi.rol_en_plantel,
    pi.numero_camiseta,
    pi.fecha_alta,
    pi.fecha_baja,

    per.id_persona,
    per.nombre,
    per.apellido,
    per.documento
FROM plantel pl
JOIN plantel_integrante pi ON pi.id_plantel = pl.id_plantel
JOIN persona per ON per.id_persona = pi.id_persona
JOIN equipo p ON p.id_equipo = pl.id_equipo
WHERE
    pl.activo = true
    AND pi.fecha_baja IS NULL;



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


COMMIT;