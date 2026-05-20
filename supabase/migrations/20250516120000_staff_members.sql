-- Personal: socios, productores y trabajadores del collective
begin;

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  cargo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_staff_members_name on public.staff_members (name);

create trigger tr_staff_members_touch before update on public.staff_members
  for each row execute function public.touch_updated_at();

alter table public.staff_members enable row level security;

create policy "staff_members_authenticated_all" on public.staff_members
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.staff_members to authenticated;

commit;
