
BEGIN;

INSERT INTO usuario (username, email, password_hash, tipo, creado_por) VALUES
(
  'Nicolas_root',
  'elias.nicolas.vargas@gmail.com',
  '$argon2id$v=19$m=65536,t=3,p=4$HmPM+R8DoDTmvPf+PyfEuA$DtmLJsfLhdIfkYTWx8VEy8EWIE6I8ejI2TTUHXGibI8',
  'SUPERUSUARIO',
  'sistema_init'
),
(
  -- Usuario de prueba para el panel de designación de árbitros.
  -- Credenciales: arbitro@test.com / admin1234
  'arbitro_test',
  'arbitro@test.com',
  '$argon2id$v=19$m=65536,t=3,p=4$yRkjBGBsLQUg5BwjZKy1Vg$zfjEyKwmOvLacVJWQKwq6fwkDCsAvE5m/NCvuc3GUIs',
  'ADMIN_ARBITROS',
  'sistema_init'
);

COMMIT;


