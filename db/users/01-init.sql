-- =====================================================
-- 01-init.sql
-- Estructura base para la base de datos de usuarios PAAA
-- =====================================================

-- ===============================
-- Tabla: user_types
-- ===============================
CREATE TABLE IF NOT EXISTS user_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type_name TEXT UNIQUE NOT NULL
);

-- ===============================
-- Tabla: schools
-- ===============================
CREATE TABLE IF NOT EXISTS schools (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_name TEXT UNIQUE NOT NULL
);

-- ===============================
-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT,
  user_type_id BIGINT NOT NULL,
  school_id BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users__user_type FOREIGN KEY (user_type_id) REFERENCES user_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_users__school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- ===============================
-- Tabla: action_types
-- ===============================
CREATE TABLE IF NOT EXISTS action_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- ===============================
-- Tabla: actions
-- ===============================
CREATE TABLE IF NOT EXISTS actions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  process_id BIGINT,
  action_type_id BIGINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (action_type_id) REFERENCES action_types(id) ON DELETE RESTRICT
);

-- ===============================
-- Tabla: processes
-- ===============================
CREATE TABLE IF NOT EXISTS processes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  process_name TEXT UNIQUE NOT NULL,
  school_id BIGINT NOT NULL,
  encargado_id BIGINT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,
  FOREIGN KEY (encargado_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ===============================
-- Tabla: audit_log
-- ===============================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT,
  action_type_id BIGINT,
  school_id BIGINT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (action_type_id) REFERENCES action_types(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

-- ===============================
-- Tabla: documents
-- ===============================
CREATE TABLE IF NOT EXISTS documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  uploaded_by BIGINT NOT NULL,
  process_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

-- =====================================================
-- NUEVAS TABLAS (agregadas para compatibilidad)
-- =====================================================

-- ===============================
-- Tabla: careers
-- ===============================
CREATE TABLE IF NOT EXISTS careers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  career_name TEXT UNIQUE NOT NULL,
  school_id BIGINT NOT NULL,
  CONSTRAINT fk_careers__school FOREIGN KEY (school_id)
    REFERENCES schools(id) ON DELETE RESTRICT
);

-- ===============================
-- Tabla: permissions
-- ===============================
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  permission_name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- ===============================
-- Tabla: roles_permissions (relación n-n entre user_types y permissions)
-- ===============================
CREATE TABLE IF NOT EXISTS roles_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_roles_permissions__user_type
    FOREIGN KEY (role_id) REFERENCES user_types(id) ON DELETE CASCADE,
  CONSTRAINT fk_roles_permissions__permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

