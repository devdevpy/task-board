import projectTasksTemplate from './projectTasks.html?raw';
import './projectTasks.css';
import { supabase } from '../../lib/supabase.js';
import { getUser } from '../../auth/authState.js';
import { showToast } from '../../components/toast/toast.js';

let currentProjectId = null;

export function renderProjectTasksPage(projectId) {
  return projectTasksTemplate;
}

export async function mountProjectTasksPage(projectId) {
  currentProjectId = projectId;
  const user = getUser();
  const board = document.getElementById('task-board');
  const title = document.getElementById('project-tasks-title');
  const description = document.getElementById('project-tasks-description');
  const breadcrumb = document.getElementById('project-breadcrumb-name');
  if (!board || !user) return;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single();

  if (projectError || !project) {
    showToast('Failed to load project', 'error');
    board.innerHTML = '<div class="col-12 text-center text-muted-2 py-5">Unable to load project.</div>';
    return;
  }

  if (title) title.textContent = project.title;
  if (description) description.textContent = project.description || 'Kanban task board';
  if (breadcrumb) breadcrumb.textContent = project.title;

  const { data: stages, error: stagesError } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  if (stagesError) {
    showToast('Failed to load stages', 'error');
    board.innerHTML = '<div class="col-12 text-center text-muted-2 py-5">Unable to load stages.</div>';
    return;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  if (tasksError) {
    showToast('Failed to load tasks', 'error');
  }

  const tasksByStage = (tasks || []).reduce((acc, task) => {
    const stageId = task.stage_id || 'unassigned';
    if (!acc[stageId]) acc[stageId] = [];
    acc[stageId].push(task);
    return acc;
  }, {});

  if (stages.length === 0) {
    board.innerHTML = `
      <div class="col-12 text-center text-muted-2 py-5">
        <p>No stages defined for this project.</p>
        <button type="button" class="btn btn-glow btn-sm px-3 py-2" id="create-default-stages">
          <i data-lucide="columns-3"></i> Create default stages
        </button>
      </div>
    `;
    document.getElementById('create-default-stages')?.addEventListener('click', async () => {
      const { error } = await supabase.from('stages').insert([
        { project_id: projectId, name: 'Not Started', position: 0 },
        { project_id: projectId, name: 'In Progress', position: 1 },
        { project_id: projectId, name: 'Done', position: 2 },
      ]);
      if (error) {
        showToast('Failed to create stages', 'error');
      } else {
        showToast('Default stages created', 'success');
        mountProjectTasksPage(projectId);
      }
    });
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  board.innerHTML = stages
    .map((stage) => {
      const stageTasks = tasksByStage[stage.id] || [];
      const isDone = isDoneStage(stage.name);
      const isProgress = stage.name.toLowerCase().includes('progress');
      const dotClass = isDone ? 'dot-done' : isProgress ? 'dot-progress' : 'dot-todo';
      return `
        <section class="board-col glass" data-stage-id="${stage.id}">
          <div class="board-col-head">
            <span class="dot ${dotClass}"></span> ${stage.name}
            <span class="badge stage-count">${stageTasks.length}</span>
          </div>
          <div class="task-list" data-stage-id="${stage.id}">
            ${stageTasks
              .map(
                (task) => renderTaskCard(task)
              )
              .join('')}
          </div>
          <button type="button" class="btn btn-add-task">
            <i data-lucide="plus"></i> Add task
          </button>
        </section>
      `;
    })
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setupDragAndDrop();
}

function renderTaskCard(task) {
  return `
    <article class="task-card ${task.done ? 'done' : ''}" draggable="true" data-task-id="${task.id}">
      <div class="task-card-body">
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
        <span class="task-badge ${task.done ? 'badge-done' : 'badge-open'}">${task.done ? 'Done' : 'Open'}</span>
      </div>
      <div class="task-card-actions">
        <button type="button" class="btn btn-icon btn-edit" title="Edit task">
          <i data-lucide="pencil"></i>
        </button>
        <button type="button" class="btn btn-icon btn-delete" title="Delete task">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function isDoneStage(name) {
  const lower = name.toLowerCase();
  return lower.includes('done') || lower.includes('completed') || lower.includes('closed');
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.task-card');
  const lists = document.querySelectorAll('.task-list');

  cards.forEach((card) => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  lists.forEach((list) => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (!draggable) return;
      if (afterElement == null) {
        list.appendChild(draggable);
      } else {
        list.insertBefore(draggable, afterElement);
      }
    });

    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      const draggable = document.querySelector('.dragging');
      if (!draggable) return;
      const taskId = draggable.dataset.taskId;
      const newStageId = list.dataset.stageId;
      const stageName = list.closest('.board-col').querySelector('.board-col-head').textContent.trim();
      const newDone = isDoneStage(stageName);

      const siblings = [...list.querySelectorAll('.task-card')];
      const orderedIds = siblings.map((card) => card.dataset.taskId);
      const newIndex = siblings.indexOf(draggable);
      if (newIndex === -1) {
        orderedIds.push(taskId);
      }

      const { error } = await updateTaskPosition(taskId, newStageId, newDone, orderedIds);
      if (error) {
        showToast('Failed to move task', 'error');
      } else {
        mountProjectTasksPage(currentProjectId);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

async function updateTaskPosition(taskId, newStageId, newDone, orderedIds) {
  const updates = orderedIds.map((id, index) => {
    const payload = { position: index * 1000 };
    if (id === taskId) {
      payload.stage_id = newStageId;
      payload.done = newDone;
    }
    return supabase.from('tasks').update(payload).eq('id', id);
  });

  const results = await Promise.all(updates);
  const error = results.find((r) => r.error)?.error;
  return { error };
}
