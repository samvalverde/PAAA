-- =====================================================
-- 02-users.sql
-- Inicialización de datos de prueba para PAAA Backend
-- =====================================================

-- ====== Schools ======
INSERT INTO schools (school_name)
VALUES 
  ('Escuela de Ingeniería en Computación'),
  ('Escuela de Ingeniería Electrónica'),
  ('Escuela de Ingeniería en Producción Industrial'),
  ('Escuela de Ingeniería en Mecatrónica'),
  ('Escuela de Ingeniería en Materiales'),
  ('Escuela de Administración de Tecnologías de Información'),
  ('Escuela de Ciencias Sociales')
ON CONFLICT (school_name) DO NOTHING;

-- ====== Careers ======
INSERT INTO careers (career_name, school_id)
VALUES
  ('Ingeniería en Computación', (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación')),
  ('Ingeniería en Electrónica', (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica')),
  ('Ingeniería en Producción Industrial', (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Producción Industrial')),
  ('Ingeniería en Mecatrónica', (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Mecatrónica')),
  ('Ingeniería en Materiales', (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Materiales')),
  ('Administración de Tecnología de Información', (SELECT id FROM schools WHERE school_name = 'Escuela de Administración de Tecnologías de Información')),
  ('Gestión del Turismo Sostenible', (SELECT id FROM schools WHERE school_name = 'Escuela de Ciencias Sociales'))
ON CONFLICT (career_name) DO NOTHING;

-- ====== User Types / Roles ======
INSERT INTO user_types (type_name)
VALUES
  ('admin'),
  ('colaborador'),
  ('visor')
ON CONFLICT (type_name) DO NOTHING;

-- ====== Permissions (opcional si la tabla existe) ======
INSERT INTO permissions (permission_name, description)
VALUES
  ('view_processes', 'Puede ver los procesos del sistema'),
  ('edit_processes', 'Puede crear o modificar procesos'),
  ('delete_processes', 'Puede eliminar procesos'),
  ('manage_users', 'Puede administrar usuarios y roles')
ON CONFLICT (permission_name) DO NOTHING;

-- ====== Usuarios ======
-- Hash bcrypt válido para "changeme"
-- "$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G"

INSERT INTO users (username, email, password_hash, user_type_id, school_id, created_at)
VALUES
  ('maria.admin',   'maria.admin@example.com',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'admin'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   NOW()),

   ('samuel.admin',   'samuel.admin@example.com',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'admin'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   NOW()),

  ('juan.colab',    'juan.colab@example.com',    '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'colaborador'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   NOW()),

   ('andrea.colab',    'andrea.colab@example.com',    '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'colaborador'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   NOW()),

  ('ana.visor',     'ana.visor@example.com',     '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'visor'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   NOW()),

  ('roberto.colab', 'roberto.colab@example.com', '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'colaborador'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   NOW()),

  ('elena.visor',   'elena.visor@example.com',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   (SELECT id FROM user_types WHERE type_name = 'visor'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   NOW())
ON CONFLICT (email) DO NOTHING;

-- ====== Procesos ======
-- Se vinculan con usuarios mediante SELECT dinámico
-- Estado puede ser: 'pendiente', 'en_progreso', 'completado'

INSERT INTO processes (process_name, school_id, encargado_id, estado, created_at, updated_at)
VALUES
  ('Acreditación 2025',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   (SELECT id FROM users WHERE username = 'juan.colab'),
   'pendiente', NOW(), NOW()),

  ('Autoevaluación 2025',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   (SELECT id FROM users WHERE username = 'andrea.colab'),
   'completado', NOW(), NOW()),

  ('Plan de mejora 2026',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   (SELECT id FROM users WHERE username = 'roberto.colab'),
   'en_progreso', NOW(), NOW())
ON CONFLICT (process_name) DO NOTHING;
