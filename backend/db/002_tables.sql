-- =====================================================
-- 002_tables.sql
-- Creación de tablas base del sistema (CORREGIDA)
-- =====================================================

BEGIN;

-- ======================
-- CLUB
-- ======================

CREATE TABLE IF NOT EXISTS club (
    id_club        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    provincia      VARCHAR(100) NOT NULL CHECK (provincia <> ''),
    ciudad         VARCHAR(100) NOT NULL CHECK (ciudad <> ''),
    direccion      VARCHAR(200),
    telefono       VARCHAR(20),
    email          VARCHAR(100),

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT club_unq_nombre_ciudad UNIQUE (nombre, ciudad)
);

-- ======================
-- EQUIPO
-- ======================

CREATE TABLE IF NOT EXISTS equipo (
    id_equipo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    id_club        INT NOT NULL 
        REFERENCES club(id_club) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria      categoria_tipo NOT NULL,
    genero         genero_competencia_tipo NOT NULL,

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);

-- ======================
-- PERSONA
-- ======================

CREATE TABLE IF NOT EXISTS persona (
    id_persona       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni              INT UNIQUE CHECK (dni > 0),
    nombre           VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    apellido         VARCHAR(100) NOT NULL CHECK (apellido <> ''),
    fecha_nacimiento DATE,
    genero           genero_persona_tipo NOT NULL,
    telefono         VARCHAR(20),
    email            VARCHAR(100),
    direccion        VARCHAR(200),

    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por       VARCHAR(100),
    actualizado_por  VARCHAR(100)
);

-- ======================
-- PERSONA_ROL
-- ======================

CREATE TABLE IF NOT EXISTS persona_rol (
    id_persona_rol INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_persona     INT NOT NULL 
        REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE CASCADE,
    rol            rol_persona_tipo NOT NULL,
    fecha_desde    DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_hasta    DATE,

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CHECK (fecha_hasta IS NULL OR fecha_hasta > fecha_desde)
);

-- ======================
-- TORNEO
-- ======================

CREATE TABLE IF NOT EXISTS torneo (
    id_torneo     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    categoria     categoria_tipo NOT NULL,
    genero        genero_competencia_tipo NOT NULL,
    fecha_inicio  DATE DEFAULT CURRENT_DATE,
    fecha_fin     DATE CHECK (fecha_fin > fecha_inicio),
    activo        BOOLEAN DEFAULT TRUE,

    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por    VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT torneo_unq_nombre_categoria UNIQUE (nombre, categoria)
);

-- ======================
-- INSCRIPCION_TORNEO
-- ======================

CREATE TABLE IF NOT EXISTS inscripcion_torneo (
    id_inscripcion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo      INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo      INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    genero         genero_competencia_tipo NOT NULL,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT unq_equipo_torneo UNIQUE (id_equipo, id_torneo)
);

-- ======================
-- PLANTEL
-- ======================

CREATE TABLE IF NOT EXISTS plantel (
    id_plantel    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo     INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo     INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_creacion DATE DEFAULT CURRENT_DATE,

    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por    VARCHAR(100),
    actualizado_por VARCHAR(100),

    UNIQUE (id_equipo, id_torneo)
);

-- ======================
-- PLANTEL_INTEGRANTE
-- ======================

CREATE TABLE IF NOT EXISTS plantel_integrante (
    id_plantel_integrante INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_plantel            INT NOT NULL 
        REFERENCES plantel(id_plantel) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_persona            INT NOT NULL 
        REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE RESTRICT,
    rol_en_plantel        rol_plantel_tipo NOT NULL,
    numero_camiseta       INT CHECK (numero_camiseta > 0),
    fecha_alta            DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_baja            DATE,

    creado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por            VARCHAR(100),
    actualizado_por       VARCHAR(100),

    CONSTRAINT unq_plantel_persona_rol UNIQUE (id_plantel, id_persona, rol_en_plantel),
    CHECK (fecha_baja IS NULL OR fecha_baja > fecha_alta),
    
    CONSTRAINT chk_jugador_entrenador CHECK (
        rol_en_plantel IN ('jugador', 'entrenador')
    ),

    CONSTRAINT unq_plantel_persona UNIQUE (id_plantel, id_persona)
);

-- ======================
-- FASE
-- ======================

CREATE TABLE IF NOT EXISTS fase (
    id_fase       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo     INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE CASCADE,
    nombre        VARCHAR(50) NOT NULL CHECK (nombre <> ''),
    tipo          tipo_fase_enum NOT NULL,
    orden         INT,
    fecha_inicio  DATE,
    fecha_fin     DATE,

    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por    VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- ======================
-- PARTIDO (COMPLETA)
-- ======================

CREATE TABLE IF NOT EXISTS partido (
    id_partido     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo      INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE CASCADE,
    id_fase        INT 
        REFERENCES fase(id_fase) ON UPDATE CASCADE ON DELETE SET NULL,
    
    fecha          DATE DEFAULT CURRENT_DATE,
    horario        TIME,

    id_local       INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_visitante   INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,

    goles_local    INT DEFAULT 0 CHECK (goles_local >= 0),
    goles_visitante INT DEFAULT 0 CHECK (goles_visitante >= 0),

    -- Arbitraje
    id_arbitro1    INT REFERENCES persona(id_persona),
    id_arbitro2    INT REFERENCES persona(id_persona),
    
    -- Capitanes
    id_capitan_local INT REFERENCES plantel_integrante(id_plantel_integrante),
    id_capitan_visitante INT REFERENCES plantel_integrante(id_plantel_integrante),
    
    -- Jueces de mesa
    juez_mesa_local VARCHAR(100),
    juez_mesa_visitante VARCHAR(100),
    
    -- Ubicación y observaciones
    ubicacion      VARCHAR(200),
    observaciones  VARCHAR(1000),
    numero_fecha   INT,

    -- Confirmación
    confirmado_por VARCHAR(100),
    confirmado_en  TIMESTAMP,

    -- Auditoría
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    -- Constraints
    CONSTRAINT chk_equipos_distintos CHECK (id_local <> id_visitante),
    CONSTRAINT chk_arbitros_distintos CHECK (
        id_arbitro1 IS DISTINCT FROM id_arbitro2
    ),
    CONSTRAINT chk_capitanes_distintos CHECK (
        id_capitan_local IS DISTINCT FROM id_capitan_visitante
    ),
    CONSTRAINT partido_unq_equipo_fecha UNIQUE (
        id_torneo, fecha, id_local, id_visitante
    )
);

-- ======================
-- PARTICIPAN_PARTIDO
-- ======================

CREATE TABLE IF NOT EXISTS participan_partido (
    id_participante_partido INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL 
        REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_plantel_integrante   INT NOT NULL 
        REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE CASCADE,
    numero_camiseta         INT CHECK (numero_camiseta > 0),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    CONSTRAINT unq_jugador_partido UNIQUE (id_partido, id_plantel_integrante)
);

-- ======================
-- GOL
-- ======================

CREATE TABLE IF NOT EXISTS gol (
    id_gol                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL 
        REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL 
        REFERENCES participan_partido(id_participante_partido) ON DELETE CASCADE,
    
    minuto                  INT CHECK (minuto >= 0),
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    referencia_gol          referencia_gol_enum,
    es_autogol              BOOLEAN DEFAULT FALSE,
    
    -- Anulación (ej: por VAR)
    anulado                 BOOLEAN DEFAULT FALSE,
    anulado_por             VARCHAR(100),
    anulado_en              TIMESTAMP,
    motivo_anulacion        VARCHAR(500),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100)
);

-- ======================
-- TARJETA
-- ======================

CREATE TABLE IF NOT EXISTS tarjeta (
    id_tarjeta              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_partido              INT NOT NULL 
        REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL 
        REFERENCES participan_partido(id_participante_partido),
    
    tipo                    tipo_tarjeta_enum NOT NULL,
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones           VARCHAR(500),
    
    -- Revisión/apelación
    revisada                BOOLEAN DEFAULT FALSE,
    revisada_por            VARCHAR(100),
    revisada_en             TIMESTAMP,
    decision_revision       VARCHAR(200),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100)
);

-- ======================
-- SUSPENSION
-- ======================

CREATE TABLE IF NOT EXISTS suspension (
    id_suspension           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_persona              INT NOT NULL 
        REFERENCES persona(id_persona),
    id_torneo               INT NOT NULL 
        REFERENCES torneo(id_torneo),
    id_partido_origen       INT 
        REFERENCES partido(id_partido),
    
    tipo_suspension         tipo_suspension_enum NOT NULL,
    motivo                  VARCHAR(500) NOT NULL CHECK (motivo <> ''),
    
    fechas_suspension       INT CHECK (fechas_suspension > 0),
    fecha_fin_suspension    DATE,
    
    cumplidas               INT NOT NULL DEFAULT 0 CHECK (cumplidas >= 0),
    partidos_cumplidos      INT[] DEFAULT '{}',
    
    activa                  BOOLEAN NOT NULL DEFAULT TRUE,

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    -- Validaciones
    CHECK (
        (tipo_suspension = 'por_partidos' AND fechas_suspension IS NOT NULL)
        OR
        (tipo_suspension = 'por_fecha' AND fecha_fin_suspension IS NOT NULL)
    ),
    CHECK (cumplidas <= COALESCE(fechas_suspension, 0))
);

-- ======================
-- POSICION
-- ======================

CREATE TABLE IF NOT EXISTS posicion (
    id_posicion          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo            INT NOT NULL 
        REFERENCES torneo(id_torneo),
    id_equipo            INT NOT NULL 
        REFERENCES equipo(id_equipo),
    
    -- Estadísticas
    puntos               INT DEFAULT 0 CHECK (puntos >= 0),
    partidos_jugados     INT DEFAULT 0 CHECK (partidos_jugados >= 0),
    ganados              INT DEFAULT 0 CHECK (ganados >= 0),
    empatados            INT DEFAULT 0 CHECK (empatados >= 0),
    perdidos             INT DEFAULT 0 CHECK (perdidos >= 0),
    goles_a_favor        INT DEFAULT 0 CHECK (goles_a_favor >= 0),
    goles_en_contra      INT DEFAULT 0 CHECK (goles_en_contra >= 0),
    
    -- Campo calculado
    diferencia_gol       INT GENERATED ALWAYS AS (goles_a_favor - goles_en_contra) STORED,

    -- Auditoría
    creado_en            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por           VARCHAR(100),
    actualizado_por      VARCHAR(100),

    CONSTRAINT posicion_unq_torneo_equipo UNIQUE (id_torneo, id_equipo)
);

COMMIT;