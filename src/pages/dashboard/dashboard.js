import dashboardTemplate from './dashboard.html?raw';
import './dashboard.css';
import { supabase } from '../../lib/supabase.js';
import { getUser } from '../../auth/authState.js';
import { showToast } from '../../components/toast/toast.js';

export function renderDashboardPage() {
  return dashboardTemplate;
}

export async function mountDashboardPage() {
  const user = getUser();
  if (!user) return;

  const projectsEl = document.getElementById('stat-projects');
  const totalEl = document.getElementById('stat-total');
  const openEl = document.getElementById('stat-open');
  const doneEl = document.getElementById('stat-done');
  const listEl = document.getElementById('dashboard-project-list');

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id);

  if (projectsError) {
    showToast('Failed to load projects', 'error');
    if (listEl) listEl.innerHTML = '<div class="text-muted-2 small">Unable to load projects.</div>';
    return;
  }

  const projectIds = projects.map((p) => p.id);

  let tasks = [];
  if (projectIds.length > 0) {
    const { data: taskData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('project_id', projectIds);

    if (tasksError) {
      showToast('Failed to load tasks', 'error');
    } else {
      tasks = taskData || [];
    }
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const open = total - done;

  if (projectsEl) projectsEl.textContent = projects.length;
  if (totalEl) totalEl.textContent = total;
  if (openEl) openEl.textContent = open;
  if (doneEl) doneEl.textContent = done;

  if (listEl) {
    if (projects.length === 0) {
      listEl.innerHTML = '<div class="text-muted-2 small">No projects yet.</div>';
    } else {
      listEl.innerHTML = projects
        .map(
          (p) => `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <span>${p.title}</span>
            <a href="/projects/${p.id}/tasks" data-link class="btn btn-ghost btn-sm px-2 py-1">
              Tasks <i data-lucide="arrow-right"></i>
            </a>
          </div>
        `
        )
        .join('');
    }
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
