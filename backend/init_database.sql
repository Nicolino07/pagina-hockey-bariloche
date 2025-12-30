
-- ================================================
-- TIPOS ENUM PARA ESTANDARIZACIÓN
-- ================================================

CREATE TYPE genero_persona_tipo AS ENUM ('Masculino', 'Femenino');
CREATE TYPE genero_competencia_tipo AS ENUM ('Masculino', 'Femenino', 'Mixto');
CREATE TYPE categoria_tipo AS ENUM ('A', 'B', 'Sub 19', 'Sub 16', 'Sub 14', 'Sub 12');

CREATE TYPE rol_persona_tipo AS ENUM ('jugador', 'entrenador', 'arbitro');
CREATE TYPE rol_plantel_tipo AS ENUM ('jugador', 'entrenador');

CREATE TYPE tipo_tarjeta_enum AS ENUM ('verde', 'amarilla', 'roja');
CREATE TYPE tipo_suspension_enum AS ENUM ('por_partidos', 'por_fecha');
CREATE TYPE referencia_gol_enum AS ENUM ('GJ', 'GC', 'GP', 'DP');
CREATE TYPE tipo_fase_enum AS ENUM ('liga', 'eliminacion', 'grupos');


-- ================================================
-- INICIO: CREACIÓN DE TABLAS 
-- ================================================

-- -------------------------
-- TABLA: club
-- -------------------------
CREATE TABLE IF NOT EXISTS club (
    id_club        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    provincia      VARCHAR(100) NOT NULL CHECK(provincia <> ''),
    ciudad         VARCHAR(100) NOT NULL CHECK(ciudad <> ''),
    direccion      VARCHAR(200),
    telefono       VARCHAR(20),
    email          VARCHAR(100),
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT club_unq_nombre_ciudad UNIQUE (nombre, ciudad)
);


-- -------------------------
-- TABLA: equipo
-- -------------------------
CREATE TABLE IF NOT EXISTS equipo (
    id_equipo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    id_club        INT NOT NULL REFERENCES club(id_club) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria      categoria_tipo NOT NULL,
    genero         genero_competencia_tipo NOT NULL,
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);


-- -------------------------
-- TABLA: persona
-- -------------------------
CREATE TABLE IF NOT EXISTS persona (
    id_persona          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni                 INT CHECK(dni > 0) UNIQUE,
    nombre              VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    apellido            VARCHAR(100) NOT NULL CHECK(apellido <> ''),
    fecha_nacimiento    DATE,
    genero              genero_persona_tipo NOT NULL,
    telefono            VARCHAR(20),
    email               VARCHAR(100),
    direccion           VARCHAR(200),
    
    -- Campos de auditoría
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por          VARCHAR(100),
    actualizado_por     VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS persona_rol (
  id_persona_rol  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_persona      INT NOT NULL REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE CASCADE,
  rol             rol_persona_tipo NOT NULL,
  fecha_desde     DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_hasta     DATE,
  
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por      VARCHAR(100),
  actualizado_por VARCHAR(100),

  CHECK (fecha_hasta IS NULL OR fecha_hasta > fecha_desde)
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_persona_rol_activo
ON persona_rol (id_persona, rol)
WHERE fecha_hasta IS NULL;




-- -------------------------
-- TABLA: torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS torneo (
    id_torneo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    categoria      categoria_tipo NOT NULL,
    genero         genero_competencia_tipo NOT NULL,
    fecha_inicio   DATE DEFAULT CURRENT_DATE,
    fecha_fin      DATE CHECK (fecha_fin > fecha_inicio),
    activo         BOOLEAN DEFAULT TRUE,
    
    -- Campos de auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT torneo_nombre_cat UNIQUE (nombre, categoria)
);

-- -------------------------
-- TABLA: inscripcion_torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS inscripcion_torneo (
    id_inscripcion      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo           INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo           INT NOT NULL REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    genero              genero_competencia_tipo NOT NULL,
    fecha_inscripcion   DATE DEFAULT CURRENT_DATE,
    
    -- Campos de auditoría
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por          VARCHAR(100),
    actualizado_por     VARCHAR(100),

    CONSTRAINT inscripcion_equipo_torneo_unq UNIQUE (id_equipo, id_torneo)
);

-- -------------------------
-- TABLA: plantel
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel (
    id_plantel      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo       INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo       INT NOT NULL REFERENCES torneo(id_torneo),
    fecha_creacion  DATE DEFAULT CURRENT_DATE,
    
    -- Campos de auditoría
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),
    
    -- Un plantel por equipo-torneo
    UNIQUE(id_equipo, id_torneo)  
);

-- -------------------------
-- TABLA: plantel_integrante
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel_integrante (
    id_plantel_integrante   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_plantel              INT NOT NULL REFERENCES plantel(id_plantel) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_persona              INT NOT NULL REFERENCES persona(id_persona),
    rol_en_plantel          rol_plantel_tipo NOT NULL,
    numero_camiseta         INT,                -- referencia (opcional) de número de camiseta
    fecha_alta              DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_baja              DATE CHECK (fecha_baja > fecha_alta),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    CONSTRAINT unq_plantel_persona_rol UNIQUE (id_plantel, id_persona, rol_en_plantel),
    -- integrante del plantel solo puede ser jugador o entrenador (nunca arbitro)
    CONSTRAINT chk_jugador_entrenador CHECK (rol_en_plantel = 'jugador' OR rol_en_plantel = 'entrenador')
);

-- -------------------------
-- TABLA: fase
-- -------------------------
CREATE TABLE IF NOT EXISTS fase (
    id_fase         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo       INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre          VARCHAR(50) NOT NULL CHECK(nombre <> ''),
    tipo            tipo_fase_enum NOT NULL,
    orden           INT,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    
    -- Campos de auditoría
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- -------------------------
-- TABLA: partido
-- -------------------------
CREATE TABLE IF NOT EXISTS partido (
    id_partido                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo                  INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    id_fase                    INT REFERENCES fase(id_fase),
    fecha                      DATE DEFAULT CURRENT_DATE,
    horario                    TIME,
    id_local                   INT NOT NULL REFERENCES equipo(id_equipo),
    id_visitante               INT NOT NULL REFERENCES equipo(id_equipo),
    goles_local                INT DEFAULT 0,
    goles_visitante            INT DEFAULT 0,
    id_arbitro1                INT REFERENCES persona(id_persona),
    id_arbitro2                INT REFERENCES persona(id_persona),
    id_capitan_local           INT REFERENCES plantel_integrante(id_plantel_integrante),
    id_capitan_visitante       INT REFERENCES plantel_integrante(id_plantel_integrante),
    juez_mesa_local            VARCHAR(100),
    juez_mesa_visitante        VARCHAR(100),
    ubicacion                  VARCHAR(200),
    observaciones              VARCHAR(1000),
    tipo_fase                  tipo_fase_enum NOT NULL DEFAULT 'liga',
    numero_fecha               INT,
    
    -- Campos de auditoría
    creado_en                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por                 VARCHAR(100),
    actualizado_por            VARCHAR(100),
    confirmado_por             VARCHAR(100),
    confirmado_en              TIMESTAMP,
    
    CONSTRAINT chk_arbitros_distintos CHECK (id_arbitro1 <> id_arbitro2),
    CONSTRAINT chk_equipos_distintos CHECK (id_local <> id_visitante)
);

-- -------------------------
-- TABLA: participan_partido
-- -------------------------
CREATE TABLE IF NOT EXISTS participan_partido (
    id_participante_partido INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_plantel_integrante   INT NOT NULL REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE CASCADE,
    numero_camiseta         INT CHECK (numero_camiseta > 0),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    -- Asegura que un jugador/entrenador no se registre dos veces para el mismo partido
    CONSTRAINT unq_jugador_partido UNIQUE (id_partido, id_plantel_integrante)
);

-- -------------------------
-- TABLA: gol
-- -------------------------
CREATE TABLE IF NOT EXISTS gol (
    id_gol                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON UPDATE CASCADE ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido) ON UPDATE CASCADE ON DELETE CASCADE,
    minuto                  INT CHECK (minuto >= 0),
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    -- GJ = Gol jugada, GC = Gol corner corto, GP = Gol penal, DP = Definición penales
    referencia_gol          referencia_gol_enum,
    es_autogol              BOOLEAN DEFAULT FALSE,
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Para anular goles (ej. por VAR)
    anulado                 BOOLEAN DEFAULT FALSE,
    anulado_por             VARCHAR(100),
    anulado_en              TIMESTAMP,
    motivo_anulacion        VARCHAR(500)
);

-- -------------------------
-- TABLA: tarjeta
-- -------------------------
CREATE TABLE IF NOT EXISTS tarjeta (
    id_tarjeta              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido),
    tipo                    tipo_tarjeta_enum NOT NULL,
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones           VARCHAR(500),
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Para apelaciones o revisiones
    revisada                BOOLEAN DEFAULT FALSE,
    revisada_por            VARCHAR(100),
    revisada_en             TIMESTAMP,
    decision_revision       VARCHAR(200)
);

-- -------------------------
-- TABLA: suspension
-- -------------------------
CREATE TABLE IF NOT EXISTS suspension (
    id_suspension           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_persona              INT NOT NULL REFERENCES persona(id_persona),
    id_torneo               INT NOT NULL REFERENCES torneo(id_torneo),
    id_partido_origen       INT REFERENCES partido(id_partido), -- Partido que generó la suspensión
    tipo_suspension         tipo_suspension_enum NOT NULL,
    motivo                  VARCHAR(500) NOT NULL CHECK(motivo <> ''),
    fechas_suspension       INT, -- cuántos partidos debe cumplir (NULL si tipo = por_fecha)
    fecha_fin_suspension    DATE NULL, -- fecha hasta la cual dura la suspensión (NULL si tipo = por_partidos)
    cumplidas               INT NOT NULL DEFAULT 0,
    activa                  BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Campos de auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),
    
    -- Tracking de partidos cumplidos
    partidos_cumplidos      INT[] DEFAULT '{}', -- IDs de partidos ya cumplidos
 
);

-- -------------------------
-- TABLA: posicion
-- -------------------------
CREATE TABLE IF NOT EXISTS posicion (
    id_posicion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo            INT NOT NULL REFERENCES torneo(id_torneo),
    id_equipo            INT NOT NULL REFERENCES equipo(id_equipo),
    puntos               INT DEFAULT 0,
    partidos_jugados     INT DEFAULT 0,
    ganados              INT DEFAULT 0,
    empatados            INT DEFAULT 0,
    perdidos             INT DEFAULT 0,
    goles_a_favor        INT DEFAULT 0,
    goles_en_contra      INT DEFAULT 0,
    diferencia_gol       INT GENERATED ALWAYS AS (goles_a_favor - goles_en_contra) STORED,
    
    -- Campos de auditoría
    creado_en            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por           VARCHAR(100),
    actualizado_por      VARCHAR(100),
    
    CONSTRAINT posicion_equipo_torneo_unq UNIQUE (id_torneo, id_equipo)
);

-- ================================================
-- TABLA DE AUDITORÍA GENERAL 
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_log               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada       VARCHAR(100) NOT NULL,
    id_registro          INT,
    operacion            VARCHAR(20) CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores   JSONB,
    valores_nuevos       JSONB,
    usuario              VARCHAR(100),
    fecha_hora           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address           INET,
    user_agent           TEXT
);


-- ================================================
-- FIN DE TABLAS
-- ================================================


-- ================================================
-- ÍNDICES 
-- ================================================


-- PERSONA
CREATE INDEX IF NOT EXISTS idx_persona_dni
    ON persona(dni);

CREATE INDEX IF NOT EXISTS idx_persona_nombre_apellido
    ON persona(nombre, apellido);

-- PERSONA_ROL
CREATE INDEX IF NOT EXISTS idx_persona_rol_persona
    ON persona_rol(id_persona);

CREATE INDEX IF NOT EXISTS idx_persona_rol_rol
    ON persona_rol(rol);

CREATE INDEX IF NOT EXISTS idx_persona_rol_activo
    ON persona_rol(id_persona)
    WHERE fecha_hasta IS NULL;

-- EQUIPO / PLANTEL
CREATE INDEX IF NOT EXISTS idx_equipo_club
    ON equipo(id_club);

CREATE INDEX IF NOT EXISTS idx_plantel_equipo
    ON plantel(id_equipo);

-- PLANTEL_INTEGRANTE
CREATE INDEX IF NOT EXISTS idx_pi_plantel
    ON plantel_integrante(id_plantel);

CREATE INDEX IF NOT EXISTS idx_pi_persona
    ON plantel_integrante(id_persona);

CREATE INDEX IF NOT EXISTS idx_pi_rol
    ON plantel_integrante(rol_en_plantel);

CREATE INDEX IF NOT EXISTS idx_pi_fecha_baja
    ON plantel_integrante(fecha_baja);

-- PARTIDO
CREATE INDEX IF NOT EXISTS idx_partido_torneo_fecha
    ON partido(id_torneo, fecha);

CREATE INDEX IF NOT EXISTS idx_partido_local
    ON partido(id_local);

CREATE INDEX IF NOT EXISTS idx_partido_visitante
    ON partido(id_visitante);

-- INSCRIPCIONES
CREATE INDEX IF NOT EXISTS idx_inscripcion_torneo
    ON inscripcion_torneo(id_torneo);

CREATE INDEX IF NOT EXISTS idx_inscripcion_equipo
    ON inscripcion_torneo(id_equipo);

-- PARTICIPANTES
CREATE INDEX IF NOT EXISTS idx_participacion_partido
    ON participan_partido(id_partido);

CREATE INDEX IF NOT EXISTS idx_participante_integrante
    ON participan_partido(id_plantel_integrante);

-- GOLES / TARJETAS
CREATE INDEX IF NOT EXISTS idx_gol_partido
    ON gol(id_partido);

CREATE INDEX IF NOT EXISTS idx_tarjeta_partido
    ON tarjeta(id_partido);

-- POSICIONES
CREATE INDEX IF NOT EXISTS idx_posicion_torneo
    ON posicion(id_torneo);

-- SUSPENSIONES
CREATE INDEX IF NOT EXISTS idx_susp_persona
    ON suspension(id_persona);

CREATE INDEX IF NOT EXISTS idx_susp_torneo
    ON suspension(id_torneo);

CREATE INDEX IF NOT EXISTS idx_susp_persona_activa
    ON suspension(id_persona)
    WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_susp_fin
    ON suspension(fecha_fin_suspension);

-- Para búsqueda de jugadores por equipo-torneo (common query)
CREATE INDEX IF NOT EXISTS idx_plantel_integrante_plantel_rol
    ON plantel_integrante(id_plantel, rol_en_plantel, fecha_baja);

-- Para consultas de partidos por fecha (calendarios)
CREATE INDEX IF NOT EXISTS idx_partido_fecha_horario
    ON partido(fecha, horario);

-- Para estadísticas rápidas
CREATE INDEX IF NOT EXISTS idx_gol_jugador
    ON gol(id_participante_partido, anulado);

-- ================================================
-- ÍNDICES PARA AUDITORÍA
-- ================================================

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fecha 
    ON auditoria_log(tabla_afectada, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario 
    ON auditoria_log(usuario, fecha_hora);

CREATE INDEX IF NOT EXISTS idx_auditoria_operacion 
    ON auditoria_log(operacion, fecha_hora);


-- Índices para campos de auditoría frecuentemente consultados
CREATE INDEX IF NOT EXISTS idx_creado_en_partido 
    ON partido(creado_en);

CREATE INDEX IF NOT EXISTS idx_actualizado_en_partido 
    ON partido(actualizado_en);

CREATE INDEX IF NOT EXISTS idx_confirmado_en_partido 
    ON partido(confirmado_en);

CREATE INDEX IF NOT EXISTS idx_creado_por_partido 
    ON partido(creado_por);

-- Índices para suspensiones mejorados
CREATE INDEX IF NOT EXISTS idx_susp_activa_fecha 
    ON suspension(activa, fecha_fin_suspension);

-- ================================================
-- FIN DE ÍNDICES
-- ================================================


-- ================================================
-- VISTAS PARA AUDITORÍA 
-- ================================================

CREATE OR REPLACE VIEW v_auditoria_reciente AS
SELECT 
    tabla_afectada,
    operacion,
    usuario,
    COUNT(*) as cantidad,
    MAX(fecha_hora) as ultima_operacion
FROM auditoria_log
WHERE fecha_hora >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY tabla_afectada, operacion, usuario
ORDER BY ultima_operacion DESC;

CREATE OR REPLACE VIEW v_cambios_partidos AS
SELECT 
    p.id_partido,
    p.id_local,
    p.id_visitante,
    p.fecha,
    al.usuario,
    al.operacion,
    al.fecha_hora as cuando
FROM partido p
JOIN auditoria_log al ON al.id_registro = p.id_partido AND al.tabla_afectada = 'partido'
WHERE al.fecha_hora >= CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY al.fecha_hora DESC;


