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
  ('admin',   'admin@paaa.itcr.ac.cr',   '$2b$12$dCqPXxEl0bGHPmSkEogcIOADJZX9lbVtFY6wVOTb24GyaH.Ws3F8G',
   '+50625502222',
   (SELECT id FROM user_types WHERE type_name = 'admin'),
   (SELECT id FROM schools WHERE school_name = 'Escuela de Ingeniería en Computación'),
   TRUE,
   NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Asegura que la columna `school_id` exista (para esquemas ya creados previamente)
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS school_id BIGINT;
-- ====== Tipos de Acción ======
INSERT INTO action_types (name, description)
VALUES
  -- Action types en inglés para compatibilidad con frontend
  ('Create', 'Create a new resource'),
  ('Update', 'Update an existing resource'),
  ('Delete', 'Delete a resource'),
  ('Read', 'Read/view a resource'),
  ('Approve', 'Approve a request or action'),
  ('Reject', 'Reject a request or action'),
  ('Submit', 'Submit a request or document'),
  ('Review', 'Review a document or request'),
  ('Login', 'User login'),
  ('Register', 'User registration'),
  ('Upload', 'File upload'),
  ('Download', 'File download'),
  
  -- Action types en español para compatibilidad con datos existentes
  ('crear_proceso', 'Creación de un nuevo proceso'),
  ('modificar_proceso', 'Modificación de un proceso existente'),
  ('eliminar_proceso', 'Eliminación de un proceso'),
  ('asignar_encargado', 'Asignación de un encargado a un proceso')
ON CONFLICT (name) DO NOTHING;

