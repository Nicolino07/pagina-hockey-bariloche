

-- =====================================================
-- 009_indexes.sql
-- Índices del sistema (performance + reglas de negocio)
-- =====================================================

BEGIN;

-- =====================================================
-- CLUB
-- =====================================================
-- Búsquedas por ubicación
CREATE INDEX idx_club_provincia
ON club (provincia);

CREATE INDEX idx_club_ciudad
ON club (ciudad);

-- =====================================================
-- EQUIPO
-- =====================================================
CREATE INDEX idx_equipo_club
ON equipo (id_club);

CREATE INDEX idx_equipo_categoria_genero
ON equipo (categoria, genero);

-- =====================================================
-- PERSONA
-- =====================================================
CREATE INDEX idx_persona_apellido_nombre
ON persona (apellido, nombre);

CREATE INDEX idx_persona_documento
ON persona (documento);

-- =====================================================
-- PERSONA_ROL
-- =====================================================
CREATE INDEX idx_persona_rol_persona
ON persona_rol (id_persona);

CREATE INDEX idx_persona_rol_rol
ON persona_rol (rol);

-- Roles vigentes
CREATE INDEX idx_persona_rol_activo
ON persona_rol (id_persona, rol)
WHERE fecha_hasta IS NULL;

-- =====================================================
-- FICHAJE_ROL
-- =====================================================
-- FK lookups
CREATE INDEX idx_fichaje_persona
ON fichaje_rol (id_persona);

CREATE INDEX idx_fichaje_club
ON fichaje_rol (id_club);

CREATE INDEX idx_fichaje_rol
ON fichaje_rol (rol);

-- Fichajes activos (consultas más comunes)
CREATE INDEX idx_fichaje_activo
ON fichaje_rol (id_persona, id_club, rol)
WHERE activo = TRUE AND fecha_fin IS NULL;

-- =====================================================
-- PLANTEL
-- =====================================================
CREATE INDEX idx_plantel_equipo
ON plantel (id_equipo);

CREATE INDEX idx_plantel_activo
ON plantel (id_equipo)
WHERE activo = TRUE;

-- =====================================================
-- PLANTEL_INTEGRANTE
-- =====================================================
CREATE INDEX idx_plantel_integrante_plantel
ON plantel_integrante (id_plantel);

CREATE INDEX idx_plantel_integrante_persona
ON plantel_integrante (id_persona);

-- =====================================================
-- INSCRIPCION_TORNEO
-- =====================================================
CREATE INDEX idx_inscripcion_torneo
ON inscripcion_torneo (id_torneo);

CREATE INDEX idx_inscripcion_equipo
ON inscripcion_torneo (id_equipo);

-- =====================================================
-- FASE
-- =====================================================
CREATE INDEX idx_fase_torneo
ON fase (id_torneo);

CREATE INDEX idx_fase_orden
ON fase (id_torneo, orden);

-- =====================================================
-- PARTIDO
-- =====================================================
CREATE INDEX idx_partido_torneo_fecha
ON partido (id_torneo, fecha);

CREATE INDEX idx_partido_fase
ON partido (id_fase);

CREATE INDEX idx_partido_estado
ON partido (estado_partido);

-- =====================================================
-- PARTICIPAN_PARTIDO
-- =====================================================
CREATE INDEX idx_participan_partido
ON participan_partido (id_partido);

CREATE INDEX idx_participan_jugador
ON participan_partido (id_plantel_integrante);

-- =====================================================
-- GOL
-- =====================================================
CREATE INDEX idx_gol_partido
ON gol (id_partido);

CREATE INDEX idx_gol_participante
ON gol (id_participante_partido);

-- =====================================================
-- TARJETA
-- =====================================================
CREATE INDEX idx_tarjeta_partido
ON tarjeta (id_partido);

CREATE INDEX idx_tarjeta_participante
ON tarjeta (id_participante_partido);

CREATE INDEX idx_tarjeta_tipo
ON tarjeta (tipo);

-- =====================================================
-- SUSPENSION
-- =====================================================
CREATE INDEX idx_suspension_persona_rol
ON suspension (id_persona_rol);

CREATE INDEX idx_suspension_torneo
ON suspension (id_torneo);

CREATE INDEX idx_suspension_estado
ON suspension (estado_suspension);

-- =====================================================
-- POSICION
-- =====================================================
CREATE INDEX idx_posicion_torneo
ON posicion (id_torneo);

-- =====================================================
-- USUARIO
-- =====================================================
CREATE INDEX idx_usuario_activo
ON usuario (activo);

-- =====================================================
-- REFRESH_TOKEN
-- =====================================================

CREATE INDEX idx_refresh_token_hash
ON refresh_token (token_hash);

CREATE INDEX idx_refresh_token_usuario
ON refresh_token (id_usuario);

CREATE INDEX idx_refresh_token_expires
ON refresh_token (expires_at);

-- =====================================================
-- FIXTURE
-- =====================================================
CREATE INDEX idx_fixture_fecha_torneo
ON fixture_fecha (id_torneo);

CREATE INDEX idx_fixture_partido_fecha
ON fixture_partido (id_fixture_fecha);

COMMIT;

