-- Alabastro ERP: clientes, paquetes, proyectos, finanzas, objetivos
-- Moneda: USD (montos en columnas *_usd)

begin;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('musica', 'video')),
  name text not null,
  price_regular_usd numeric(12, 2) not null,
  price_promo_usd numeric(12, 2) not null,
  promo_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  service_package_id uuid references public.service_packages (id) on delete set null,
  title text not null,
  agreed_price_usd numeric(12, 2) not null check (agreed_price_usd >= 0),
  deposit_percent numeric(5, 2) not null default 30 check (deposit_percent >= 0 and deposit_percent <= 100),
  status text not null default 'borrador'
    check (status in ('borrador', 'presupuesto', 'en_produccion', 'revision', 'entregado', 'cancelado')),
  starting_point text not null default 'otro'
    check (starting_point in ('maqueta', 'letra_solo', 'desde_cero', 'otro')),
  notes text,
  expected_delivery_on date,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null check (movement_type in ('ingreso', 'egreso')),
  amount_usd numeric(12, 2) not null check (amount_usd >= 0),
  occurred_on date not null default ((now() at time zone 'utc'))::date,
  category text,
  payment_method text
    check (payment_method is null or payment_method in ('efectivo', 'paypal', 'pago_movil', 'transferencia', 'otro')),
  project_id uuid references public.projects (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  objective_kind text not null default 'personalizado'
    check (objective_kind in ('equipo', 'proyectos', 'ingresos', 'personalizado')),
  target_number numeric(14, 4),
  current_progress numeric(14, 4) not null default 0,
  unit_label text,
  deadline_on date,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_curso', 'completado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_client on public.projects (client_id);
create index idx_projects_status on public.projects (status);
create index idx_financial_occurred on public.financial_movements (occurred_on);
create index idx_financial_project on public.financial_movements (project_id);

create trigger tr_clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

create trigger tr_service_packages_touch before update on public.service_packages
  for each row execute function public.touch_updated_at();

create trigger tr_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create trigger tr_financial_movements_touch before update on public.financial_movements
  for each row execute function public.touch_updated_at();

create trigger tr_objectives_touch before update on public.objectives
  for each row execute function public.touch_updated_at();

alter table public.clients enable row level security;
alter table public.service_packages enable row level security;
alter table public.projects enable row level security;
alter table public.financial_movements enable row level security;
alter table public.objectives enable row level security;

create policy "clients_authenticated_all" on public.clients
  for all to authenticated using (true) with check (true);

create policy "service_packages_authenticated_all" on public.service_packages
  for all to authenticated using (true) with check (true);

create policy "projects_authenticated_all" on public.projects
  for all to authenticated using (true) with check (true);

create policy "financial_movements_authenticated_all" on public.financial_movements
  for all to authenticated using (true) with check (true);

create policy "objectives_authenticated_all" on public.objectives
  for all to authenticated using (true) with check (true);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.service_packages to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.financial_movements to authenticated;
grant select, insert, update, delete on table public.objectives to authenticated;

insert into public.service_packages (category, name, price_regular_usd, price_promo_usd, promo_active, sort_order)
values
  ('musica', 'Instrumental', 180, 100, true, 1),
  ('musica', 'Standard', 220, 150, true, 2),
  ('musica', 'Premium', 480, 350, true, 3),
  ('video', 'Básico', 180, 100, true, 1),
  ('video', 'Standard', 230, 150, true, 2),
  ('video', 'Premium', 550, 400, true, 3);

commit;
