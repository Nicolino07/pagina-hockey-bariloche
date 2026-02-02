BEGIN;

INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
-- equipos id 1 y 2
(1,  'Nahuel Damas', 'B','FEMENINO', 'seed'),
(1,  'Nahuel Caballeros', 'A','MASCULINO', 'seed'),
-- equipos id 3 y 4
(2, 'Andino Damas', 'B','FEMENINO', 'seed'),
(2,  'Andino Caballeros', 'A', 'MASCULINO', 'seed'),
-- equipos id 5 y 6
(3, 'Lagos Damas', 'B','FEMENINO', 'seed'),
(3,  'Lagos Caballeros',  'A','MASCULINO', 'seed'),
-- equipos id 7 y 8
(4, 'Patagonia Damas', 'B', 'FEMENINO', 'seed'),
(4,  'Patagonia Caballeros', 'A', 'MASCULINO', 'seed');


COMMIT;

