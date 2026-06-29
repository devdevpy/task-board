import projectFormTemplate from './projectForm.html?raw';
import './projectForm.css';
import { navigate } from '../../router/router.js';
import { showToast } from '../../components/toast/toast.js';
import { createProject, updateProject, loadProject } from '../projects/projects.js';

let currentProjectId = null;

export function renderProjectFormPage() {
  return projectFormTemplate;
}

export async function mountProjectFormPage(projectId) {
  currentProjectId = projectId || null;

  const titleEl = document.getElementById('project-form-title');
  const subtitleEl = document.getElementById('project-form-subtitle');
  const titleInput = document.getElementById('project-title');
  const descInput = document.getElementById('project-description');
  const submitBtn = document.getElementById('project-submit');
  const form = document.getElementById('project-form');

  if (!form || !titleInput || !descInput || !submitBtn) return;

  if (currentProjectId) {
    titleEl.textContent = 'Edit project';
    subtitleEl.textContent = 'Update project details';
    submitBtn.innerHTML = '<i data-lucide="save"></i> Update';

    const { project, error } = await loadProject(currentProjectId);
    if (error) {
      showToast('Failed to load project', 'error');
      navigate('/projects');
      return;
    }
    titleInput.value = project.title;
    descInput.value = project.description || '';
  } else {
    titleEl.textContent = 'New project';
    subtitleEl.textContent = 'Create a new project';
    submitBtn.innerHTML = '<i data-lucide="save"></i> Create';
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');

    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    const { error } = currentProjectId
      ? await updateProject(currentProjectId, title, description)
      : await createProject(title, description);

    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-75');

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    showToast(currentProjectId ? 'Project updated' : 'Project created', 'success');
    navigate('/projects');
  });
}
