-- Cargo del personal: valores fijos
begin;

update public.staff_members
set cargo = null
where cargo is not null
  and cargo not in ('socio', 'productor', 'musico', 'gestor');

alter table public.staff_members
  add constraint staff_members_cargo_check
  check (cargo is null or cargo in ('socio', 'productor', 'musico', 'gestor'));

commit;
