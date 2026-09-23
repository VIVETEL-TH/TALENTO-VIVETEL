-- =====================================================================
-- Fase 4: Plan de capacitación — transversal a todos los riesgos
-- Pegue este archivo completo en Supabase: SQL Editor -> "New query" ->
-- pegar -> Run. Se puede ejecutar una sola vez, después de haber corrido
-- 001_expediente_trabajador.sql.
-- =====================================================================

-- Catálogo único de temas de capacitación. Un mismo tema (por ejemplo,
-- "Inducción SST") se dicta muchas veces a lo largo del año; aquí solo
-- vive UNA vez, con su categoría y cada cuánto se debe repetir. La
-- categoría "copasst" es la que permite, más abajo, ver de un solo
-- filtro todo lo hecho frente al comité sin duplicar nada.
create table if not exists temas_capacitacion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  categoria text not null default 'general'
    check (categoria in ('general','alturas','copasst','convivencia','emergencias','vial','salud')),
  horas numeric,
  periodicidad_meses int,        -- cada cuántos meses se debe repetir (null = una sola vez)
  obligatorio boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada vez que un tema se dicta, queda una sesión con su fecha y quién
-- la dictó. El soporte_url es el enlace al acta/lista de asistencia
-- firmada, cuando la tengan escaneada.
create table if not exists sesiones_capacitacion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tema_id uuid not null references temas_capacitacion(id) on delete cascade,
  fecha date not null,
  facilitador text,
  tipo text not null default 'interna' check (tipo in ('interna','externa')),
  soporte_url text,
  created_at timestamptz not null default now()
);

-- Quién asistió a cada sesión. Esta es la tabla que, cruzada con
-- trabajadores y temas, arma automáticamente el histórico transversal
-- de cada persona sin importar a cuántos comités o riesgos pertenezca.
create table if not exists asistencia_capacitacion (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_capacitacion(id) on delete cascade,
  trabajador_id uuid not null references trabajadores(id) on delete cascade,
  asistio boolean not null default true,
  created_at timestamptz not null default now(),
  unique (sesion_id, trabajador_id)
);

-- =====================================================================
-- Seguridad (RLS): misma advertencia que en el módulo anterior. Sigue
-- abierta mientras no exista inicio de sesión; se cierra antes de cargar
-- información sensible.
-- =====================================================================
alter table temas_capacitacion enable row level security;
alter table sesiones_capacitacion enable row level security;
alter table asistencia_capacitacion enable row level security;

drop policy if exists "temporal_abierta" on temas_capacitacion;
create policy "temporal_abierta" on temas_capacitacion for all using (true) with check (true);

drop policy if exists "temporal_abierta" on sesiones_capacitacion;
create policy "temporal_abierta" on sesiones_capacitacion for all using (true) with check (true);

drop policy if exists "temporal_abierta" on asistencia_capacitacion;
create policy "temporal_abierta" on asistencia_capacitacion for all using (true) with check (true);

-- =====================================================================
-- Temas iniciales de Vivetel Telecomunicaciones — un punto de partida
-- razonable; se pueden agregar, editar o borrar más adelante desde la
-- propia pantalla de capacitación.
-- =====================================================================
do $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id from empresas where nombre = 'Vivetel Telecomunicaciones' limit 1;

  insert into temas_capacitacion (empresa_id, nombre, categoria, horas, periodicidad_meses, obligatorio) values
    (v_empresa_id, 'Inducción y reinducción SST', 'general', 4, 12, true),
    (v_empresa_id, 'Trabajo seguro en alturas', 'alturas', 8, 12, true),
    (v_empresa_id, 'Conformación y funciones del COPASST', 'copasst', 2, null, true),
    (v_empresa_id, 'Prevención del acoso laboral', 'convivencia', 2, 12, true),
    (v_empresa_id, 'Plan de emergencias y evacuación', 'emergencias', 2, 12, true),
    (v_empresa_id, 'Manejo defensivo y seguridad vial', 'vial', 4, 12, true)
  on conflict do nothing;
end $$;
