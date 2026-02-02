BEGIN;

INSERT INTO persona (nombre, apellido, documento, fecha_nacimiento, genero)
VALUES
  -- Nahuel Femenino (equipo 1)
('María','González','30111222','1995-04-11', 'FEMENINO'),
('Florencia','Paredes','29888777','1994-09-14', 'FEMENINO'),
('Lucía','Martínez','31555111','1997-01-03', 'FEMENINO'),
('Carla','Sosa','30555444','1996-03-22', 'FEMENINO'),
('Antonella','Vega','32222111','1999-06-17', 'FEMENINO'),

-- Nahuel Masculino (equipo 2)
('Julián','Ramos','28999111','1993-12-02', 'MASCULINO'),
('Martín','Quiroga','27555999','1991-07-09', 'MASCULINO'),
('Pablo','Fernández','30111999','1995-08-21', 'MASCULINO'),
('Federico','Gaitán','31111333','1997-02-20', 'MASCULINO'),
('Santiago','Cárdenas','33322111','2000-05-01', 'MASCULINO'), 


-- Andino Femenino (equipo 3)
('Renata','Salcedo','29999111','1994-03-10', 'FEMENINO'),
('Lara','Pinto','31000999','1996-11-22', 'FEMENINO'),
('Sofía','Lagos','32233444','1999-01-19', 'FEMENINO'),
('Julieta','Alarcón','30122777','1995-04-04', 'FEMENINO'),
('Micaela','Del Río','31566111','1997-06-15', 'FEMENINO'),

-- Andino Masculino (equipo 4)
('Bruno','Iglesias','28888999','1993-10-12', 'MASCULINO'),
('Tomás','Funes','30000555','1995-09-23', 'MASCULINO'),
('Rodrigo','Paz','29555111','1994-07-06', 'MASCULINO'),
('Gabriel','Amado','31000123','1996-02-08', 'MASCULINO'),
('Leandro','Vega','32555111','2000-12-30', 'MASCULINO'),

-- Lagos Femenino (equipo 5)
('Agustina','Frías','30111444','1995-03-02', 'FEMENINO'),
('Camila','Lorenzo','31022333','1996-05-11', 'FEMENINO'),
('Paula','Guzmán','32033444','1998-10-17', 'FEMENINO'),
('Nadia','Beltrán','29987654','1994-06-20', 'FEMENINO'),
('Rocío','Diaz','31566777','1997-09-13', 'FEMENINO'),


-- Lagos Masculino (equipo 6)
('Diego','Herrera','30111000','1995-02-15', 'MASCULINO'),
('Facundo','Reyes','29888999','1994-04-18', 'MASCULINO'),
('Matías','Noriega','27555111','1991-01-29', 'MASCULINO'),
('Ignacio','Peralta','31555333','1997-07-07', 'MASCULINO'),
('Enzo','Cruz','33000444','1999-11-05', 'MASCULINO'),

-- Patagonia Femenino (equipo 7)
('Valentina','Córdoba','30555442','1996-03-25', 'FEMENINO'),
('Ailén','Bustamante','30011888','1995-12-09', 'FEMENINO'),
('Delfina','Molina','31555999','1997-08-30', 'FEMENINO'),
('Milagros','Pérez','32011223','1998-01-22', 'FEMENINO'),
('Brenda','Moreno','31000444','1996-04-17', 'FEMENINO'),

-- Patagonia Masculino (equipo 8)
('Cristian','Pardo','28555111','1990-09-29', 'MASCULINO'),
('Emiliano','Zárate','30111988','1995-04-14', 'MASCULINO'),
('Hernán','Cabral','29999100','1994-12-01', 'MASCULINO'),
('Nicolás','Ortiz','31599222','1997-03-09', 'MASCULINO'),
('Emanuel','García','33022111','2000-07-31', 'MASCULINO'),


-- DT 8 EN TOTAL

('Ana','López','40011223','1982-08-15', 'FEMENINO'),
('Miguel','Torres','41022344','1978-02-27','MASCULINO'),
('Sofía','Ramírez','40011334','1987-10-05', 'FEMENINO'),
('Jorge','Silva','42033455','1975-06-18', 'MASCULINO'),
('Elena','Vargas','40011445','1990-01-30', 'FEMENINO'),
('Ricardo','Molina','43044566','1983-11-11', 'MASCULINO'),
('Laura','Suárez','40011222','1985-05-12', 'FEMENINO'),
('Carlos','Méndez','41022333','1980-11-23', 'MASCULINO'),

-- ARBITROS 4 EN TOTAL

('Verónica','Castro','50011223','1985-09-09', 'FEMENINO'),
('Luis','Gómez','51022334','1979-03-15', 'MASCULINO'),
('Patricia','Rojas','50011345','1990-12-20', 'FEMENINO'),
('Fernando','Silva','52033456','1982-07-07', 'MASCULINO');


COMMIT;
