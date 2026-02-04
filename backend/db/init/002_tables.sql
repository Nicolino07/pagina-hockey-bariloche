-- =====================================================
-- 002_tables.sql
-- Creación de tablas base del sistema 
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

    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
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
    categoria      tipo_categoria NOT NULL,
    genero         tipo_genero NOT NULL,

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);

-- ======================
-- PERSONA
-- ======================

CREATE TABLE IF NOT EXISTS persona (
    id_persona       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    documento        INT UNIQUE CHECK (documento > 0),
    nombre           VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    apellido         VARCHAR(100) NOT NULL CHECK (apellido <> ''),
    fecha_nacimiento DATE,
    genero           tipo_genero NOT NULL,
    telefono         VARCHAR(20),
    email            VARCHAR(100),
    direccion        VARCHAR(200),

    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en   TIMESTAMP DEFAULT NULL,
    borrado_en       TIMESTAMP DEFAULT NULL,
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
    rol            tipo_rol_persona NOT NULL,
    fecha_desde    DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_hasta    DATE,

    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT NULL,
    creado_por     VARCHAR(100),
    actualizado_por VARCHAR(100),

    CHECK (fecha_hasta IS NULL OR fecha_hasta > fecha_desde)
);

-- ======================
-- FICHAJE_ROL
-- ======================
CREATE TABLE IF NOT EXISTS fichaje_rol (
    id_fichaje_rol INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    id_persona INT NOT NULL 
        REFERENCES persona(id_persona) ON UPDATE CASCADE ON DELETE CASCADE,
    id_club INT NOT NULL 
        REFERENCES club(id_club) ON UPDATE CASCADE ON DELETE RESTRICT,

    id_persona_rol INT NOT NULL
        REFERENCES persona_rol(id_persona_rol) ON UPDATE CASCADE ON DELETE RESTRICT,

    rol tipo_rol_persona NOT NULL,
    
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    
    activo BOOLEAN DEFAULT TRUE,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT NULL,
    borrado_en TIMESTAMP DEFAULT NULL,
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100),
    
    CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),

    CHECK (
        (activo = TRUE AND fecha_fin IS NULL)
        OR
        (activo = FALSE)
    )

);


    -- Una persona NO puede tener el mismo rol activo en dos clubes distintos
CREATE UNIQUE INDEX unq_persona_rol_activo_uniclub
ON fichaje_rol (id_persona, rol)
WHERE activo = TRUE AND fecha_fin IS NULL;

-- Una persona NO puede repetir el mismo rol activo en el mismo club
CREATE UNIQUE INDEX unq_persona_club_rol_activo
ON fichaje_rol (id_persona, id_club, rol)
WHERE activo = TRUE;

COMMENT ON INDEX unq_persona_rol_activo_uniclub IS
'Evita que una persona tenga el mismo rol activo en más de un club';

COMMENT ON INDEX unq_persona_club_rol_activo IS
'Evita duplicar rol activo para una persona dentro del mismo club';

-- ======================
-- PLANTEL
-- ======================

CREATE TABLE IF NOT EXISTS plantel (

    id_plantel      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo       INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    -- IDENTIFICACIÓN (OBLIGATORIO)
    nombre          VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    temporada       VARCHAR(10) NOT NULL,  -- '2024' o '2024-2025'
    
    -- DESCRIPCIÓN (OPCIONAL)
    descripcion     TEXT,
    
    -- TEMPORALIDAD
    fecha_apertura  DATE DEFAULT CURRENT_DATE NOT NULL,
    fecha_cierre    DATE,
    
    -- ESTADO Y JERARQUÍA
    activo          BOOLEAN DEFAULT TRUE NOT NULL,

    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),

        -- CONSTRAINTS
    CONSTRAINT chk_plantel_temporada_formato 
        CHECK (temporada ~ '^[0-9]{4}(-[0-9]{4})?$'),
    
    CONSTRAINT chk_plantel_fechas_validas 
        CHECK (fecha_cierre IS NULL OR fecha_cierre >= fecha_apertura),
    
    CONSTRAINT chk_plantel_cierre_si_inactivo 
        CHECK (activo = TRUE OR fecha_cierre IS NOT NULL)

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
    id_fichaje_rol INT NOT NULL
        REFERENCES fichaje_rol(id_fichaje_rol) ON UPDATE CASCADE ON DELETE SET NULL,
    rol_en_plantel        tipo_rol_persona NOT NULL,
    numero_camiseta       INT CHECK (numero_camiseta > 0),
    fecha_alta            DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_baja            DATE,

    creado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en        TIMESTAMP DEFAULT NULL,
    creado_por            VARCHAR(100),
    actualizado_por       VARCHAR(100),


    
    CONSTRAINT unq_plantel_jugador UNIQUE (id_plantel, id_persona)
);

-- ======================
-- TORNEO
-- ======================

CREATE TABLE IF NOT EXISTS torneo (
    id_torneo       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL CHECK (nombre <> ''),
    categoria       tipo_categoria NOT NULL,
    genero          tipo_genero NOT NULL,
    fecha_inicio    DATE DEFAULT CURRENT_DATE,
    fecha_fin       DATE CHECK (fecha_fin > fecha_inicio),
    activo          BOOLEAN DEFAULT TRUE,
    
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT torneo_unq_nombre_categoria UNIQUE (nombre, categoria, genero)
);

-- ======================
-- INSCRIPCION_TORNEO
-- ======================

CREATE TABLE IF NOT EXISTS inscripcion_torneo (
    id_inscripcion  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_equipo       INT NOT NULL 
        REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo       INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    fecha_baja      TIMESTAMP DEFAULT NULL,


    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),

    CONSTRAINT unq_equipo_torneo UNIQUE (id_equipo, id_torneo)
);


-- ======================
-- FASE
-- ======================

CREATE TABLE IF NOT EXISTS fase (
    id_fase       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo     INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE CASCADE,
    nombre        VARCHAR(50) NOT NULL CHECK (nombre <> ''),
    tipo          tipo_fase NOT NULL,
    orden         INT,
    fecha_inicio  DATE,
    fecha_fin     DATE,

    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por    VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- ======================
-- PARTIDO 
-- ======================

CREATE TABLE IF NOT EXISTS partido (
    id_partido     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo      INT NOT NULL 
        REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE CASCADE,
    id_fase        INT 
        REFERENCES fase(id_fase) ON UPDATE CASCADE ON DELETE SET NULL,
    
    fecha          DATE DEFAULT CURRENT_DATE,
    horario        TIME,

    id_inscripcion_local INT NOT NULL 
        REFERENCES inscripcion_torneo(id_inscripcion) ON DELETE RESTRICT,
    id_inscripcion_visitante INT NOT NULL
        REFERENCES inscripcion_torneo(id_inscripcion) ON DELETE RESTRICT,

    -- Arbitraje
    id_arbitro1    INT REFERENCES persona(id_persona) ON DELETE SET NULL,
    id_arbitro2    INT REFERENCES persona(id_persona) ON DELETE SET NULL,
    
    -- Capitanes
    id_capitan_local INT REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE SET NULL,
    id_capitan_visitante INT REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE SET NULL,
    
    -- Jueces de mesa
    juez_mesa_local     VARCHAR(100),
    juez_mesa_visitante VARCHAR(100),
    
    -- Ubicación y observaciones
    ubicacion      VARCHAR(200),
    observaciones  VARCHAR(1000),
    numero_fecha   INT,

    estado_partido tipo_estado_partido DEFAULT 'BORRADOR',

    -- Auditoría
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100),

    -- Constraints

    CONSTRAINT chk_arbitros_distintos CHECK (
        id_arbitro1 IS NULL
        OR id_arbitro2 IS NULL
        OR id_arbitro1 <> id_arbitro2
    ),
    CONSTRAINT chk_capitanes_distintos CHECK (
        id_capitan_local IS NULL
        OR id_capitan_visitante IS NULL
        OR id_capitan_local <> id_capitan_visitante
    )

);

-- Restriccion partido unico. 
CREATE UNIQUE INDEX partido_unq_equipo_fecha
ON partido (
    id_torneo,
    fecha,
    LEAST(id_inscripcion_local, id_inscripcion_visitante),
    GREATEST(id_inscripcion_local, id_inscripcion_visitante)
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
    -- Auditoría
    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT NULL,
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
    referencia_gol          tipo_gol,
    es_autogol              BOOLEAN DEFAULT FALSE,
    
    -- Anulación (ej: por VAR)
    estado_gol             tipo_estado_gol NOT NULL DEFAULT 'VALIDO',
    motivo_anulacion        VARCHAR(500),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT NULL,
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
        REFERENCES participan_partido(id_participante_partido) ON DELETE CASCADE,
    
    tipo                    tipo_tarjeta NOT NULL,
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones           VARCHAR(500),
    
    -- Revisión/apelación

    estado_tarjeta          tipo_estado_tarjeta NOT NULL DEFAULT 'VALIDA',

    revisada                BOOLEAN DEFAULT FALSE,
    revisada_por            VARCHAR(100),
    revisada_en             TIMESTAMP,
    decision_revision       VARCHAR(200),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT NULL,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100)
);

-- ======================
-- SUSPENSION
-- ======================

CREATE TABLE IF NOT EXISTS suspension (
    id_suspension           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_persona_rol          INT NOT NULL 
        REFERENCES persona_rol(id_persona_rol),
    id_torneo               INT NOT NULL 
        REFERENCES torneo(id_torneo),
    id_partido_origen       INT 
        REFERENCES partido(id_partido),
    
    tipo_suspension         tipo_suspension NOT NULL,
    motivo                  VARCHAR(500) NOT NULL CHECK (motivo <> ''),
    
    fechas_suspension       INT CHECK (fechas_suspension > 0),
    fecha_fin_suspension    DATE,
    
    cumplidas               INT NOT NULL DEFAULT 0 CHECK (cumplidas >= 0),
    -- ID de los partidos cumplidos como suspension
    partidos_cumplidos      INT[],
    
    estado_suspension       tipo_estado_suspension NOT NULL DEFAULT 'ACTIVA',
    anulada_en              TIMESTAMP,
    anulada_por             VARCHAR(100),
    motivo_anulacion        VARCHAR(500),

    creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          TIMESTAMP DEFAULT NULL,
    creado_por              VARCHAR(100),
    actualizado_por         VARCHAR(100),

    -- Validaciones
    CHECK (
        (tipo_suspension = 'POR_PARTIDOS' AND fechas_suspension IS NOT NULL)
        OR
        (tipo_suspension = 'POR_FECHA' AND fecha_fin_suspension IS NOT NULL)
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
    actualizado_en       TIMESTAMP DEFAULT NULL,
    creado_por           VARCHAR(100),
    actualizado_por      VARCHAR(100),

    CONSTRAINT posicion_unq_torneo_equipo UNIQUE (id_torneo, id_equipo)
);

COMMIT;