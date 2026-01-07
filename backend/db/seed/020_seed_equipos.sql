BEGIN;

-- Damas
INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Damas', 'A','Femenino', 'seed'),
(2, 'Andino Damas', 'A','Femenino', 'seed'),
(3, 'Lagos Damas', 'A','Femenino', 'seed'),
(4, 'Patagonia Damas', 'A', 'Femenino', 'seed');

-- Caballeros

INSERT INTO equipo (id_club, nombre, categoria, genero, creado_por) VALUES
(1,  'Nahuel Caballeros', 'A','Masculino', 'seed'),
(2,  'Andino Caballeros', 'A', 'Masculino', 'seed'),
(3,  'Lagos Caballeros',  'A','Masculino', 'seed'),
(4,  'Patagonia Caballeros', 'A', 'Masculino', 'seed');

COMMIT;

