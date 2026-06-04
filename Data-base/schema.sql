-- Barberia RD - Modulo de servicios, pagos y dashboard administrativo
-- Responsable: Brandon
-- Base de datos: Supabase PostgreSQL

create extension if not exists "pgcrypto";

create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(100) not null unique,
  descripcion varchar(255),
  precio numeric(10, 2) not null check (precio >= 0),
  duracion_minutos integer not null default 30 check (duracion_minutos > 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.pagos_efectivo (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios(id) on update cascade on delete restrict,
  cliente_nombre varchar(120) not null,
  monto numeric(10, 2) not null check (monto > 0),
  recibido_por varchar(120) not null,
  referencia varchar(40) not null unique,
  comprobante varchar(60) not null unique,
  metodo_pago varchar(20) not null default 'efectivo',
  estado_pago varchar(20) not null default 'pagado',
  notas varchar(255),
  fecha_pago timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  constraint chk_pagos_metodo check (metodo_pago in ('efectivo')),
  constraint chk_pagos_estado check (estado_pago in ('pendiente', 'pagado', 'anulado'))
);

create or replace function public.set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_servicios_actualizado_en on public.servicios;

create trigger trg_servicios_actualizado_en
before update on public.servicios
for each row
execute function public.set_actualizado_en();

create or replace view public.dashboard_administrativo as
select
  count(distinct s.id) as total_servicios,
  count(distinct s.id) filter (where s.activo = true) as servicios_activos,
  count(p.id) as total_pagos_efectivo,
  coalesce(sum(p.monto) filter (where p.estado_pago = 'pagado'), 0) as ingresos_efectivo,
  coalesce(avg(s.precio), 0) as precio_promedio_servicios,
  max(p.fecha_pago) as ultimo_pago
from public.servicios s
left join public.pagos_efectivo p on p.servicio_id = s.id;

create or replace view public.ingresos_por_servicio as
select
  s.id,
  s.nombre,
  s.precio,
  count(p.id) filter (where p.estado_pago = 'pagado') as pagos_registrados,
  coalesce(sum(p.monto) filter (where p.estado_pago = 'pagado'), 0) as total_ingresado
from public.servicios s
left join public.pagos_efectivo p on p.servicio_id = s.id
group by s.id, s.nombre, s.precio
order by total_ingresado desc, s.nombre asc;

alter table public.servicios enable row level security;
alter table public.pagos_efectivo enable row level security;

drop policy if exists "Permitir lectura de servicios" on public.servicios;
drop policy if exists "Permitir insertar servicios" on public.servicios;
drop policy if exists "Permitir actualizar servicios" on public.servicios;
drop policy if exists "Permitir eliminar servicios" on public.servicios;
drop policy if exists "Permitir lectura de pagos" on public.pagos_efectivo;
drop policy if exists "Permitir insertar pagos" on public.pagos_efectivo;

create policy "Permitir lectura de servicios"
on public.servicios for select
using (true);

create policy "Permitir insertar servicios"
on public.servicios for insert
with check (true);

create policy "Permitir actualizar servicios"
on public.servicios for update
using (true)
with check (true);

create policy "Permitir eliminar servicios"
on public.servicios for delete
using (true);

create policy "Permitir lectura de pagos"
on public.pagos_efectivo for select
using (true);

create policy "Permitir insertar pagos"
on public.pagos_efectivo for insert
with check (true);

insert into public.servicios (nombre, descripcion, precio, duracion_minutos, activo)
values
  ('Corte clasico', 'Corte tradicional con terminacion profesional', 500.00, 30, true),
  ('Corte y barba', 'Corte completo con arreglo de barba', 800.00, 45, true),
  ('Afeitado', 'Afeitado con navaja y toalla caliente', 350.00, 25, true)
on conflict (nombre) do nothing;
