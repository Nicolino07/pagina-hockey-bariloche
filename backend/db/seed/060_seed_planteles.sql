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

INSERT INTO plantel_integrante (id_plantel, id_persona, id_fichaje_rol, rol_en_plantel, creado_por) 
VALUES
-- FEMENINO 1
    (1, 1, 1,'JUGADOR', 'seed'),
    (1, 2, 2,'JUGADOR', 'seed'),
    (1, 3, 3,'JUGADOR', 'seed'),
    (1, 4, 4,'JUGADOR', 'seed'),
    (1, 5, 5,'JUGADOR', 'seed'),
    (1, 41, 6,'DT', 'seed'),
-- MASCULINO 1
    (2, 6, 7,'JUGADOR', 'seed'),
    (2, 7, 8,'JUGADOR', 'seed'),
    (2, 8, 9,'JUGADOR', 'seed'),
    (2, 9, 10,'JUGADOR', 'seed'),
    (2, 10, 11,'JUGADOR', 'seed'),
    (2, 42, 12,'DT', 'seed'),

-- FEMENINO 2
    (3, 11, 13,'JUGADOR', 'seed'),
    (3, 12, 14,'JUGADOR', 'seed'),
    (3, 13, 15,'JUGADOR', 'seed'),                     
    (3, 14, 16,'JUGADOR', 'seed'),
    (3, 15, 17,'JUGADOR', 'seed'),
    (3, 43, 18,'DT', 'seed'),

-- MASCULINO 2  
    (4, 16, 19,'JUGADOR', 'seed'),
    (4, 17, 20,'JUGADOR', 'seed'),
    (4, 18, 21,'JUGADOR', 'seed'),
    (4, 19, 22,'JUGADOR', 'seed'),
    (4, 20, 23,'JUGADOR', 'seed'),
    (4, 44, 24,'DT', 'seed'),

-- FEMENINO 3
    (5, 21, 25,'JUGADOR', 'seed'),
    (5, 22, 26,'JUGADOR', 'seed'),
    (5, 23, 27,'JUGADOR', 'seed'),
    (5, 24, 28,'JUGADOR', 'seed'),
    (5, 25, 29,'JUGADOR', 'seed'),
    (5, 45, 30,'DT', 'seed'),

-- MASCULINO 3
    (6, 26, 31,'JUGADOR', 'seed'),
    (6, 27, 32,'JUGADOR', 'seed'),
    (6, 28, 33,'JUGADOR', 'seed'),
    (6, 29, 34,'JUGADOR', 'seed'),         
    (6, 30, 35,'JUGADOR', 'seed'),
    (6, 46, 36,'DT', 'seed'),
-- FEMENINO 4
    (7, 31, 37,'JUGADOR', 'seed'),
    (7, 32, 38,'JUGADOR', 'seed'),
    (7, 33, 39,'JUGADOR', 'seed'),
    (7, 34, 40,'JUGADOR', 'seed'),
    (7, 35, 41,'JUGADOR', 'seed'),
    (7, 47, 42,'DT', 'seed'),

-- MASCULINO 4
    (8, 36, 43,'JUGADOR', 'seed'),
    (8, 37, 44,'JUGADOR', 'seed'),
    (8, 38, 45,'JUGADOR', 'seed'),
    (8, 39, 46,'JUGADOR', 'seed'),
    (8, 40, 47,'JUGADOR', 'seed'),
    (8, 48, 48,'DT', 'seed');

COMMIT;

