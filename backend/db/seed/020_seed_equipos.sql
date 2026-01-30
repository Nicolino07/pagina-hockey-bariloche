BEGIN;

-- Damas
INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Damas', 'B','FEMENINO', 'seed'),
(2, 'Andino Damas', 'B','FEMENINO', 'seed'),
(3, 'Lagos Damas', 'B','FEMENINO', 'seed'),
(4, 'Patagonia Damas', 'B', 'FEMENINO', 'seed');

-- Caballeros

INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Caballeros', 'A','MASCULINO', 'seed'),
(2,  'Andino Caballeros', 'A', 'MASCULINO', 'seed'),
(3,  'Lagos Caballeros',  'A','MASCULINO', 'seed'),
(4,  'Patagonia Caballeros', 'A', 'MASCULINO', 'seed');

COMMIT;

