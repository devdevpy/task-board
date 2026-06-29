import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables.');
  console.error('Set them in .env.local or as PowerShell env vars:');
  console.error('  $env:SUPABASE_URL="https://<ref>.supabase.co"');
  console.error('  $env:SUPABASE_SERVICE_KEY="<service-role-key>"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_STAGES = ['Not Started', 'In Progress', 'Done'];

const TASK_TEMPLATES = [
  { title: 'Define project scope',        description: 'Outline goals, deliverables and timeline.',               stage: 'Done' },
  { title: 'Set up repository',           description: 'Create Git repo, branch strategy and README.',            stage: 'Done' },
  { title: 'Design database schema',      description: 'Model entities and relationships.',                       stage: 'Done' },
  { title: 'Create wireframes',           description: 'Low-fidelity sketches for key screens.',                  stage: 'Done' },
  { title: 'Set up CI/CD pipeline',       description: 'Automate builds and deployments with GitHub Actions.',   stage: 'In Progress' },
  { title: 'Implement authentication',    description: 'Login, register and password reset flows.',               stage: 'In Progress' },
  { title: 'Build core UI components',    description: 'Header, footer, navigation and reusable cards.',          stage: 'In Progress' },
  { title: 'Integrate Supabase client',   description: 'Connect frontend to database via Supabase JS.',          stage: 'In Progress' },
  { title: 'Write unit tests',            description: 'Cover critical business logic with tests.',               stage: 'Not Started' },
  { title: 'Implement search feature',    description: 'Allow users to search and filter records.',               stage: 'Not Started' },
  { title: 'Performance optimisation',    description: 'Audit and improve load times.',                           stage: 'Not Started' },
  { title: 'Deploy to production',        description: 'Release to live environment and verify.',                 stage: 'Not Started' },
];

async function fetchUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(`Failed to list users: ${error.message}`);
  return data.users;
}

async function clearExistingData() {
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared existing seed data.');
}

async function seedUser(user, index) {
  const projectTitle = [
    'Website Redesign',
    'Mobile App MVP',
    'API Integration',
    'Data Migration',
  ][index] ?? `Project ${index + 1}`;

  const projectDesc = [
    'Redesign the company website with a modern look and feel.',
    'Build the first version of the mobile application.',
    'Integrate third-party payment and notification APIs.',
    'Migrate legacy database to the new Supabase schema.',
  ][index] ?? `Sample project for user ${user.email}.`;

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({ title: projectTitle, description: projectDesc, owner_id: user.id })
    .select()
    .single();

  if (projErr) throw new Error(`Project insert failed: ${projErr.message}`);
  console.log(`  Created project: "${project.title}" (${project.id})`);

  const stageRows = DEFAULT_STAGES.map((name, position) => ({
    project_id: project.id,
    name,
    position,
  }));

  const { data: stages, error: stageErr } = await supabase
    .from('stages')
    .insert(stageRows)
    .select();

  if (stageErr) throw new Error(`Stages insert failed: ${stageErr.message}`);
  const stageMap = Object.fromEntries(stages.map((s) => [s.name, s.id]));
  console.log(`  Created ${stages.length} stages.`);

  const taskRows = TASK_TEMPLATES.map((t, position) => ({
    project_id: project.id,
    stage_id: stageMap[t.stage],
    title: t.title,
    description: t.description,
    position,
    done: t.stage === 'Done',
  }));

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .insert(taskRows)
    .select();

  if (taskErr) throw new Error(`Tasks insert failed: ${taskErr.message}`);
  console.log(`  Created ${tasks.length} tasks.`);
}

async function main() {
  console.log('Fetching users...');
  const users = await fetchUsers();

  if (users.length === 0) {
    console.error('No users found. Create users via Supabase Auth first.');
    process.exit(1);
  }

  console.log(`Found ${users.length} user(s). Clearing old data...`);
  await clearExistingData();

  for (let i = 0; i < users.length; i++) {
    console.log(`\nSeeding for user: ${users[i].email}`);
    await seedUser(users[i], i);
  }

  console.log('\nSeed complete!');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
