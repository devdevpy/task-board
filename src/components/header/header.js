import headerTemplate from './header.html?raw';
import './header.css';
import { onAuthChange, signOut, getUser } from '../../auth/authState.js';
import { navigate } from '../../router/router.js';

let unsubscribeAuth = null;

export function renderHeader() {
  const outlet = document.getElementById('header-outlet');
  outlet.innerHTML = headerTemplate;
  highlightActiveLink();
  initAuthHeader();
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('#main-nav .nav-link');
  links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === currentPath);
  });
}

function initAuthHeader() {
  const loginItem = document.getElementById('auth-login-item');
  const userItem = document.getElementById('auth-user-item');
  const logoutItem = document.getElementById('auth-logout-item');
  const emailSpan = document.getElementById('auth-user-email');
  const logoutBtn = document.getElementById('auth-logout-btn');

  if (!loginItem || !userItem || !logoutItem || !logoutBtn) return;

  function applyUser(user) {
    if (user) {
      loginItem.classList.add('d-none');
      userItem.classList.remove('d-none');
      logoutItem.classList.remove('d-none');
      emailSpan.textContent = user.email;
    } else {
      loginItem.classList.remove('d-none');
      userItem.classList.add('d-none');
      logoutItem.classList.add('d-none');
      emailSpan.textContent = '';
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  applyUser(getUser());

  if (unsubscribeAuth) {
    unsubscribeAuth();
  }
  unsubscribeAuth = onAuthChange(applyUser);

  logoutBtn.addEventListener('click', async () => {
    await signOut();
    navigate('/');
  });
}
