

INSERT INTO club (id_club, nombre, provincia, ciudad) VALUES
(1, 'Club Deportivo Nahuel', 'Rio Negro', 'Bariloche'),
(2, 'Andino Hockey Club', 'Rio Negro','Bariloche'),
(3, 'Lagos del Sur HC','Rio Negro', 'Bariloche'),
(4, 'Patagonia Norte Hockey', 'Rio Negro', 'Dina Huapi');


INSERT INTO equipo ( id_club, nombre, genero, categoria) VALUES
(1, 'Nahuel Femenino',  'Femenino',  'Damas A'),
(1, 'Nahuel Masculino', 'Masculino', 'Caballeros A'),

(2, 'Andino Femenino',  'Femenino',  'Damas A'),
(2, 'Andino Masculino', 'Masculino', 'Caballeros A'),

(3, 'Lagos Femenino',   'Femenino',  'Damas A'),
(3, 'Lagos Masculino',  'Masculino', 'Caballeros A'),

(4, 'Patagonia Femenino','Femenino', 'Damas A'),
(4, 'Patagonia Masculino','Masculino','Caballeros A');

INSERT INTO persona (id_persona, nombre, apellido, dni, fecha_nacimiento, genero) VALUES
-- Nahuel Femenino (equipo 1)
(1,'María','González','30111222','1995-04-11', 'Femenino'),
(2,'Florencia','Paredes','29888777','1994-09-14', 'Femenino'),
(3,'Lucía','Martínez','31555111','1997-01-03', 'Femenino'),
(4,'Carla','Sosa','30555444','1996-03-22', 'Femenino'),
(5,'Antonella','Vega','32222111','1999-06-17', 'Femenino'),

-- Nahuel Masculino (equipo 2)
(6,'Julián','Ramos','28999111','1993-12-02', 'Masculino'),
(7,'Martín','Quiroga','27555999','1991-07-09', 'Masculino'),
(8,'Pablo','Fernández','30111999','1995-08-21', 'Masculino'),
(9,'Federico','Gaitán','31111333','1997-02-20', 'Masculino'),
(10,'Santiago','Cárdenas','33322111','2000-05-01', 'Masculino'),

-- Andino Femenino (equipo 3)
(11,'Renata','Salcedo','29999111','1994-03-10', 'Femenino'),
(12,'Lara','Pinto','31000999','1996-11-22', 'Femenino'),
(13,'Sofía','Lagos','32233444','1999-01-19', 'Femenino'),
(14,'Julieta','Alarcón','30122777','1995-04-04', 'Femenino'),
(15,'Micaela','Del Río','31566111','1997-06-15', 'Femenino'),

-- Andino Masculino (equipo 4)
(16,'Bruno','Iglesias','28888999','1993-10-12', 'Masculino'),
(17,'Tomás','Funes','30000555','1995-09-23', 'Masculino'),
(18,'Rodrigo','Paz','29555111','1994-07-06', 'Masculino'),
(19,'Gabriel','Amado','31000123','1996-02-08', 'Masculino'),
(20,'Leandro','Vega','32555111','2000-12-30', 'Masculino'),

-- Lagos Femenino (equipo 5)
(21,'Agustina','Frías','30111444','1995-03-02', 'Femenino'),
(22,'Camila','Lorenzo','31022333','1996-05-11', 'Femenino'),
(23,'Paula','Guzmán','32033444','1998-10-17', 'Femenino'),
(24,'Nadia','Beltrán','29987654','1994-06-20', 'Femenino'),
(25,'Rocío','Diaz','31566777','1997-09-13', 'Femenino'),

-- Lagos Masculino (equipo 6)
(26,'Diego','Herrera','30111000','1995-02-15', 'Masculino'),
(27,'Facundo','Reyes','29888999','1994-04-18', 'Masculino'),
(28,'Matías','Noriega','27555111','1991-01-29', 'Masculino'),
(29,'Ignacio','Peralta','31555333','1997-07-07', 'Masculino'),
(30,'Enzo','Cruz','33000444','1999-11-05', 'Masculino'),

-- Patagonia Femenino (equipo 7)
(31,'Valentina','Córdoba','30555442','1996-03-25', 'Femenino'),
(32,'Ailén','Bustamante','30011888','1995-12-09', 'Femenino'),
(33,'Delfina','Molina','31555999','1997-08-30', 'Femenino'),
(34,'Milagros','Pérez','32011223','1998-01-22', 'Femenino'),
(35,'Brenda','Moreno','31000444','1996-04-17', 'Femenino'),

-- Patagonia Masculino (equipo 8)
(36,'Cristian','Pardo','28555111','1990-09-29', 'Masculino'),
(37,'Emiliano','Zárate','30111988','1995-04-14', 'Masculino'),
(38,'Hernán','Cabral','29999100','1994-12-01', 'Masculino'),
(39,'Nicolás','Ortiz','31599222','1997-03-09', 'Masculino'),
(40,'Emanuel','García','33022111','2000-07-31', 'Masculino');

INSERT INTO persona_rol (id_persona, rol) VALUES
(1,'jugador'),
(2,'jugador'),
(4,'jugador'),
(5,'jugador'),
(6,'jugador'),
(7,'jugador'),
(8,'jugador'),
(9,'jugador'),
(10,'jugador'),
(11,'jugador'),
(12,'jugador'),
(13,'jugador'),
(14,'jugador'),
(15,'jugador'),
(16,'jugador'),
(17,'jugador'),
(18,'jugador'),
(19,'jugador'),
(20,'jugador'),
(21,'jugador'),
(22,'jugador'),
(23,'jugador'),
(24,'jugador'),
(25,'jugador'),
(26,'jugador'),
(27,'jugador'),
(28,'jugador'),
(29,'jugador'),
(30,'jugador'),
(31,'jugador'),
(32,'jugador'),
(33,'jugador'),
(34,'jugador'),
(35,'jugador'),
(36,'jugador'),
(37,'jugador'),
(38,'jugador'),
(39,'jugador'),
(40,'jugador');
