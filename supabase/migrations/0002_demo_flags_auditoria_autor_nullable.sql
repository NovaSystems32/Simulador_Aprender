-- =====================================================================
-- 0002: banderas is_demo, tabla de auditoría admin, y ajuste de FK en
-- preguntas.autor_id para que eliminar un usuario nunca arrastre el
-- banco de preguntas por un ON DELETE CASCADE.
-- =====================================================================

-- ---------------------------------------------------------------------
-- preguntas.autor_id: nullable + ON DELETE SET NULL (antes: NOT NULL
-- con ON DELETE CASCADE). El nombre "preguntas_autor_id_fkey" es el que
-- genera Postgres por defecto para la restricción inline de 0001_init.sql.
-- ---------------------------------------------------------------------
alter table preguntas alter column autor_id drop not null;
alter table preguntas drop constraint if exists preguntas_autor_id_fkey;
alter table preguntas
  add constraint preguntas_autor_id_fkey
  foreign key (autor_id) references perfiles (id) on delete set null;

-- ---------------------------------------------------------------------
-- is_demo: marca explícita para datos de demostración. Los scripts de
-- seed deben setearla en true; no se debe inferir por nombre/email.
-- ---------------------------------------------------------------------
alter table perfiles add column if not exists is_demo boolean not null default false;
alter table cursos add column if not exists is_demo boolean not null default false;
alter table evaluaciones add column if not exists is_demo boolean not null default false;

create index if not exists idx_perfiles_is_demo on perfiles (is_demo);
create index if not exists idx_cursos_is_demo on cursos (is_demo);
create index if not exists idx_evaluaciones_is_demo on evaluaciones (is_demo);

-- ---------------------------------------------------------------------
-- auditoria_admin: registro de acciones administrativas sensibles
-- (eliminaciones, limpiezas de historial, archivado de preguntas, etc).
-- No guarda contraseñas, tokens ni respuestas correctas.
-- ---------------------------------------------------------------------
create table if not exists auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references perfiles (id) on delete set null,
  admin_email text not null,
  accion text not null,
  tabla_afectada text not null,
  registro_id uuid,
  cantidad_registros int not null default 1,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auditoria_admin_created on auditoria_admin (created_at desc);
create index if not exists idx_auditoria_admin_admin on auditoria_admin (admin_id);

alter table auditoria_admin enable row level security;

drop policy if exists auditoria_admin_select on auditoria_admin;
create policy auditoria_admin_select on auditoria_admin for select using (es_admin());

-- No se agrega policy de insert/update/delete: estas filas solo se crean
-- desde Server Actions/Route Handlers con el cliente de service role, que
-- bypassea RLS por diseño (igual que el resto de las operaciones admin
-- sensibles de esta aplicación).
