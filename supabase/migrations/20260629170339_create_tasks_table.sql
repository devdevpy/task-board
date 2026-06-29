create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  stage_id    uuid references public.stages(id) on delete set null,
  title       text not null,
  description text,
  position    integer not null default 0,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Project owner can manage tasks"
  on public.tasks
  for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.owner_id = auth.uid()
    )
  );
