import { renderHomePage } from '../pages/home/home.js';
import { renderLoginPage, mountLoginPage } from '../pages/login/login.js';
import { renderDashboardPage, mountDashboardPage } from '../pages/dashboard/dashboard.js';
import { renderProjectsPage, mountProjectsPage } from '../pages/projects/projects.js';
import { renderProjectFormPage, mountProjectFormPage } from '../pages/projectForm/projectForm.js';
import { renderProjectTasksPage } from '../pages/projectTasks/projectTasks.js';
import { highlightActiveLink } from '../components/header/header.js';
import { isAuthenticated } from '../auth/authState.js';

const routes = [
  { pattern: /^\/$/, render: () => renderHomePage() },
  { pattern: /^\/login$/, render: () => renderLoginPage() },
  { pattern: /^\/dashboard$/, render: () => renderDashboardPage() },
  { pattern: /^\/projects$/, render: () => renderProjectsPage() },
  { pattern: /^\/project\/add$/, render: () => renderProjectFormPage() },
  {
    pattern: /^\/project\/([^/]+)\/edit$/,
    render: (matches) => renderProjectFormPage(),
  },
  {
    pattern: /^\/projects\/([^/]+)\/tasks$/,
    render: (matches) => renderProjectTasksPage(matches[1]),
  },
];

function matchRoute(path) {
  for (const route of routes) {
    const matches = path.match(route.pattern);
    if (matches) {
      return { render: route.render, matches };
    }
  }
  return null;
}

function renderNotFound() {
  return `
    <div class="text-center py-5">
      <h1 class="display-1 text-muted">404</h1>
      <p class="lead">Page not found.</p>
      <a href="/" data-link class="btn btn-primary">Go Home</a>
    </div>
  `;
}

export function navigate(path) {
  history.pushState(null, '', path);
  renderCurrentRoute();
}

export function renderCurrentRoute() {
  const path = window.location.pathname;
  const outlet = document.getElementById('page-outlet');
  const matched = matchRoute(path);

  const isProjectForm = path === '/project/add' || path.startsWith('/project/') && path.endsWith('/edit');
  if ((path === '/dashboard' || path === '/projects' || isProjectForm) && !isAuthenticated()) {
    navigate('/login');
    return;
  }

  if (matched) {
    outlet.innerHTML = matched.render(matched.matches);
  } else {
    outlet.innerHTML = renderNotFound();
  }

  if (path === '/login') {
    mountLoginPage();
  } else if (path === '/dashboard') {
    mountDashboardPage();
  } else if (path === '/projects') {
    mountProjectsPage();
  } else if (path === '/project/add') {
    mountProjectFormPage();
  } else if (path.startsWith('/project/') && path.endsWith('/edit')) {
    mountProjectFormPage(matched.matches[1]);
  }

  highlightActiveLink();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function initRouter() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (link) {
      e.preventDefault();
      navigate(link.getAttribute('href'));
    }
  });

  window.addEventListener('popstate', renderCurrentRoute);

  renderCurrentRoute();
}
