-- ================================================
-- INICIO: CREACIÓN DE TABLAS 
-- ================================================

-- -------------------------
-- TABLA: club
-- -------------------------
CREATE TABLE IF NOT EXISTS club (
    id_club    SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL check(nombre <> ''),
    provincia  VARCHAR(100) NOT NULL check(provincia <> ''),
    ciudad     VARCHAR(100) NOT NULL check(ciudad <> ''),
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
    nombre     VARCHAR(100) NOT NULL check(nombre <> ''),
    id_club    INT NOT NULL REFERENCES club(id_club) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria  VARCHAR(50) NOT NULL,
    genero     VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino','Femenino','Mixto')),

    CONSTRAINT equipo_unq_club_categoria UNIQUE (id_club, nombre, categoria)
);

-- -------------------------
-- TABLA: jugador
-- -------------------------
CREATE TABLE IF NOT EXISTS jugador (
    id_jugador          SERIAL PRIMARY KEY,
    dni                 INT check(dni > 0) UNIQUE,
    nombre              VARCHAR(100) NOT NULL check(nombre <> ''),
    apellido            VARCHAR(100) NOT NULL check(apellido <> ''),
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
    dni              INT check(dni > 0) UNIQUE,
    nombre           VARCHAR(100) NOT NULL check(nombre <> ''),
    apellido         VARCHAR(100) NOT NULL check(apellido <> ''),
    fecha_nacimiento DATE,
    telefono         VARCHAR(20),
    email            VARCHAR(100)
);

-- -------------------------
-- TABLA: arbitro
-- -------------------------
CREATE TABLE IF NOT EXISTS arbitro (
    id_arbitro       SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL CHECK(nombre <> ''),
    apellido         VARCHAR(100) NOT NULL CHECK(apellido <> ''),
    fecha_nacimiento DATE,
    dni              INT check(dni > 0) UNIQUE,
    telefono         VARCHAR(20),
    email            VARCHAR(100)
);

-- NO REPETIR DNIs DE ÁRBITROS (si no es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unq_arbitro_dni ON arbitro(dni) WHERE dni IS NOT NULL;


-- -------------------------
-- TABLA: plantel
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel (
    id_plantel      SERIAL PRIMARY KEY,
    id_equipo       INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo       INT NOT NULL REFERENCES torneo(id_torneo),
    fecha_creacion  DATE DEFAULT CURRENT_DATE,
    -- Un plantel por equipo-torneo
    UNIQUE(id_equipo, id_torneo)  
);

-- -------------------------
-- TABLA: plantel_integrante
-- -------------------------
CREATE TABLE IF NOT EXISTS plantel_integrante (
    id_plantel_integrante   SERIAL PRIMARY KEY,
    id_plantel              INT NOT NULL REFERENCES plantel(id_plantel) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_jugador              INT REFERENCES jugador(id_jugador) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_entrenador           INT REFERENCES entrenador(id_entrenador) ON UPDATE CASCADE ON DELETE RESTRICT,
    rol                     VARCHAR(50) NOT NULL check (rol <> ''),  -- jugador, DT, PF, médico, etc.
    numero_camiseta         INT,                            -- referencia (opcional) de número de camiseta
    fecha_alta              DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_baja              DATE CHECK (fecha_baja > fecha_alta),

    -- Asegura que solo uno de los dos campos (id_jugador o id_entrenador) sea NO NULO
    CONSTRAINT chk_un_solo_tipo CHECK (
        (id_jugador IS NOT NULL AND id_entrenador IS NULL)
        OR
        (id_jugador IS NULL AND id_entrenador IS NOT NULL)
    )
);

-- Índices parciales para asegurar unicidad por tipo (evita NULL dupes)
CREATE UNIQUE INDEX IF NOT EXISTS unq_jugador_plantel
    ON plantel_integrante(id_plantel, id_jugador)
    WHERE id_jugador IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unq_entrenador_plantel
    ON plantel_integrante(id_plantel, id_entrenador)
    WHERE id_entrenador IS NOT NULL;


-- -------------------------
-- TABLA: torneo
-- -------------------------
CREATE TABLE IF NOT EXISTS torneo (
    id_torneo    SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL check(nombre <> ''),
    categoria    VARCHAR(20) NOT NULL check(categoria <> ''),
    genero       VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino','Femenino','Mixto')),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin    DATE CHECK (fecha_fin > fecha_inicio),
    activo       BOOLEAN DEFAULT TRUE,

    CONSTRAINT torneo_nombre_cat UNIQUE (nombre, categoria)
);

-- -------------------------
-- TABLA: fase
-- -------------------------
CREATE TABLE IF NOT EXISTS fase (
    id_fase       SERIAL PRIMARY KEY,
    torneo_id     INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre        VARCHAR(50) NOT NULL check(nombre <> ''),
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
    id_equipo           INT NOT NULL REFERENCES equipo(id_equipo) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_torneo           INT NOT NULL REFERENCES torneo(id_torneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    categoria           VARCHAR(50) NOT NULL CHECK (categoria <> ''),
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
    id_capitan_local           INT REFERENCES plantel_integrante(id_plantel_integrante),
    id_capitan_visitante       INT REFERENCES plantel_integrante(id_plantel_integrante),
    juez_mesa_local            VARCHAR(100),
    juez_mesa_visitante        VARCHAR(100),
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
    id_participante_partido SERIAL PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON DELETE CASCADE,
    id_plantel_integrante   INT NOT NULL REFERENCES plantel_integrante(id_plantel_integrante) ON DELETE CASCADE,
    numero_camiseta         INT CHECK (numero_camiseta > 0),

    -- Asegura que un jugador/entrenador no se registre dos veces para el mismo partido
    CONSTRAINT unq_jugador_partido UNIQUE (id_partido, id_plantel_integrante)
);

-- -------------------------
-- TABLA: gol
-- -------------------------
CREATE TABLE IF NOT EXISTS gol (
    id_gol                  SERIAL PRIMARY KEY,
    id_partido              INT NOT NULL REFERENCES partido(id_partido) ON UPDATE CASCADE ON DELETE CASCADE,
    id_participante_partido INT NOT NULL REFERENCES participan_partido(id_participante_partido)ON UPDATE CASCADE ON DELETE CASCADE,
    minuto                  INT check (minuto >= 0),
    cuarto                  INT CHECK (cuarto BETWEEN 1 AND 4),
    -- GJ = Goj jugada, GC = Gol corner corto, GP = Gol penal, DP = Definicion penales
    referencia_gol          VARCHAR(10) CHECK (referencia_gol IN ('GJ', 'GC', 'GP', 'DP')),
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
-- TABLA: suspension
-- -------------------------
CREATE TABLE IF NOT EXISTS suspension (
    id_suspension           SERIAL PRIMARY KEY,
    id_integrante_plantel   INT NOT NULL
        REFERENCES plantel_integrante(id_plantel_integrante), -- referencia al jugador o entrenador suspendido
    id_torneo               INT NOT NULL
        REFERENCES torneo(id_torneo),
    tipo_suspension VARCHAR(20) NOT NULL CHECK (tipo_suspension IN ('por_partidos', 'por_fecha')),
    motivo VARCHAR(200)         NOT NULL CHECK(motivo <> ''),   -- "Acumulación amarillas", "Roja directa", etc.
    fechas_suspension           INT, -- cuántos partidos debe cumplir (NULL si tipo = por_fecha)
    fecha_fin_suspension        DATE NULL, -- fecha hasta la cual dura la suspensión (NULL si tipo = por_partidos)
    cumplidas                   INT NOT NULL DEFAULT 0,
    activa                      BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 3. EQUIPOS / PLANTEL / PLANTEL_INTEGRANTE
CREATE INDEX IF NOT EXISTS idx_equipo_club 
    ON equipo(id_club);

-- plantel
CREATE INDEX IF NOT EXISTS idx_plantel_equipo 
    ON plantel(id_equipo);

-- plantel_integrante
CREATE INDEX IF NOT EXISTS idx_pi_plantel 
    ON plantel_integrante(id_plantel);

CREATE INDEX IF NOT EXISTS idx_pi_jugador 
    ON plantel_integrante(id_jugador);

CREATE INDEX IF NOT EXISTS idx_pi_entrenador 
    ON plantel_integrante(id_entrenador);

CREATE INDEX IF NOT EXISTS idx_pi_fecha_baja 
    ON plantel_integrante(fecha_baja);

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

-- índice para búsquedas por integrante en participan_partido
CREATE INDEX IF NOT EXISTS idx_participante_integrante
    ON participan_partido(id_plantel_integrante);

-- 8. SUSPENSIONES (muy importante)
CREATE INDEX IF NOT EXISTS idx_susp_integrante 
    ON suspension(id_integrante_plantel);

CREATE INDEX IF NOT EXISTS idx_susp_torneo 
    ON suspension(id_torneo);

CREATE INDEX IF NOT EXISTS idx_susp_activa 
    ON suspension(activa) WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_susp_fin 
    ON suspension(fecha_fin_suspension);

-- ================================================
-- FIN DE ÍNDICES
-- ================================================
