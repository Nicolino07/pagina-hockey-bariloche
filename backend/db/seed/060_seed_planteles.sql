BEGIN;

insert into plantel (id_equipo, creado_por) VALUES
-- Nahuel Femenino
    (1, 'seed'),
-- Nahuel Masculino             
    (2, 'seed'),
-- Andino Femenino
    (3, 'seed'),
-- Andino Masculino
    (4, 'seed'),
-- Lagos Femenino
    (5, 'seed'),
-- Lagos Masculino
    (6, 'seed'),
-- Patagonia Femenino
    (7, 'seed'),
-- Patagonia Masculino           
    (8, 'seed');

INSERT INTO plantel_integrante (id_plantel, id_persona, rol_en_plantel, creado_por) 
VALUES
-- Nahuel Damas
    (1, 1, 'JUGADOR', 'seed'),
    (1, 2, 'JUGADOR', 'seed'),
    (1, 3, 'JUGADOR', 'seed'),
    (1, 4, 'JUGADOR', 'seed'),
    (1, 5, 'JUGADOR', 'seed'),
-- Nahuel Masculino (equipo 2)
    (2, 6, 'JUGADOR', 'seed'),
    (2, 7, 'JUGADOR', 'seed'),
    (2, 8, 'JUGADOR', 'seed'),
    (2, 9, 'JUGADOR', 'seed'),
    (2, 10, 'JUGADOR', 'seed'),
-- Andino Femenino (equipo 3)
    (3, 11, 'JUGADOR', 'seed'),
    (3, 12, 'JUGADOR', 'seed'),
    (3, 13, 'JUGADOR', 'seed'),
    (3, 14, 'JUGADOR', 'seed'),
    (3, 15, 'JUGADOR', 'seed'),
-- Andino Masculino (equipo 4)
    (4, 16, 'JUGADOR', 'seed'),
    (4, 17, 'JUGADOR', 'seed'),
    (4, 18, 'JUGADOR', 'seed'),
    (4, 19, 'JUGADOR', 'seed'),
    (4, 20, 'JUGADOR', 'seed'),
-- Lagos Femenino (equipo 5)
    (5, 21, 'JUGADOR', 'seed'),
    (5, 22, 'JUGADOR', 'seed'),
    (5, 23, 'JUGADOR', 'seed'),
    (5, 24, 'JUGADOR', 'seed'),
    (5, 25, 'JUGADOR', 'seed'),
-- Lagos Masculino (equipo 6)
    (6, 26, 'JUGADOR', 'seed'),
    (6, 27, 'JUGADOR', 'seed'),
    (6, 28, 'JUGADOR', 'seed'),
    (6, 29, 'JUGADOR', 'seed'),
    (6, 30, 'JUGADOR', 'seed'),
-- Patagonia Femenino (equipo 7)
    (7, 31, 'JUGADOR', 'seed'),
    (7, 32, 'JUGADOR', 'seed'),
    (7, 33, 'JUGADOR', 'seed'),
    (7, 34, 'JUGADOR', 'seed'),
    (7, 35, 'JUGADOR', 'seed'), 
-- Patagonia Masculino (equipo 8)
    (8, 36, 'JUGADOR', 'seed'),
    (8, 37, 'JUGADOR', 'seed'),
    (8, 38, 'JUGADOR', 'seed'),
    (8, 39, 'JUGADOR', 'seed'),
    (8, 40, 'JUGADOR', 'seed');

COMMIT;

