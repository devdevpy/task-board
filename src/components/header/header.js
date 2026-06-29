import headerTemplate from './header.html?raw';
import './header.css';

export function renderHeader() {
  const outlet = document.getElementById('header-outlet');
  outlet.innerHTML = headerTemplate;
  highlightActiveLink();
}

export function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('#main-nav .nav-link');
  links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === currentPath);
  });
}
