BEGIN;

INSERT INTO persona (nombre, apellido, documento, fecha_nacimiento, genero)
VALUES
  -- Nahuel Femenino (equipo 1)
('María','González','30111222','1995-04-11', 'Femenino'),
('Florencia','Paredes','29888777','1994-09-14', 'Femenino'),
('Lucía','Martínez','31555111','1997-01-03', 'Femenino'),
('Carla','Sosa','30555444','1996-03-22', 'Femenino'),
('Antonella','Vega','32222111','1999-06-17', 'Femenino'),
-- Nahuel Masculino (equipo 2)
('Julián','Ramos','28999111','1993-12-02', 'Masculino'),
('Martín','Quiroga','27555999','1991-07-09', 'Masculino'),
('Pablo','Fernández','30111999','1995-08-21', 'Masculino'),
('Federico','Gaitán','31111333','1997-02-20', 'Masculino'),
('Santiago','Cárdenas','33322111','2000-05-01', 'Masculino'), -- esta persona tambien es usuario id_persona = 10
-- Andino Femenino (equipo 3)
('Renata','Salcedo','29999111','1994-03-10', 'Femenino'),
('Lara','Pinto','31000999','1996-11-22', 'Femenino'),
('Sofía','Lagos','32233444','1999-01-19', 'Femenino'),
('Julieta','Alarcón','30122777','1995-04-04', 'Femenino'),
('Micaela','Del Río','31566111','1997-06-15', 'Femenino'),
-- Andino Masculino (equipo 4)
('Bruno','Iglesias','28888999','1993-10-12', 'Masculino'),
('Tomás','Funes','30000555','1995-09-23', 'Masculino'),
('Rodrigo','Paz','29555111','1994-07-06', 'Masculino'),
('Gabriel','Amado','31000123','1996-02-08', 'Masculino'),
('Leandro','Vega','32555111','2000-12-30', 'Masculino'),

-- Lagos Femenino (equipo 5)
('Agustina','Frías','30111444','1995-03-02', 'Femenino'),
('Camila','Lorenzo','31022333','1996-05-11', 'Femenino'),
('Paula','Guzmán','32033444','1998-10-17', 'Femenino'),
('Nadia','Beltrán','29987654','1994-06-20', 'Femenino'),
('Rocío','Diaz','31566777','1997-09-13', 'Femenino'),

-- Lagos Masculino (equipo 6)
('Diego','Herrera','30111000','1995-02-15', 'Masculino'),
('Facundo','Reyes','29888999','1994-04-18', 'Masculino'),
('Matías','Noriega','27555111','1991-01-29', 'Masculino'),
('Ignacio','Peralta','31555333','1997-07-07', 'Masculino'),
('Enzo','Cruz','33000444','1999-11-05', 'Masculino'),

-- Patagonia Femenino (equipo 7)
('Valentina','Córdoba','30555442','1996-03-25', 'Femenino'),
('Ailén','Bustamante','30011888','1995-12-09', 'Femenino'),
('Delfina','Molina','31555999','1997-08-30', 'Femenino'),
('Milagros','Pérez','32011223','1998-01-22', 'Femenino'),
('Brenda','Moreno','31000444','1996-04-17', 'Femenino'),

-- Patagonia Masculino (equipo 8)
('Cristian','Pardo','28555111','1990-09-29', 'Masculino'),
('Emiliano','Zárate','30111988','1995-04-14', 'Masculino'),
('Hernán','Cabral','29999100','1994-12-01', 'Masculino'),
('Nicolás','Ortiz','31599222','1997-03-09', 'Masculino'),
('Emanuel','García','33022111','2000-07-31', 'Masculino');

COMMIT;
