import projectTasksTemplate from './projectTasks.html?raw';
import './projectTasks.css';

export function renderProjectTasksPage(projectId) {
  return projectTasksTemplate.replace(/\{\{projectId\}\}/g, projectId);
}
