import projectsTemplate from './projects.html?raw';
import './projects.css';
import { supabase } from '../../lib/supabase.js';
import { getUser } from '../../auth/authState.js';
import { showToast } from '../../components/toast/toast.js';

export function renderProjectsPage() {
  return projectsTemplate;
}

export async function mountProjectsPage() {
  const user = getUser();
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  if (!user) {
    grid.innerHTML = '<div class="col-12"><div class="glass p-4 text-center text-muted-2">Please log in to view projects.</div></div>';
    return;
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id);

  if (error) {
    showToast('Failed to load projects', 'error');
    grid.innerHTML = '<div class="col-12"><div class="glass p-4 text-center text-muted-2">Unable to load projects.</div></div>';
    return;
  }

  if (projects.length === 0) {
    grid.innerHTML = '<div class="col-12"><div class="glass p-4 text-center text-muted-2">No projects yet.</div></div>';
    return;
  }

  grid.innerHTML = projects
    .map(
      (p) => `
      <div class="col-md-4">
        <div class="glass project-card p-4">
          <span class="project-icon"><i data-lucide="folder"></i></span>
          <h5 class="mt-3 mb-1">${p.title}</h5>
          <p class="text-muted-2 small mb-3">${p.description || 'No description'}</p>
          <a href="/projects/${p.id}/tasks" data-link class="btn btn-ghost btn-sm px-3 py-2">
            View tasks <i data-lucide="arrow-right"></i>
          </a>
        </div>
      </div>
    `
    )
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
