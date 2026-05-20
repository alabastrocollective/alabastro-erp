-- Avatares: color personalizado y URL de foto (personal + storage)
begin;

alter table public.staff_members
  add column avatar_color text,
  add column avatar_url text;

comment on column public.staff_members.avatar_color is 'Preset: accent, sky, violet, emerald, amber, rose, indigo, teal';
comment on column public.staff_members.avatar_url is 'URL pública en bucket avatars (staff/{id})';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_select_authenticated" on storage.objects
  for select to authenticated using (bucket_id = 'avatars');

create policy "avatars_insert_authenticated" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

create policy "avatars_update_authenticated" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');

create policy "avatars_delete_authenticated" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');

commit;
