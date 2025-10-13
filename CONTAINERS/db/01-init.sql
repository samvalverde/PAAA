-- ==== Tablas base ====
create table user_types (
  id bigint generated always as identity primary key,
  type_name text unique not null
);

create table schools (
  id bigint generated always as identity primary key,
  school_name text unique not null
);

create table users (
  id bigint generated always as identity primary key,
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  user_type_id bigint not null,
  school_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_users__user_type foreign key (user_type_id) references user_types(id) on delete restrict,
  constraint fk_users__school foreign key (school_id) references schools(id) on delete set null
);

create table action_types (
  id bigint generated always as identity primary key,
  type_name text unique not null
);

create table actions (
  id bigint generated always as identity primary key,
  action_type_id bigint not null,
  action_name text unique not null,
  description text,
  created_at timestamptz not null default now(),
  constraint fk_actions__action_type foreign key (action_type_id) references action_types(id) on delete restrict
);

create table processes (
  id bigint generated always as identity primary key,
  process_name text unique not null,
  school_id bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_processes__school foreign key (school_id)references schools(id) on delete restrict
);


create table audit_log (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  action_id bigint not null,
  process_id bigint not null,
  action_timestamp timestamptz not null default now(),
  constraint fk_audit__user foreign key (user_id) references users(id) on delete restrict,
  constraint fk_audit__action foreign key (action_id) references actions(id) on delete restrict,
  constraint fk_audit__process foreign key (process_id) references processes(id) on delete restrict
);

-- Tabla de documentos versionados
create table documents (
  id bigint not null,
  ver integer not null check (ver > 0),
  user_id bigint not null,
  process_id bigint not null,
  title text not null,
  storage_key text not null,
  created_at timestamptz not null default now(),
  constraint pk_documents primary key (id, ver)
  constraint uq_documents__storage_key unique (storage_key),
  constraint fk_documents__user foreign key (user_id) references users(id) on delete restrict,
  constraint fk_documents__process foreign key (process_id) references processes(id) on delete restrict
);


