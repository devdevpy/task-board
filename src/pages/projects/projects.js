import projectsTemplate from './projects.html?raw';
import './projects.css';
import { supabase } from '../../lib/supabase.js';
import { getUser } from '../../auth/authState.js';
import { showToast } from '../../components/toast/toast.js';

export function renderProjectsPage() {
  return projectsTemplate;
}

let projectsToDelete = null;

export async function mountProjectsPage() {
  const user = getUser();
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;

  // Move the delete modal to body so it layers above the Bootstrap backdrop
  const modal = document.getElementById('delete-project-modal');
  if (modal && modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  if (!user) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted-2 py-4">Please log in to view projects.</td></tr>';
    return;
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id);

  if (error) {
    showToast('Failed to load projects', 'error');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted-2 py-4">Unable to load projects.</td></tr>';
    return;
  }

  const projectIds = projects.map((p) => p.id);
  const stages = projectIds.length ? await loadStages(projectIds) : [];
  const tasks = projectIds.length ? await loadTasks(projectIds) : [];

  if (projects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted-2 py-4">No projects yet. <a href="/project/add" data-link>Create one</a>.</td></tr>';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const stageCounts = countByProjectId(stages, 'project_id');
  const taskCounts = countTasksByProject(tasks);

  tbody.innerHTML = projects
    .map((p) => {
      const desc = p.description || '—';
      const counts = taskCounts[p.id] || { open: 0, done: 0 };
      return `
        <tr>
          <td class="fw-semibold">${p.title}</td>
          <td><div class="project-description" title="${desc.replace(/"/g, '&quot;')}">${desc}</div></td>
          <td class="text-center">${stageCounts[p.id] || 0}</td>
          <td class="text-center">${counts.open}</td>
          <td class="text-center">${counts.done}</td>
          <td class="text-end">
            <div class="project-actions">
              <a href="/project/${p.id}/tasks" data-link class="btn btn-ghost btn-sm px-2 py-1" title="View Tasks">
                <i data-lucide="layout-kanban"></i> Tasks
              </a>
              <a href="/project/${p.id}/edit" data-link class="btn btn-ghost btn-sm px-2 py-1" title="Edit">
                <i data-lucide="pencil"></i>
              </a>
              <button type="button" class="btn btn-danger btn-sm px-2 py-1 delete-project-btn" data-id="${p.id}" data-title="${p.title.replace(/"/g, '&quot;')}" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  attachDeleteHandlers();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function loadStages(projectIds) {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .in('project_id', projectIds);
  if (error) {
    showToast('Failed to load stages', 'error');
    return [];
  }
  return data || [];
}

async function loadTasks(projectIds) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('project_id', projectIds);
  if (error) {
    showToast('Failed to load tasks', 'error');
    return [];
  }
  return data || [];
}

function countByProjectId(items, key) {
  return items.reduce((acc, item) => {
    const id = item[key];
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
}

function countTasksByProject(tasks) {
  return tasks.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = { open: 0, done: 0 };
    }
    if (task.done) {
      acc[task.project_id].done += 1;
    } else {
      acc[task.project_id].open += 1;
    }
    return acc;
  }, {});
}

function attachDeleteHandlers() {
  document.querySelectorAll('.delete-project-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      projectsToDelete = { id, title };
      document.getElementById('delete-project-name').textContent = title;
      const modal = new bootstrap.Modal(document.getElementById('delete-project-modal'));
      modal.show();
    });
  });

  const confirmBtn = document.getElementById('confirm-delete-project');
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      if (!projectsToDelete) return;
      const { id, title } = projectsToDelete;
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        showToast('Failed to delete project', 'error');
      } else {
        showToast(`Project "${title}" deleted`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('delete-project-modal')).hide();
        mountProjectsPage();
      }
      projectsToDelete = null;
    };
  }
}

export async function createProject(title, description) {
  const user = getUser();
  if (!user) return { error: new Error('Not authenticated') };
  const { data, error } = await supabase
    .from('projects')
    .insert({ title, description, owner_id: user.id })
    .select()
    .single();
  return { project: data, error };
}

export async function updateProject(id, title, description) {
  const { data, error } = await supabase
    .from('projects')
    .update({ title, description })
    .eq('id', id)
    .select()
    .single();
  return { project: data, error };
}

export async function loadProject(id) {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
  return { project: data, error };
}

