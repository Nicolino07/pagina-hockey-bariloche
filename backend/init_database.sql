-- ================================================
-- INICIO: CREACIÓN DE TABLAS
-- ================================================

-- -------------------------
-- TABLA: club
-- -------------------------
CREATE TABLE IF NOT EXISTS club (
    id_club    SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    provincia  VARCHAR(100),
    ciudad     VARCHAR(100),
    direccion  VARCHAR(200),
    telefono   VARCHAR(20),
    email      VARCHAR(100),

    CONSTRAINT club_unq_nombre_ciudad UNIQUE (nombre, ciudad)
);

-- -------------------------
-- TABLA: equipo
-- -------------------------
CREATE TABLE IF NOT EXISTS equipo (
    id_equipo  SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    id_club    INT NOT NULL REFERENCES club(id_club) ON DELETE CASCADE,
    categoria  VARCHAR(50) NOT NULL,
    genero     VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino','Femenino','Mixto')),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);

-- -------------------------
-- TABLA: jugador
-- -------------------------
CREATE TABLE IF NOT EXISTS jugador (
    id_jugador          SERIAL PRIMARY KEY,
    dni                 VARCHAR(20) UNIQUE,
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100),
    genero              VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino','Femenino')),
    fecha_nacimiento    DATE,
    telefono            VARCHAR(20),
    email               VARCHAR(100)
);

-- -------------------------
-- TABLA: entrenador
-- -------------------------
CREATE TABLE IF NOT EXISTS entrenador (
    id_entrenador    SERIAL PRIMARY KEY,
    dni              VARCHAR(20) UNIQUE,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    telefono         VARCHAR(20),
    email            VARCHAR(100)
);

-- -------------------------
-- TABLA: arbitro
-- -------------------------
CREATE TABLE IF NOT EXISTS arbitro (
    id_arbitro       SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido         VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    dni              VARCHAR(20) UNIQUE,
    telefono         VARCHAR(20),
    email            VARCHAR(100)
);

-- -------------------------
-- TABLA: plantel_equipo
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel_equipo (
    id_plantel        SERIAL PRIMARY KEY,
    id_equipo         INT NOT NULL REFERENCES equipo(id_equipo) ON DELETE CASCADE,
    id_jugador        INT REFERENCES jugador(id_jugador),
    id_entrenador     INT REFERENCES entrenador(id_entrenador),
    posicion          VARCHAR(50),
    fecha_alta        DATE DEFAULT CURRENT_DATE,
    fecha_baja        DATE,

    CONSTRAINT plantel_equipo_jugador_unq UNIQUE (id_equipo, id_jugador),
    CONSTRAINT plantel_equipo_entrenador_unq UNIQUE (id_equipo, id_entrenador),

    CONSTRAINT chk_jugador_o_entrenador
        CHECK (
            (id_jugador IS NOT NULL AND id_entrenador IS NULL)
            OR
            (id_jugador IS NULL AND id_entrenador IS NOT NULL)
        )
);

-- -------------------------
-- TABLA: torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS torneo (
    id_torneo    SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    categoria    VARCHAR(20) NOT NULL,
    genero       VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino','Femenino','Mixto')),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin    DATE,
    activo       BOOLEAN DEFAULT TRUE,

    CONSTRAINT torneo_nombre_cat UNIQUE (nombre, categoria)
);

-- -------------------------
-- TABLA: fase
-- -------------------------
CREATE TABLE IF NOT EXISTS fase (
    id_fase       SERIAL PRIMARY KEY,
    torneo_id     INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre        VARCHAR(50) NOT NULL,
    tipo          VARCHAR(20) NOT NULL,
    orden         INT,
    fecha_inicio  DATE,
    fecha_fin     DATE
);

-- -------------------------
-- TABLA: inscripcion_torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS inscripcion_torneo (
    id_inscripcion      SERIAL PRIMARY KEY,
    id_equipo           INT NOT NULL REFERENCES equipo(id_equipo),
    id_torneo           INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    categoria           VARCHAR(50) NOT NULL,
    genero              VARCHAR(20) NOT NULL,
    fecha_inscripcion   DATE DEFAULT CURRENT_DATE,

    CONSTRAINT inscripcion_equipo_torneo_unq UNIQUE (id_equipo, id_torneo)
);

-- -------------------------
-- TABLA: partido
-- -------------------------
CREATE TABLE IF NOT EXISTS partido (
    id_partido                 SERIAL PRIMARY KEY,
    id_torneo                  INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    id_fase                    INT REFERENCES fase(id_fase),
    fecha                      DATE DEFAULT CURRENT_DATE,
    horario                    TIME,
    id_local                   INT NOT NULL REFERENCES equipo(id_equipo),
    id_visitante               INT NOT NULL REFERENCES equipo(id_equipo),
    goles_local                INT DEFAULT 0,
    goles_visitante            INT DEFAULT 0,
    id_arbitro1                INT REFERENCES arbitro(id_arbitro),
    id_arbitro2                INT REFERENCES arbitro(id_arbitro),
    ubicacion                  VARCHAR(200),
    observaciones              VARCHAR(1000),
    tipo_fase                  VARCHAR(20) NOT NULL DEFAULT 'liga',
    numero_fecha               INT,

    CONSTRAINT chk_arbitros_distintos CHECK (id_arbitro1 <> id_arbitro2),
    CONSTRAINT chk_equipos_distintos CHECK (id_local <> id_visitante)
);

-- -------------------------
-- TABLA: participan_partido
-- -------------------------
CREATE TABLE IF NOT EXISTS participan_partido (
    id_participante_partido     SERIAL PRIMARY KEY,
    id_partido                  INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_plantel                  INT NOT NULL REFERENCES plantel_equipo(id_plantel),
    numero_camiseta             INT CHECK (numero_camiseta > 0),

    CONSTRAINT participante_partido UNIQUE (id_partido, id_plantel)
);

-- -------------------------
-- TABLA: gol
-- -------------------------
CREATE TABLE IF NOT EXISTS gol (
    id_gol                  SERIAL PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido),
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    es_autogol              BOOLEAN DEFAULT FALSE
);

-- -------------------------
-- TABLA: tarjeta
-- -------------------------
CREATE TABLE IF NOT EXISTS tarjeta (
    id_tarjeta              SERIAL PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido),
    tipo                    VARCHAR(10) NOT NULL CHECK (tipo IN ('verde','amarilla','roja')),
    minuto                  INT,
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    observaciones           VARCHAR(500)
);

-- -------------------------
-- TABLA: posicion
-- -------------------------
CREATE TABLE IF NOT EXISTS posicion (
    id_posicion          SERIAL PRIMARY KEY,
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
    fecha_actualizacion  TIMESTAMP DEFAULT now(),

    CONSTRAINT posicion_equipo_torneo_unq UNIQUE (id_torneo, id_equipo)
);

-- ================================================
-- FIN DE TABLAS
-- ================================================





-- ================================================
-- INICIO: ÍNDICES RECOMENDADOS (80/20)
-- ================================================

-- 1. PARTIDOS
CREATE INDEX IF NOT EXISTS idx_partido_torneo_fecha 
    ON partido(id_torneo, fecha);

CREATE INDEX IF NOT EXISTS idx_partido_local 
    ON partido(id_local);

CREATE INDEX IF NOT EXISTS idx_partido_visitante 
    ON partido(id_visitante);

-- 2. JUGADORES
CREATE INDEX IF NOT EXISTS idx_jugador_dni 
    ON jugador(dni);

CREATE INDEX IF NOT EXISTS idx_jugador_nombre_apellido 
    ON jugador(nombre, apellido);

-- 3. EQUIPOS / PLANTEL
CREATE INDEX IF NOT EXISTS idx_equipo_club 
    ON equipo(id_club);

CREATE INDEX IF NOT EXISTS idx_plantel_equipo_equipo 
    ON plantel_equipo(id_equipo);

CREATE INDEX IF NOT EXISTS idx_plantel_equipo_jugador 
    ON plantel_equipo(id_jugador);

CREATE INDEX IF NOT EXISTS idx_plantel_equipo_entrenador 
    ON plantel_equipo(id_entrenador);

-- 4. TORNEO
CREATE INDEX IF NOT EXISTS idx_torneo_activo 
    ON torneo(activo) WHERE activo = true;

-- 5. INSCRIPCIONES
CREATE INDEX IF NOT EXISTS idx_inscripcion_torneo 
    ON inscripcion_torneo(id_torneo);

CREATE INDEX IF NOT EXISTS idx_inscripcion_equipo 
    ON inscripcion_torneo(id_equipo);

-- 6. ESTADÍSTICAS
CREATE INDEX IF NOT EXISTS idx_gol_partido 
    ON gol(id_partido);

CREATE INDEX IF NOT EXISTS idx_tarjeta_partido 
    ON tarjeta(id_partido);

CREATE INDEX IF NOT EXISTS idx_posicion_torneo 
    ON posicion(id_torneo);

-- 7. PARTICIPANTES
CREATE INDEX IF NOT EXISTS idx_participacion_partido 
    ON participan_partido(id_partido);

-- ================================================
-- FIN DE ÍNDICES
-- ================================================
