-- =====================================================
-- 000_init_database.sql
-- Orquestador de schema Pagina Hockey
-- Se ejecuta automáticamente por Docker
-- =====================================================

\echo '== Iniciando schema =='

\i /docker-entrypoint-initdb.d/init/001_enums.sql
\i /docker-entrypoint-initdb.d/init/002_tables.sql
\i /docker-entrypoint-initdb.d/init/003_tables_extra.sql
\i /docker-entrypoint-initdb.d/init/004_functions.sql
\i /docker-entrypoint-initdb.d/init/005_triggers.sql
\i /docker-entrypoint-initdb.d/init/006_views.sql
\i /docker-entrypoint-initdb.d/init/007_grants.sql
\i /docker-entrypoint-initdb.d/init/008_auditoria.sql
\i /docker-entrypoint-initdb.d/init/009_index.sql

\echo '== Iniciando seeds =='

\i /docker-entrypoint-initdb.d/seed/070_seed_usuarios.sql



\echo '== Base inicializada correctamente =='
