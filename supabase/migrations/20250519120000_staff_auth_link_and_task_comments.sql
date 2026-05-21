-- Vincular usuario Auth con ficha de Personal; comentarios en tareas
begin;

alter table public.staff_members
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

create index if not exists idx_staff_members_auth_user
  on public.staff_members (auth_user_id)
  where auth_user_id is not null;

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks (id) on delete cascade,
  staff_member_id uuid not null references public.staff_members (id) on delete restrict,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_task_comments_task_created
  on public.project_task_comments (task_id, created_at desc);

create trigger tr_task_comments_touch
  before update on public.project_task_comments
  for each row execute function public.touch_updated_at();

alter table public.project_task_comments enable row level security;

create policy "task_comments_authenticated_all" on public.project_task_comments
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.project_task_comments to authenticated;

commit;
