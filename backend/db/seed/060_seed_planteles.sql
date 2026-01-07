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
    (1, 1, 'jugador', 'seed'),
    (1, 2, 'jugador', 'seed'),
    (1, 3, 'jugador', 'seed'),
    (1, 4, 'jugador', 'seed'),
    (1, 5, 'jugador', 'seed'),
-- Nahuel Masculino (equipo 2)
    (2, 6, 'jugador', 'seed'),
    (2, 7, 'jugador', 'seed'),
    (2, 8, 'jugador', 'seed'),
    (2, 9, 'jugador', 'seed'),
    (2, 10, 'jugador', 'seed'),
-- Andino Femenino (equipo 3)
    (3, 11, 'jugador', 'seed'),
    (3, 12, 'jugador', 'seed'),
    (3, 13, 'jugador', 'seed'),
    (3, 14, 'jugador', 'seed'),
    (3, 15, 'jugador', 'seed'),
-- Andino Masculino (equipo 4)
    (4, 16, 'jugador', 'seed'),
    (4, 17, 'jugador', 'seed'),
    (4, 18, 'jugador', 'seed'),
    (4, 19, 'jugador', 'seed'),
    (4, 20, 'jugador', 'seed'),
-- Lagos Femenino (equipo 5)
    (5, 21, 'jugador', 'seed'),
    (5, 22, 'jugador', 'seed'),
    (5, 23, 'jugador', 'seed'),
    (5, 24, 'jugador', 'seed'),
    (5, 25, 'jugador', 'seed'),
-- Lagos Masculino (equipo 6)
    (6, 26, 'jugador', 'seed'),
    (6, 27, 'jugador', 'seed'),
    (6, 28, 'jugador', 'seed'),
    (6, 29, 'jugador', 'seed'),
    (6, 30, 'jugador', 'seed'),
-- Patagonia Femenino (equipo 7)
    (7, 31, 'jugador', 'seed'),
    (7, 32, 'jugador', 'seed'),
    (7, 33, 'jugador', 'seed'),
    (7, 34, 'jugador', 'seed'),
    (7, 35, 'jugador', 'seed'), 
-- Patagonia Masculino (equipo 8)
    (8, 36, 'jugador', 'seed'),
    (8, 37, 'jugador', 'seed'),
    (8, 38, 'jugador', 'seed'),
    (8, 39, 'jugador', 'seed'),
    (8, 40, 'jugador', 'seed');

COMMIT;

