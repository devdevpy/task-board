create table public.stages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stages enable row level security;

create policy "Project owner can manage stages"
  on public.stages
  for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = stages.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = stages.project_id
        and projects.owner_id = auth.uid()
    )
  );
