create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Owner can manage their projects"
  on public.projects
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
