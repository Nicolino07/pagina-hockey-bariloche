-- 80 jugadores (10 por equipo) + 8 DTs + 2 árbitros = 90 personas
-- Jugadores:  IDs  1-80  (10 por equipo, en orden de equipo 1→8)
-- DTs:        IDs 81-88  (uno por equipo, en orden de equipo 1→8)
-- Árbitros:   IDs 89-90
BEGIN;

INSERT INTO persona (nombre, apellido, documento, fecha_nacimiento, genero) VALUES
-- ── Equipo 1 · Nahuel (personas 1-10) ──────────────────────────────────────
('Marcos',      'Rodríguez',  30000001, '1998-03-12', 'MASCULINO'),
('Agustín',     'López',      30000002, '1997-07-24', 'MASCULINO'),
('Sebastián',   'Torres',     30000003, '1999-01-15', 'MASCULINO'),
('Ezequiel',    'Romero',     30000004, '1996-11-08', 'MASCULINO'),
('Damián',      'Herrera',    30000005, '2000-04-30', 'MASCULINO'),
('Lautaro',     'Giménez',    30000006, '1995-09-17', 'MASCULINO'),
('Nahuel',      'Flores',     30000007, '2001-06-03', 'MASCULINO'),
('Ramiro',      'Soria',      30000008, '1998-12-22', 'MASCULINO'),
('Ignacio',     'Mendoza',    30000009, '1997-02-09', 'MASCULINO'),
('Tomás',       'Castro',     30000010, '1999-08-14', 'MASCULINO'),
-- ── Equipo 2 · Andino (personas 11-20) ─────────────────────────────────────
('Diego',       'Gutiérrez',  30000011, '1996-05-20', 'MASCULINO'),
('Facundo',     'Alvarez',    30000012, '1998-10-11', 'MASCULINO'),
('Lucas',       'Pereyra',    30000013, '2000-02-28', 'MASCULINO'),
('Alejandro',   'Ríos',       30000014, '1997-07-16', 'MASCULINO'),
('Matías',      'Cabrera',    30000015, '1999-04-05', 'MASCULINO'),
('Cristian',    'Vega',       30000016, '1995-11-30', 'MASCULINO'),
('Alan',        'Méndez',     30000017, '2001-01-19', 'MASCULINO'),
('Gonzalo',     'Ruiz',       30000018, '1998-06-07', 'MASCULINO'),
('Sebastián',   'Ortega',     30000019, '1996-09-25', 'MASCULINO'),
('Maximiliano', 'Peña',       30000020, '2000-03-13', 'MASCULINO'),
-- ── Equipo 3 · Lagos (personas 21-30) ──────────────────────────────────────
('Enzo',        'Vargas',     30000021, '1997-12-01', 'MASCULINO'),
('Kevin',       'Morales',    30000022, '1999-05-18', 'MASCULINO'),
('Leandro',     'Acosta',     30000023, '1998-08-26', 'MASCULINO'),
('Nicolás',     'Ibáñez',     30000024, '2000-01-07', 'MASCULINO'),
('Mauro',       'Guerrero',   30000025, '1996-04-14', 'MASCULINO'),
('Franco',      'Delgado',    30000026, '2001-10-29', 'MASCULINO'),
('Patricio',    'Suárez',     30000027, '1997-03-03', 'MASCULINO'),
('Bruno',       'Gallardo',   30000028, '1999-07-21', 'MASCULINO'),
('Alexis',      'Navarro',    30000029, '1995-06-10', 'MASCULINO'),
('Joel',        'Sánchez',    30000030, '2000-11-04', 'MASCULINO'),
-- ── Equipo 4 · Patagonia (personas 31-40) ──────────────────────────────────
('Rodrigo',     'Medina',     30000031, '1998-02-17', 'MASCULINO'),
('Santiago',    'Ramos',      30000032, '1996-08-09', 'MASCULINO'),
('Jonathan',    'Parra',      30000033, '2000-05-23', 'MASCULINO'),
('Emiliano',    'Vera',       30000034, '1997-10-15', 'MASCULINO'),
('Claudio',     'Reyes',      30000035, '1999-03-28', 'MASCULINO'),
('Federico',    'Molina',     30000036, '1995-12-06', 'MASCULINO'),
('Pablo',       'Arias',      30000037, '2001-07-11', 'MASCULINO'),
('Javier',      'Campos',     30000038, '1998-04-02', 'MASCULINO'),
('Luis',        'Espinoza',   30000039, '1996-01-27', 'MASCULINO'),
('Hernán',      'Salinas',    30000040, '2000-09-19', 'MASCULINO'),
-- ── Equipo 5 · Catedral (personas 41-50) ───────────────────────────────────
('Gustavo',     'Peñaloza',   30000041, '1997-06-08', 'MASCULINO'),
('Roberto',     'Villareal',  30000042, '1999-11-20', 'MASCULINO'),
('Ariel',       'Cortez',     30000043, '1998-03-05', 'MASCULINO'),
('Oscar',       'Figueroa',   30000044, '1996-07-31', 'MASCULINO'),
('Sergio',      'Benítez',    30000045, '2000-02-14', 'MASCULINO'),
('Marcelo',     'Valdez',     30000046, '1995-10-22', 'MASCULINO'),
('Julio',       'Contreras',  30000047, '2001-04-16', 'MASCULINO'),
('Mario',       'Fuentes',    30000048, '1997-09-03', 'MASCULINO'),
('Pedro',       'Castillo',   30000049, '1999-01-28', 'MASCULINO'),
('Víctor',      'Luna',       30000050, '1996-05-12', 'MASCULINO'),
-- ── Equipo 6 · Angostura (personas 51-60) ──────────────────────────────────
('Adrián',      'Ibarra',     30000051, '1998-08-07', 'MASCULINO'),
('Germán',      'Salas',      30000052, '1997-02-24', 'MASCULINO'),
('Raúl',        'Montes',     30000053, '2000-06-18', 'MASCULINO'),
('César',       'Bravo',      30000054, '1996-11-10', 'MASCULINO'),
('Carlos',      'Cabello',    30000055, '1999-04-01', 'MASCULINO'),
('Antonio',     'Mora',       30000056, '1995-07-15', 'MASCULINO'),
('Hugo',        'Nieto',      30000057, '2001-09-29', 'MASCULINO'),
('Rubén',       'Leal',       30000058, '1998-01-06', 'MASCULINO'),
('Andrés',      'Cortés',     30000059, '1997-05-20', 'MASCULINO'),
('Oswaldo',     'Quiñones',   30000060, '2000-10-13', 'MASCULINO'),
-- ── Equipo 7 · Roca (personas 61-70) ───────────────────────────────────────
('Walter',      'Pizarro',    30000061, '1996-03-22', 'MASCULINO'),
('Darío',       'Carrasco',   30000062, '1998-09-14', 'MASCULINO'),
('Eduardo',     'Zamora',     30000063, '1999-12-07', 'MASCULINO'),
('Mauricio',    'Aguilar',    30000064, '1997-04-19', 'MASCULINO'),
('Claudio',     'Flores',     30000065, '2000-08-25', 'MASCULINO'),
('Gustavo',     'Pereira',    30000066, '1995-02-11', 'MASCULINO'),
('Ricardo',     'Varela',     30000067, '2001-06-30', 'MASCULINO'),
('Alberto',     'Toro',       30000068, '1998-10-04', 'MASCULINO'),
('Hugo',        'Moya',       30000069, '1996-07-17', 'MASCULINO'),
('Nelson',      'Rojas',      30000070, '1999-03-08', 'MASCULINO'),
-- ── Equipo 8 · Neuquén (personas 71-80) ────────────────────────────────────
('Patricio',    'Herrera',    30000071, '1997-11-26', 'MASCULINO'),
('Claudio',     'Muñoz',      30000072, '1999-05-03', 'MASCULINO'),
('Sebastián',   'Cid',        30000073, '1998-01-14', 'MASCULINO'),
('David',       'Araya',      30000074, '1996-06-28', 'MASCULINO'),
('Rodrigo',     'Vidal',      30000075, '2000-10-09', 'MASCULINO'),
('Francisco',   'Tapia',      30000076, '1995-04-17', 'MASCULINO'),
('Ignacio',     'Palma',      30000077, '2001-08-23', 'MASCULINO'),
('Jorge',       'Cárcamo',    30000078, '1997-02-05', 'MASCULINO'),
('Rafael',      'Loyola',     30000079, '1999-07-11', 'MASCULINO'),
('Andrés',      'Sepúlveda',  30000080, '1996-12-31', 'MASCULINO'),
-- ── DTs (personas 81-88) ───────────────────────────────────────────────────
('Carlos',      'Benítez',    40000081, '1975-05-10', 'MASCULINO'),  -- DT equipo 1
('Roberto',     'Casas',      40000082, '1978-11-22', 'MASCULINO'),  -- DT equipo 2
('Jorge',       'Aguirre',    40000083, '1972-03-08', 'MASCULINO'),  -- DT equipo 3
('Fernando',    'Mansilla',   40000084, '1980-09-14', 'MASCULINO'),  -- DT equipo 4
('Mario',       'Rossi',      40000085, '1977-07-30', 'MASCULINO'),  -- DT equipo 5
('Gustavo',     'Páez',       40000086, '1974-01-17', 'MASCULINO'),  -- DT equipo 6
('Pablo',       'Linares',    40000087, '1982-04-25', 'MASCULINO'),  -- DT equipo 7
('Ricardo',     'Estrada',    40000088, '1969-12-03', 'MASCULINO'),  -- DT equipo 8
-- ── Árbitros (personas 89-90) ──────────────────────────────────────────────
('Luis',        'Ferreyra',   50000089, '1985-06-15', 'MASCULINO'),
('Pedro',       'Quiroga',    50000090, '1983-02-27', 'MASCULINO');

COMMIT;
