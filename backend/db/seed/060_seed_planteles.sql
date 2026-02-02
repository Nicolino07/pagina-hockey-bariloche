BEGIN;


insert into plantel (id_equipo, nombre, temporada, descripcion, creado_por) VALUES
-- Nahuel Femenino
    (1, 'Nahuel Femenino', '2024', 'Plantel de prueba para Nahuel Femenino', 'seed'),
-- Nahuel Masculino
    (2, 'Nahuel Masculino', '2024', 'Plantel de prueba para Nahuel Masculino', 'seed'),
-- Andino Femenino
    (3, 'Andino Femenino', '2024', 'Plantel de prueba para Andino Femenino', 'seed'),
-- Andino Masculino
    (4, 'Andino Masculino', '2024', 'Plantel de prueba para Andino Masculino', 'seed'),
-- Lagos Femenino
    (5, 'Lagos Femenino', '2024', 'Plantel de prueba para Lagos Femenino', 'seed'),
-- Lagos Masculino
    (6, 'Lagos Masculino', '2024', 'Plantel de prueba para Lagos Masculino', 'seed'),
-- Patagonia Femenino
    (7, 'Patagonia Femenino', '2024', 'Plantel de prueba para Patagonia Femenino', 'seed'),
-- Patagonia Masculino           
    (8, 'Patagonia Masculino', '2024', 'Plantel de prueba para Patagonia Masculino', 'seed');

INSERT INTO plantel_integrante (id_plantel, id_persona, rol_en_plantel, creado_por) 
VALUES
-- FEMENINO 1
    (1, 1, 'JUGADOR', 'seed'),
    (1, 2, 'JUGADOR', 'seed'),
    (1, 3, 'JUGADOR', 'seed'),
    (1, 4, 'JUGADOR', 'seed'),
    (1, 5, 'JUGADOR', 'seed'),
    (1, 41, 'DT', 'seed'),

-- MASCULINO 1
    (2, 6, 'JUGADOR', 'seed'),
    (2, 7, 'JUGADOR', 'seed'),
    (2, 8, 'JUGADOR', 'seed'),
    (2, 9, 'JUGADOR', 'seed'),
    (2, 10, 'JUGADOR', 'seed'),
    (2, 42, 'DT', 'seed'),

-- FEMENINO 2
    (3, 11, 'JUGADOR', 'seed'),
    (3, 12, 'JUGADOR', 'seed'),
    (3, 13, 'JUGADOR', 'seed'),                     
    (3, 14, 'JUGADOR', 'seed'),
    (3, 15, 'JUGADOR', 'seed'),
    (3, 43, 'DT', 'seed'),

-- MASCULINO 2  
    (4, 16, 'JUGADOR', 'seed'),
    (4, 17, 'JUGADOR', 'seed'),
    (4, 18, 'JUGADOR', 'seed'),
    (4, 19, 'JUGADOR', 'seed'),
    (4, 20, 'JUGADOR', 'seed'),
    (4, 44, 'DT', 'seed'),

-- FEMENINO 3
    (5, 21, 'JUGADOR', 'seed'),
    (5, 22, 'JUGADOR', 'seed'),
    (5, 23, 'JUGADOR', 'seed'),
    (5, 24, 'JUGADOR', 'seed'),
    (5, 25, 'JUGADOR', 'seed'),
    (5, 45, 'DT', 'seed'),

-- MASCULINO 3
    (6, 26, 'JUGADOR', 'seed'),
    (6, 27, 'JUGADOR', 'seed'),
    (6, 28, 'JUGADOR', 'seed'),
    (6, 29, 'JUGADOR', 'seed'),         
    (6, 30, 'JUGADOR', 'seed'),
    (6, 46, 'DT', 'seed'),

-- FEMENINO 4
    (7, 31, 'JUGADOR', 'seed'),
    (7, 32, 'JUGADOR', 'seed'),
    (7, 33, 'JUGADOR', 'seed'),
    (7, 34, 'JUGADOR', 'seed'),
    (7, 35, 'JUGADOR', 'seed'),
    (7, 47, 'DT', 'seed'),

-- MASCULINO 4
    (8, 36, 'JUGADOR', 'seed'),
    (8, 37, 'JUGADOR', 'seed'),
    (8, 38, 'JUGADOR', 'seed'),
    (8, 39, 'JUGADOR', 'seed'),
    (8, 40, 'JUGADOR', 'seed'),
    (8, 48, 'DT', 'seed');

COMMIT;

