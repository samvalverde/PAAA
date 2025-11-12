BEGIN;

-- ======== Catálogos básicos ========

-- Tipos de usuario
INSERT INTO user_types (type_name) VALUES
  ('admin'),
  ('coordinador'),
  ('visor')
ON CONFLICT (type_name) DO NOTHING;

-- Escuelas (Hay que revisar todas las escuelas)
INSERT INTO schools (school_name) VALUES
  ('Escuela de Ingeniería en Computación'),
  ('Escuela de Matemática'),
  ('Escuela de Electrónica')
ON CONFLICT (school_name) DO NOTHING;

-- Tipos de acción (para auditoría)
INSERT INTO action_types (type_name) VALUES
  ('create'),
  ('update'),
  ('delete'),
  ('upload'),
  ('login')
ON CONFLICT (type_name) DO NOTHING;

-- Acciones (catálogo, se puede añadir control de usuarios)
INSERT INTO actions (action_type_id, action_name, description)
VALUES
  ((SELECT id FROM action_types WHERE type_name='create'), 'crear_proceso', 'Creación de proceso'),
  ((SELECT id FROM action_types WHERE type_name='update'), 'editar_proceso', 'Edición de proceso'),
  ((SELECT id FROM action_types WHERE type_name='delete'), 'eliminar_proceso', 'Eliminación de proceso'),
  ((SELECT id FROM action_types WHERE type_name='upload'), 'subir_documento', 'Carga de documento a MinIO'),
  ((SELECT id FROM action_types WHERE type_name='login'),  'login_usuario', 'Inicio de sesión')
ON CONFLICT (action_name) DO NOTHING;

-- Procesos por escuela (ejemplos)
INSERT INTO processes (process_name, school_id)
VALUES
  ('Acreditación 2025', (SELECT id FROM schools WHERE school_name='Escuela de Ingeniería en Computación')),
  ('Autoevaluación 2025', (SELECT id FROM schools WHERE school_name='Escuela de Ingeniería en Computación')),
  ('Acreditación 2025', (SELECT id FROM schools WHERE school_name='Escuela de Matemática')),
  ('Acreditación 2025', (SELECT id FROM schools WHERE school_name='Escuela de Electrónica'))
ON CONFLICT (process_name) DO NOTHING;

-- ======== Usuarios (10) ========
-- Contraseñas temporales
WITH
  ut AS (
    SELECT
      (SELECT id FROM user_types WHERE type_name='admin')        AS admin_id,
      (SELECT id FROM user_types WHERE type_name='coordinador')  AS coord_id,
      (SELECT id FROM user_types WHERE type_name='visor')        AS visor_id
  ),
  sc AS (
    SELECT
      (SELECT id FROM schools WHERE school_name='Escuela de Ingeniería en Computación') AS eic_id,
      (SELECT id FROM schools WHERE school_name='Escuela de Matemática')                AS mat_id,
      (SELECT id FROM schools WHERE school_name='Escuela de Electrónica')              AS elec_id
  )
INSERT INTO users (username, email, password_hash, user_type_id, school_id)
SELECT * FROM (
  VALUES
    ('maria.admin',   'maria.admin@example.com',   'changeme', (SELECT admin_id FROM ut), (SELECT eic_id FROM sc)),
    ('carla.admin',   'carla.admin@example.com',   'changeme', (SELECT admin_id FROM ut), (SELECT mat_id FROM sc)),
    ('laura.admin',   'laura.admin@example.com',   'changeme', (SELECT admin_id FROM ut), (SELECT elec_id FROM sc)),

    ('juan.coord',    'juan.coord@example.com',    'changeme', (SELECT coord_id FROM ut), (SELECT eic_id FROM sc)),
    ('luis.coord',    'luis.coord@example.com',    'changeme', (SELECT coord_id FROM ut), (SELECT mat_id FROM sc)),
    ('sofia.coord',   'sofia.coord@example.com',   'changeme', (SELECT coord_id FROM ut), (SELECT elec_id FROM sc)),
    ('ana.visor',     'ana.visor@example.com',     'changeme', (SELECT visor_id FROM ut), (SELECT eic_id FROM sc)),
    ('pedro.visor',   'pedro.visor@example.com',   'changeme', (SELECT visor_id FROM ut), (SELECT mat_id FROM sc)),
    ('diego.visor',   'diego.visor@example.com',   'changeme', (SELECT visor_id FROM ut), (SELECT elec_id FROM sc)),
    ('andres.visor',  'andres.visor@example.com',  'changeme', (SELECT visor_id FROM ut), (SELECT eic_id FROM sc))
) AS t(username, email, password_hash, user_type_id, school_id)
ON CONFLICT (email) DO NOTHING;

COMMIT;
