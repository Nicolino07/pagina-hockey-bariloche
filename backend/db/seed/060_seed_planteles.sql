-- 8 planteles (IDs 1-8), 10 jugadores + 1 DT por plantel
-- plantel_integrante IDs por equipo:
--   Equipo 1: PI  1-10 (jugadores) + PI  11 (DT)   fichaje 1-10, 11
--   Equipo 2: PI 12-21 (jugadores) + PI  22 (DT)   fichaje 12-21, 22
--   Equipo 3: PI 23-32 (jugadores) + PI  33 (DT)   fichaje 23-32, 33
--   Equipo 4: PI 34-43 (jugadores) + PI  44 (DT)   fichaje 34-43, 44
--   Equipo 5: PI 45-54 (jugadores) + PI  55 (DT)   fichaje 45-54, 55
--   Equipo 6: PI 56-65 (jugadores) + PI  66 (DT)   fichaje 56-65, 66
--   Equipo 7: PI 67-76 (jugadores) + PI  77 (DT)   fichaje 67-76, 77
--   Equipo 8: PI 78-87 (jugadores) + PI  88 (DT)   fichaje 78-87, 88
BEGIN;

INSERT INTO plantel (id_equipo, nombre, temporada, creado_por) VALUES
(1, 'Nahuel Caballeros 2024',    '2024', 'seed'),
(2, 'Andino Caballeros 2024',    '2024', 'seed'),
(3, 'Lagos Caballeros 2024',     '2024', 'seed'),
(4, 'Patagonia Caballeros 2024', '2024', 'seed'),
(5, 'Catedral HC 2024',          '2024', 'seed'),
(6, 'Angostura HC 2024',         '2024', 'seed'),
(7, 'Roca HC 2024',              '2024', 'seed'),
(8, 'Neuquén HC 2024',           '2024', 'seed');

INSERT INTO plantel_integrante (id_plantel, id_persona, id_fichaje_rol, rol_en_plantel, creado_por) VALUES
-- Plantel 1 · Nahuel
(1,  1,  1,  'JUGADOR', 'seed'), (1,  2,  2,  'JUGADOR', 'seed'),
(1,  3,  3,  'JUGADOR', 'seed'), (1,  4,  4,  'JUGADOR', 'seed'),
(1,  5,  5,  'JUGADOR', 'seed'), (1,  6,  6,  'JUGADOR', 'seed'),
(1,  7,  7,  'JUGADOR', 'seed'), (1,  8,  8,  'JUGADOR', 'seed'),
(1,  9,  9,  'JUGADOR', 'seed'), (1, 10, 10,  'JUGADOR', 'seed'),
(1, 81, 11,  'DT',      'seed'),
-- Plantel 2 · Andino
(2, 11, 12, 'JUGADOR', 'seed'), (2, 12, 13, 'JUGADOR', 'seed'),
(2, 13, 14, 'JUGADOR', 'seed'), (2, 14, 15, 'JUGADOR', 'seed'),
(2, 15, 16, 'JUGADOR', 'seed'), (2, 16, 17, 'JUGADOR', 'seed'),
(2, 17, 18, 'JUGADOR', 'seed'), (2, 18, 19, 'JUGADOR', 'seed'),
(2, 19, 20, 'JUGADOR', 'seed'), (2, 20, 21, 'JUGADOR', 'seed'),
(2, 82, 22, 'DT',      'seed'),
-- Plantel 3 · Lagos
(3, 21, 23, 'JUGADOR', 'seed'), (3, 22, 24, 'JUGADOR', 'seed'),
(3, 23, 25, 'JUGADOR', 'seed'), (3, 24, 26, 'JUGADOR', 'seed'),
(3, 25, 27, 'JUGADOR', 'seed'), (3, 26, 28, 'JUGADOR', 'seed'),
(3, 27, 29, 'JUGADOR', 'seed'), (3, 28, 30, 'JUGADOR', 'seed'),
(3, 29, 31, 'JUGADOR', 'seed'), (3, 30, 32, 'JUGADOR', 'seed'),
(3, 83, 33, 'DT',      'seed'),
-- Plantel 4 · Patagonia
(4, 31, 34, 'JUGADOR', 'seed'), (4, 32, 35, 'JUGADOR', 'seed'),
(4, 33, 36, 'JUGADOR', 'seed'), (4, 34, 37, 'JUGADOR', 'seed'),
(4, 35, 38, 'JUGADOR', 'seed'), (4, 36, 39, 'JUGADOR', 'seed'),
(4, 37, 40, 'JUGADOR', 'seed'), (4, 38, 41, 'JUGADOR', 'seed'),
(4, 39, 42, 'JUGADOR', 'seed'), (4, 40, 43, 'JUGADOR', 'seed'),
(4, 84, 44, 'DT',      'seed'),
-- Plantel 5 · Catedral
(5, 41, 45, 'JUGADOR', 'seed'), (5, 42, 46, 'JUGADOR', 'seed'),
(5, 43, 47, 'JUGADOR', 'seed'), (5, 44, 48, 'JUGADOR', 'seed'),
(5, 45, 49, 'JUGADOR', 'seed'), (5, 46, 50, 'JUGADOR', 'seed'),
(5, 47, 51, 'JUGADOR', 'seed'), (5, 48, 52, 'JUGADOR', 'seed'),
(5, 49, 53, 'JUGADOR', 'seed'), (5, 50, 54, 'JUGADOR', 'seed'),
(5, 85, 55, 'DT',      'seed'),
-- Plantel 6 · Angostura
(6, 51, 56, 'JUGADOR', 'seed'), (6, 52, 57, 'JUGADOR', 'seed'),
(6, 53, 58, 'JUGADOR', 'seed'), (6, 54, 59, 'JUGADOR', 'seed'),
(6, 55, 60, 'JUGADOR', 'seed'), (6, 56, 61, 'JUGADOR', 'seed'),
(6, 57, 62, 'JUGADOR', 'seed'), (6, 58, 63, 'JUGADOR', 'seed'),
(6, 59, 64, 'JUGADOR', 'seed'), (6, 60, 65, 'JUGADOR', 'seed'),
(6, 86, 66, 'DT',      'seed'),
-- Plantel 7 · Roca
(7, 61, 67, 'JUGADOR', 'seed'), (7, 62, 68, 'JUGADOR', 'seed'),
(7, 63, 69, 'JUGADOR', 'seed'), (7, 64, 70, 'JUGADOR', 'seed'),
(7, 65, 71, 'JUGADOR', 'seed'), (7, 66, 72, 'JUGADOR', 'seed'),
(7, 67, 73, 'JUGADOR', 'seed'), (7, 68, 74, 'JUGADOR', 'seed'),
(7, 69, 75, 'JUGADOR', 'seed'), (7, 70, 76, 'JUGADOR', 'seed'),
(7, 87, 77, 'DT',      'seed'),
-- Plantel 8 · Neuquén
(8, 71, 78, 'JUGADOR', 'seed'), (8, 72, 79, 'JUGADOR', 'seed'),
(8, 73, 80, 'JUGADOR', 'seed'), (8, 74, 81, 'JUGADOR', 'seed'),
(8, 75, 82, 'JUGADOR', 'seed'), (8, 76, 83, 'JUGADOR', 'seed'),
(8, 77, 84, 'JUGADOR', 'seed'), (8, 78, 85, 'JUGADOR', 'seed'),
(8, 79, 86, 'JUGADOR', 'seed'), (8, 80, 87, 'JUGADOR', 'seed'),
(8, 88, 88, 'DT',      'seed');

COMMIT;
