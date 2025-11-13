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

-- ====== Permissions ======
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
INSERT INTO users (username, email, password_hash, phone_number, user_type_id, school_id, is_active, created_at, updated_at)
VALUES
  ('maria.admin',   'maria.admin@example.com',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880001',
   (SELECT id FROM user_types WHERE type_name = 'admin'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   TRUE,
   NOW(), NOW()),

  ('samuel.admin',  'samuel.admin@example.com',  '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880002',
   (SELECT id FROM user_types WHERE type_name = 'admin'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   TRUE,
   NOW(), NOW()),

  ('juan.colab',    'juan.colab@example.com',    '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880003',
   (SELECT id FROM user_types WHERE type_name = 'colaborador'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   TRUE,
   NOW(), NOW()),

  ('ana.visor',     'ana.visor@example.com',     '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880004',
   (SELECT id FROM user_types WHERE type_name = 'visor'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   TRUE,
   NOW(), NOW()),

  ('roberto.colab', 'roberto.colab@example.com', '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880005',
   (SELECT id FROM user_types WHERE type_name = 'colaborador'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   TRUE,
   NOW(), NOW()),

  ('elena.visor',   'elena.visor@example.com',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50688880006',
   (SELECT id FROM user_types WHERE type_name = 'visor'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   TRUE,
   NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ====== Procesos ======
INSERT INTO processes (process_name, school_id, encargado_id, estado, created_at, updated_at)
VALUES
  ('Acreditación 2025',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   (SELECT id FROM users WHERE username = 'juan.colab'),
   'Pendiente', NOW(), NOW()),

  ('Autoevaluación 2025',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   (SELECT id FROM users WHERE username = 'maria.admin'),
   'Completado', NOW(), NOW()),

  ('Plan de mejora 2026',
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería Electrónica'),
   (SELECT id FROM users WHERE username = 'roberto.colab'),
   'En_proceso', NOW(), NOW())
ON CONFLICT (process_name) DO NOTHING;

-- ====== Tipos de Acción ======
INSERT INTO action_types (name, description)
VALUES
  ('crear_proceso', 'Creación de un nuevo proceso'),
  ('modificar_proceso', 'Modificación de un proceso existente'),
  ('eliminar_proceso', 'Eliminación de un proceso'),
  ('asignar_encargado', 'Asignación de un encargado a un proceso')
ON CONFLICT (name) DO NOTHING;

-- ====== Acciones ======
INSERT INTO actions (user_id, process_id, action_type_id, timestamp)
VALUES
  (
    (SELECT id FROM users WHERE username = 'maria.admin'),
    (SELECT id FROM processes WHERE process_name = 'Autoevaluación 2025'),
    (SELECT id FROM action_types WHERE name = 'crear_proceso'),
    NOW()
  ),
  ( 
    (SELECT id FROM users WHERE username = 'juan.colab'),
    (SELECT id FROM processes WHERE process_name = 'Acreditación 2025'),
    (SELECT id FROM action_types WHERE name = 'asignar_encargado'),
    NOW()
  ),
  (
    (SELECT id FROM users WHERE username = 'roberto.colab'),
    (SELECT id FROM processes WHERE process_name = 'Plan de mejora 2026'),
    (SELECT id FROM action_types WHERE name = 'modificar_proceso'),
    NOW()
  )