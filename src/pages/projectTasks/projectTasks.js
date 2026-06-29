import projectTasksTemplate from './projectTasks.html?raw';
import './projectTasks.css';
import { supabase } from '../../lib/supabase.js';
import { getUser } from '../../auth/authState.js';
import { showToast } from '../../components/toast/toast.js';

export function renderProjectTasksPage(projectId) {
  return projectTasksTemplate;
}

export async function mountProjectTasksPage(projectId) {
  const user = getUser();
  const board = document.getElementById('task-board');
  const title = document.getElementById('project-tasks-title');
  const subtitle = document.getElementById('project-tasks-subtitle');
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
  if (subtitle) subtitle.textContent = 'Tasks board';

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
    board.innerHTML = '<div class="col-12 text-center text-muted-2 py-5">No stages defined for this project.</div>';
    return;
  }

  board.innerHTML = stages
    .map((stage) => {
      const stageTasks = tasksByStage[stage.id] || [];
      const dotClass = stage.name.toLowerCase().includes('done')
        ? 'dot-done'
        : stage.name.toLowerCase().includes('progress')
          ? 'dot-progress'
          : 'dot-todo';
      return `
        <section class="board-col glass">
          <div class="board-col-head">
            <span class="dot ${dotClass}"></span> ${stage.name}
            <span class="badge stage-count">${stageTasks.length}</span>
          </div>
          ${stageTasks
            .map(
              (task) => `
            <article class="task-card glass ${task.done ? 'done' : ''}">
              ${task.done ? '<i data-lucide="check"></i>' : ''}
              <span class="task-title">${task.title}</span>
            </article>
          `
            )
            .join('')}
        </section>
      `;
    })
    .join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
