import toastTemplate from './toast.html?raw';
import './toast.css';

const ICONS = {
  success: 'check-circle',
  error: 'circle-x',
  info: 'info',
  warning: 'alert-triangle',
};

export function renderToastContainer() {
  const container = document.getElementById('toast-container');
  if (container) return;

  const div = document.createElement('div');
  div.innerHTML = toastTemplate;
  document.body.appendChild(div.firstElementChild);
}

export function showToast(message, type = 'info', duration = 4000) {
  renderToastContainer();

  const container = document.getElementById('toast-container');
  const iconName = ICONS[type] || ICONS.info;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon"><i data-lucide="${iconName}"></i></span>
    <span class="toast-body">${message}</span>
    <button class="toast-close" type="button" aria-label="Close">
      <i data-lucide="x"></i>
    </button>
  `;

  container.appendChild(toast);

  if (window.lucide) {
    window.lucide.createIcons({ nodes: [toast] });
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  const remove = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  };

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', remove);

  let timer = setTimeout(remove, duration);

  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    timer = setTimeout(remove, duration);
  });
}
