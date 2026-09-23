-- =====================================================================
-- Fase 3: Expediente del trabajador — Vivetel Telecomunicaciones
-- Pegue este archivo completo en Supabase: Table Editor -> SQL Editor ->
-- "New query" -> pegar -> Run. Se puede ejecutar una sola vez.
-- =====================================================================

-- Empresas: aunque hoy solo trabajamos con Vivetel, el sistema queda listo
-- para sumar el laboratorio más adelante sin rediseñar nada.
create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nit text,
  riesgo_actividad text,      -- p. ej. "III"
  created_at timestamptz not null default now()
);

-- Centros de trabajo (sedes) de cada empresa.
create table if not exists centros_trabajo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- Cargos de cada empresa.
create table if not exists cargos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- El expediente único del trabajador.
create table if not exists trabajadores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  centro_trabajo_id uuid references centros_trabajo(id),
  cargo_id uuid references cargos(id),
  nombres text not null,
  apellidos text not null,
  documento text not null,
  tipo_vinculacion text not null default 'directo' check (tipo_vinculacion in ('directo','contratista')),
  fecha_ingreso date,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Catálogo de competencias críticas (alturas, licencia de conducción, etc.)
create table if not exists competencias_criticas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  dias_alerta_previos int not null default 30,  -- con cuántos días de anticipación avisar
  created_at timestamptz not null default now()
);

-- Certificación de cada trabajador en cada competencia, con su vigencia.
create table if not exists trabajador_competencias (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references trabajadores(id) on delete cascade,
  competencia_id uuid not null references competencias_criticas(id) on delete cascade,
  fecha_obtencion date,
  fecha_vencimiento date,
  soporte_url text,          -- enlace al certificado, cuando lo tengamos
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Seguridad (RLS): por ahora, ADVERTENCIA IMPORTANTE.
-- Todavía no hay usuarios ni contraseñas en la app (eso viene en una fase
-- posterior). Mientras tanto, dejamos las tablas abiertas a quien tenga
-- la "anon key" de la app -- que solo usted y quien usted autorice tienen.
-- Antes de cargar datos de salud o información sensible, hay que construir
-- el inicio de sesión y cerrar este acceso abierto.
-- =====================================================================
alter table empresas enable row level security;
alter table centros_trabajo enable row level security;
alter table cargos enable row level security;
alter table trabajadores enable row level security;
alter table competencias_criticas enable row level security;
alter table trabajador_competencias enable row level security;

drop policy if exists "temporal_abierta" on empresas;
create policy "temporal_abierta" on empresas for all using (true) with check (true);

drop policy if exists "temporal_abierta" on centros_trabajo;
create policy "temporal_abierta" on centros_trabajo for all using (true) with check (true);

drop policy if exists "temporal_abierta" on cargos;
create policy "temporal_abierta" on cargos for all using (true) with check (true);

drop policy if exists "temporal_abierta" on trabajadores;
create policy "temporal_abierta" on trabajadores for all using (true) with check (true);

drop policy if exists "temporal_abierta" on competencias_criticas;
create policy "temporal_abierta" on competencias_criticas for all using (true) with check (true);

drop policy if exists "temporal_abierta" on trabajador_competencias;
create policy "temporal_abierta" on trabajador_competencias for all using (true) with check (true);

-- =====================================================================
-- Datos iniciales de Vivetel Telecomunicaciones
-- =====================================================================
insert into empresas (nombre, nit, riesgo_actividad)
values ('Vivetel Telecomunicaciones', null, 'III')
on conflict do nothing;

-- Guardamos el id de la empresa recién creada para usarlo abajo.
do $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id from empresas where nombre = 'Vivetel Telecomunicaciones' limit 1;

  insert into centros_trabajo (empresa_id, nombre)
  values (v_empresa_id, 'Sede principal')
  on conflict do nothing;

  insert into cargos (empresa_id, nombre) values
    (v_empresa_id, 'Técnico de campo'),
    (v_empresa_id, 'Auxiliar de oficina'),
    (v_empresa_id, 'Contratista')
  on conflict do nothing;

  insert into competencias_criticas (empresa_id, nombre, dias_alerta_previos) values
    (v_empresa_id, 'Trabajo en alturas', 30),
    (v_empresa_id, 'Licencia de conducción', 30),
    (v_empresa_id, 'Examen médico ocupacional (aptitud)', 45)
  on conflict do nothing;
end $$;
