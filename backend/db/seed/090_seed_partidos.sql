-- 10 partidos con participantes, goles, tarjetas y posiciones
--
-- Resultados:
--   Fecha 1 (2024-03-02): E1 2-1 E2 · E3 1-1 E4 · E5 3-0 E6 · E7 2-2 E8
--   Fecha 2 (2024-03-09): E1 1-2 E3 · E2 0-1 E5 · E4 2-1 E6
--   Fecha 3 (2024-03-16): E7 3-1 E1 · E3 2-0 E8 · E5 1-1 E2
--
-- Posiciones finales:
--   E3 y E5: 7pts | E4 y E7: 4pts | E1: 3pts | E2 y E8: 1pt | E6: 0pts
--
-- plantel_integrante (PI) por equipo:
--   E1: PI  1-10  E2: PI 12-21  E3: PI 23-32  E4: PI 34-43
--   E5: PI 45-54  E6: PI 56-65  E7: PI 67-76  E8: PI 78-87
--
-- participan_partido (PP) — 5 jugadores por equipo por partido:
--   Partido 1 (E1 vs E2): PP  1-5  = PI 1-5 (E1),   PP  6-10 = PI 12-16 (E2)
--   Partido 2 (E3 vs E4): PP 11-15 = PI 23-27 (E3),  PP 16-20 = PI 34-38 (E4)
--   Partido 3 (E5 vs E6): PP 21-25 = PI 45-49 (E5),  PP 26-30 = PI 56-60 (E6)
--   Partido 4 (E7 vs E8): PP 31-35 = PI 67-71 (E7),  PP 36-40 = PI 78-82 (E8)
--   Partido 5 (E1 vs E3): PP 41-45 = PI 1-5 (E1),    PP 46-50 = PI 23-27 (E3)
--   Partido 6 (E2 vs E5): PP 51-55 = PI 12-16 (E2),  PP 56-60 = PI 45-49 (E5)
--   Partido 7 (E4 vs E6): PP 61-65 = PI 34-38 (E4),  PP 66-70 = PI 56-60 (E6)
--   Partido 8 (E7 vs E1): PP 71-75 = PI 67-71 (E7),  PP 76-80 = PI 1-5 (E1)
--   Partido 9 (E3 vs E8): PP 81-85 = PI 23-27 (E3),  PP 86-90 = PI 78-82 (E8)
--   Partido 10(E5 vs E2): PP 91-95 = PI 45-49 (E5),  PP 96-100= PI 12-16 (E2)

BEGIN;

-- ============================================================
-- PARTIDOS (10)
-- ============================================================
INSERT INTO partido
    (id_torneo, fecha, numero_fecha, id_inscripcion_local, id_inscripcion_visitante,
     id_arbitro1, estado_partido, creado_por)
VALUES
-- Fecha 1
(1, '2024-03-02', 1, 1, 2, 89, 'TERMINADO', 'seed'),  -- partido 1: E1 vs E2
(1, '2024-03-02', 1, 3, 4, 90, 'TERMINADO', 'seed'),  -- partido 2: E3 vs E4
(1, '2024-03-02', 1, 5, 6, 89, 'TERMINADO', 'seed'),  -- partido 3: E5 vs E6
(1, '2024-03-02', 1, 7, 8, 90, 'TERMINADO', 'seed'),  -- partido 4: E7 vs E8
-- Fecha 2
(1, '2024-03-09', 2, 1, 3, 90, 'TERMINADO', 'seed'),  -- partido 5: E1 vs E3
(1, '2024-03-09', 2, 2, 5, 89, 'TERMINADO', 'seed'),  -- partido 6: E2 vs E5
(1, '2024-03-09', 2, 4, 6, 90, 'TERMINADO', 'seed'),  -- partido 7: E4 vs E6
-- Fecha 3
(1, '2024-03-16', 3, 7, 1, 89, 'TERMINADO', 'seed'),  -- partido 8: E7 vs E1
(1, '2024-03-16', 3, 3, 8, 90, 'TERMINADO', 'seed'),  -- partido 9: E3 vs E8
(1, '2024-03-16', 3, 5, 2, 89, 'TERMINADO', 'seed');  -- partido 10: E5 vs E2

-- ============================================================
-- PARTICIPAN_PARTIDO (100 — 5 por equipo por partido)
-- ============================================================
INSERT INTO participan_partido (id_partido, id_plantel_integrante, numero_camiseta, creado_por) VALUES
-- Partido 1: E1 (PP 1-5) · E2 (PP 6-10)
(1,  1,  3, 'seed'),(1,  2,  7, 'seed'),(1,  3, 10, 'seed'),(1,  4, 14, 'seed'),(1,  5, 18, 'seed'),
(1, 12,  4, 'seed'),(1, 13,  9, 'seed'),(1, 14, 11, 'seed'),(1, 15, 15, 'seed'),(1, 16, 22, 'seed'),
-- Partido 2: E3 (PP 11-15) · E4 (PP 16-20)
(2, 23,  2, 'seed'),(2, 24,  6, 'seed'),(2, 25,  8, 'seed'),(2, 26, 13, 'seed'),(2, 27, 17, 'seed'),
(2, 34,  5, 'seed'),(2, 35,  9, 'seed'),(2, 36, 12, 'seed'),(2, 37, 16, 'seed'),(2, 38, 21, 'seed'),
-- Partido 3: E5 (PP 21-25) · E6 (PP 26-30)
(3, 45,  1, 'seed'),(3, 46,  7, 'seed'),(3, 47, 10, 'seed'),(3, 48, 14, 'seed'),(3, 49, 19, 'seed'),
(3, 56,  3, 'seed'),(3, 57,  6, 'seed'),(3, 58, 11, 'seed'),(3, 59, 15, 'seed'),(3, 60, 20, 'seed'),
-- Partido 4: E7 (PP 31-35) · E8 (PP 36-40)
(4, 67,  2, 'seed'),(4, 68,  5, 'seed'),(4, 69,  9, 'seed'),(4, 70, 13, 'seed'),(4, 71, 17, 'seed'),
(4, 78,  4, 'seed'),(4, 79,  8, 'seed'),(4, 80, 12, 'seed'),(4, 81, 16, 'seed'),(4, 82, 22, 'seed'),
-- Partido 5: E1 (PP 41-45) · E3 (PP 46-50)
(5,  1,  3, 'seed'),(5,  2,  7, 'seed'),(5,  3, 10, 'seed'),(5,  4, 14, 'seed'),(5,  5, 18, 'seed'),
(5, 23,  2, 'seed'),(5, 24,  6, 'seed'),(5, 25,  8, 'seed'),(5, 26, 13, 'seed'),(5, 27, 17, 'seed'),
-- Partido 6: E2 (PP 51-55) · E5 (PP 56-60)
(6, 12,  4, 'seed'),(6, 13,  9, 'seed'),(6, 14, 11, 'seed'),(6, 15, 15, 'seed'),(6, 16, 22, 'seed'),
(6, 45,  1, 'seed'),(6, 46,  7, 'seed'),(6, 47, 10, 'seed'),(6, 48, 14, 'seed'),(6, 49, 19, 'seed'),
-- Partido 7: E4 (PP 61-65) · E6 (PP 66-70)
(7, 34,  5, 'seed'),(7, 35,  9, 'seed'),(7, 36, 12, 'seed'),(7, 37, 16, 'seed'),(7, 38, 21, 'seed'),
(7, 56,  3, 'seed'),(7, 57,  6, 'seed'),(7, 58, 11, 'seed'),(7, 59, 15, 'seed'),(7, 60, 20, 'seed'),
-- Partido 8: E7 (PP 71-75) · E1 (PP 76-80)
(8, 67,  2, 'seed'),(8, 68,  5, 'seed'),(8, 69,  9, 'seed'),(8, 70, 13, 'seed'),(8, 71, 17, 'seed'),
(8,  1,  3, 'seed'),(8,  2,  7, 'seed'),(8,  3, 10, 'seed'),(8,  4, 14, 'seed'),(8,  5, 18, 'seed'),
-- Partido 9: E3 (PP 81-85) · E8 (PP 86-90)
(9, 23,  2, 'seed'),(9, 24,  6, 'seed'),(9, 25,  8, 'seed'),(9, 26, 13, 'seed'),(9, 27, 17, 'seed'),
(9, 78,  4, 'seed'),(9, 79,  8, 'seed'),(9, 80, 12, 'seed'),(9, 81, 16, 'seed'),(9, 82, 22, 'seed'),
-- Partido 10: E5 (PP 91-95) · E2 (PP 96-100)
(10, 45,  1, 'seed'),(10, 46,  7, 'seed'),(10, 47, 10, 'seed'),(10, 48, 14, 'seed'),(10, 49, 19, 'seed'),
(10, 12,  4, 'seed'),(10, 13,  9, 'seed'),(10, 14, 11, 'seed'),(10, 15, 15, 'seed'),(10, 16, 22, 'seed');

-- ============================================================
-- GOLES
-- PP → PI → persona:
--   PP  2=PI  2=Agustín López      PP  4=PI  4=Ezequiel Romero
--   PP  7=PI 13=Lucas Pereyra      PP 11=PI 23=Enzo Vargas
--   PP 17=PI 35=Santiago Ramos     PP 21=PI 45=Gustavo Peñaloza
--   PP 23=PI 47=Julio Contreras    PP 24=PI 48=Mario Fuentes
--   PP 32=PI 68=Darío Carrasco     PP 34=PI 70=Mauricio Aguilar
--   PP 37=PI 79=Claudio Muñoz      PP 39=PI 81=David Araya
--   PP 43=PI  3=Sebastián Torres   PP 47=PI 24=Nicolás Ibáñez
--   PP 49=PI 26=Franco Delgado     PP 58=PI 48=Mario Fuentes
--   PP 62=PI 35=Santiago Ramos     PP 64=PI 37=Pablo Arias
--   PP 67=PI 57=Hugo Nieto         PP 71=PI 67=Walter Pizarro
--   PP 73=PI 69=Eduardo Zamora     PP 75=PI 71=Claudio Flores
--   PP 77=PI  2=Agustín López      PP 82=PI 24=Nicolás Ibáñez
--   PP 84=PI 26=Franco Delgado     PP 91=PI 45=Gustavo Peñaloza
--   PP 97=PI 13=Lucas Pereyra
-- ============================================================
INSERT INTO gol
    (id_partido, id_participante_partido, referencia_gol, es_autogol, estado_gol, creado_por)
VALUES
-- Partido 1 · E1 2-1 E2
(1,  2, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Agustín López (E1)
(1,  4, 'GC', FALSE, 'VALIDO', 'seed'),  -- Ezequiel Romero (E1)
(1,  7, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Lucas Pereyra (E2)
-- Partido 2 · E3 1-1 E4
(2, 11, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Enzo Vargas (E3)
(2, 17, 'GP', FALSE, 'VALIDO', 'seed'),  -- Santiago Ramos (E4)
-- Partido 3 · E5 3-0 E6
(3, 21, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Gustavo Peñaloza (E5)
(3, 23, 'GC', FALSE, 'VALIDO', 'seed'),  -- Julio Contreras (E5)
(3, 24, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Mario Fuentes (E5)
-- Partido 4 · E7 2-2 E8
(4, 32, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Darío Carrasco (E7)
(4, 34, 'GC', FALSE, 'VALIDO', 'seed'),  -- Mauricio Aguilar (E7)
(4, 37, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Claudio Muñoz (E8)
(4, 39, 'GP', FALSE, 'VALIDO', 'seed'),  -- David Araya (E8)
-- Partido 5 · E1 1-2 E3
(5, 43, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Sebastián Torres (E1)
(5, 47, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Nicolás Ibáñez (E3)
(5, 49, 'GC', FALSE, 'VALIDO', 'seed'),  -- Franco Delgado (E3)
-- Partido 6 · E2 0-1 E5
(6, 58, 'GP', FALSE, 'VALIDO', 'seed'),  -- Mario Fuentes (E5)
-- Partido 7 · E4 2-1 E6
(7, 62, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Santiago Ramos (E4)
(7, 64, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Pablo Arias (E4)
(7, 67, 'GC', FALSE, 'VALIDO', 'seed'),  -- Hugo Nieto (E6)
-- Partido 8 · E7 3-1 E1
(8, 71, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Walter Pizarro (E7)
(8, 73, 'GC', FALSE, 'VALIDO', 'seed'),  -- Eduardo Zamora (E7)
(8, 75, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Claudio Flores (E7)
(8, 77, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Agustín López (E1)
-- Partido 9 · E3 2-0 E8
(9, 82, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Nicolás Ibáñez (E3)
(9, 84, 'GP', FALSE, 'VALIDO', 'seed'),  -- Franco Delgado (E3)
-- Partido 10 · E5 1-1 E2
(10, 91, 'GJ', FALSE, 'VALIDO', 'seed'),  -- Gustavo Peñaloza (E5)
(10, 97, 'GC', FALSE, 'VALIDO', 'seed');  -- Lucas Pereyra (E2)

-- ============================================================
-- TARJETAS
-- ============================================================
INSERT INTO tarjeta
    (id_partido, id_participante_partido, tipo, estado_tarjeta, creado_por)
VALUES
-- Partido 1: amarilla PP 3 (Sebastián Torres E1), amarilla PP 8 (Alejandro Ríos E2)
(1,  3, 'AMARILLA', 'VALIDA', 'seed'),
(1,  8, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 2: amarilla PP 13 (Leandro Acosta E3)
(2, 13, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 3: roja PP 28 (Rubén Leal E6)
(3, 28, 'ROJA',     'VALIDA', 'seed'),
-- Partido 4: amarilla PP 31 (Walter Pizarro E7), amarilla PP 38 (Sebastián Cid E8)
(4, 31, 'AMARILLA', 'VALIDA', 'seed'),
(4, 38, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 5: amarilla PP 41 (Marcos Rodríguez E1)
(5, 41, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 7: amarilla PP 63 (Jonathan Parra E4), amarilla PP 68 (Raúl Montes E6)
(7, 63, 'AMARILLA', 'VALIDA', 'seed'),
(7, 68, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 8: verde PP 76 (Marcos Rodríguez E1), roja PP 72 (Darío Carrasco E7)
(8, 76, 'VERDE',    'VALIDA', 'seed'),
(8, 72, 'ROJA',     'VALIDA', 'seed'),
-- Partido 9: amarilla PP 87 (Claudio Muñoz E8)
(9, 87, 'AMARILLA', 'VALIDA', 'seed'),
-- Partido 10: amarilla PP 93 (Julio Contreras E5)
(10, 93, 'AMARILLA', 'VALIDA', 'seed');

-- ============================================================
-- POSICIONES FINALES
-- E1: PJ=3 W=1 D=0 L=2 GF=4 GC=6 Pts=3
-- E2: PJ=3 W=0 D=1 L=2 GF=2 GC=4 Pts=1
-- E3: PJ=3 W=2 D=1 L=0 GF=5 GC=2 Pts=7
-- E4: PJ=2 W=1 D=1 L=0 GF=3 GC=2 Pts=4
-- E5: PJ=3 W=2 D=1 L=0 GF=5 GC=1 Pts=7
-- E6: PJ=2 W=0 D=0 L=2 GF=1 GC=5 Pts=0
-- E7: PJ=2 W=1 D=1 L=0 GF=5 GC=3 Pts=4
-- E8: PJ=2 W=0 D=1 L=1 GF=2 GC=4 Pts=1
-- ============================================================
INSERT INTO posicion
    (id_torneo, id_equipo, puntos, partidos_jugados, ganados, empatados, perdidos,
     goles_a_favor, goles_en_contra, creado_por)
VALUES
(1, 1, 3, 3, 1, 0, 2, 4, 6, 'seed'),
(1, 2, 1, 3, 0, 1, 2, 2, 4, 'seed'),
(1, 3, 7, 3, 2, 1, 0, 5, 2, 'seed'),
(1, 4, 4, 2, 1, 1, 0, 3, 2, 'seed'),
(1, 5, 7, 3, 2, 1, 0, 5, 1, 'seed'),
(1, 6, 0, 2, 0, 0, 2, 1, 5, 'seed'),
(1, 7, 4, 2, 1, 1, 0, 5, 3, 'seed'),
(1, 8, 1, 2, 0, 1, 1, 2, 4, 'seed');

COMMIT;
