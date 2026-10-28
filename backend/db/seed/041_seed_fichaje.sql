-- fichaje_rol: jugadores y DT de cada club, en bloques por club
-- IDs 1-11:  club 1  (jugadores 1-10,  DT 81)
-- IDs 12-22: club 2  (jugadores 11-20, DT 82)
-- IDs 23-33: club 3  (jugadores 21-30, DT 83)
-- IDs 34-44: club 4  (jugadores 31-40, DT 84)
-- IDs 45-55: club 5  (jugadores 41-50, DT 85)
-- IDs 56-66: club 6  (jugadores 51-60, DT 86)
-- IDs 67-77: club 7  (jugadores 61-70, DT 87)
-- IDs 78-88: club 8  (jugadores 71-80, DT 88)
BEGIN;

INSERT INTO fichaje_rol (id_persona, id_club, id_persona_rol, rol) VALUES
-- Club 1 · Nahuel
(1,  1, 1,  'JUGADOR'), (2,  1, 2,  'JUGADOR'), (3,  1, 3,  'JUGADOR'),
(4,  1, 4,  'JUGADOR'), (5,  1, 5,  'JUGADOR'), (6,  1, 6,  'JUGADOR'),
(7,  1, 7,  'JUGADOR'), (8,  1, 8,  'JUGADOR'), (9,  1, 9,  'JUGADOR'),
(10, 1, 10, 'JUGADOR'), (81, 1, 81, 'DT'),
-- Club 2 · Andino
(11, 2, 11, 'JUGADOR'), (12, 2, 12, 'JUGADOR'), (13, 2, 13, 'JUGADOR'),
(14, 2, 14, 'JUGADOR'), (15, 2, 15, 'JUGADOR'), (16, 2, 16, 'JUGADOR'),
(17, 2, 17, 'JUGADOR'), (18, 2, 18, 'JUGADOR'), (19, 2, 19, 'JUGADOR'),
(20, 2, 20, 'JUGADOR'), (82, 2, 82, 'DT'),
-- Club 3 · Lagos
(21, 3, 21, 'JUGADOR'), (22, 3, 22, 'JUGADOR'), (23, 3, 23, 'JUGADOR'),
(24, 3, 24, 'JUGADOR'), (25, 3, 25, 'JUGADOR'), (26, 3, 26, 'JUGADOR'),
(27, 3, 27, 'JUGADOR'), (28, 3, 28, 'JUGADOR'), (29, 3, 29, 'JUGADOR'),
(30, 3, 30, 'JUGADOR'), (83, 3, 83, 'DT'),
-- Club 4 · Patagonia
(31, 4, 31, 'JUGADOR'), (32, 4, 32, 'JUGADOR'), (33, 4, 33, 'JUGADOR'),
(34, 4, 34, 'JUGADOR'), (35, 4, 35, 'JUGADOR'), (36, 4, 36, 'JUGADOR'),
(37, 4, 37, 'JUGADOR'), (38, 4, 38, 'JUGADOR'), (39, 4, 39, 'JUGADOR'),
(40, 4, 40, 'JUGADOR'), (84, 4, 84, 'DT'),
-- Club 5 · Catedral
(41, 5, 41, 'JUGADOR'), (42, 5, 42, 'JUGADOR'), (43, 5, 43, 'JUGADOR'),
(44, 5, 44, 'JUGADOR'), (45, 5, 45, 'JUGADOR'), (46, 5, 46, 'JUGADOR'),
(47, 5, 47, 'JUGADOR'), (48, 5, 48, 'JUGADOR'), (49, 5, 49, 'JUGADOR'),
(50, 5, 50, 'JUGADOR'), (85, 5, 85, 'DT'),
-- Club 6 · Angostura
(51, 6, 51, 'JUGADOR'), (52, 6, 52, 'JUGADOR'), (53, 6, 53, 'JUGADOR'),
(54, 6, 54, 'JUGADOR'), (55, 6, 55, 'JUGADOR'), (56, 6, 56, 'JUGADOR'),
(57, 6, 57, 'JUGADOR'), (58, 6, 58, 'JUGADOR'), (59, 6, 59, 'JUGADOR'),
(60, 6, 60, 'JUGADOR'), (86, 6, 86, 'DT'),
-- Club 7 · Roca
(61, 7, 61, 'JUGADOR'), (62, 7, 62, 'JUGADOR'), (63, 7, 63, 'JUGADOR'),
(64, 7, 64, 'JUGADOR'), (65, 7, 65, 'JUGADOR'), (66, 7, 66, 'JUGADOR'),
(67, 7, 67, 'JUGADOR'), (68, 7, 68, 'JUGADOR'), (69, 7, 69, 'JUGADOR'),
(70, 7, 70, 'JUGADOR'), (87, 7, 87, 'DT'),
-- Club 8 · Neuquén
(71, 8, 71, 'JUGADOR'), (72, 8, 72, 'JUGADOR'), (73, 8, 73, 'JUGADOR'),
(74, 8, 74, 'JUGADOR'), (75, 8, 75, 'JUGADOR'), (76, 8, 76, 'JUGADOR'),
(77, 8, 77, 'JUGADOR'), (78, 8, 78, 'JUGADOR'), (79, 8, 79, 'JUGADOR'),
(80, 8, 80, 'JUGADOR'), (88, 8, 88, 'DT');

COMMIT;
