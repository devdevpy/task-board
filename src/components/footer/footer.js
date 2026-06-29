import footerTemplate from './footer.html?raw';
import './footer.css';

export function renderFooter() {
  const outlet = document.getElementById('footer-outlet');
  outlet.innerHTML = footerTemplate;
}
