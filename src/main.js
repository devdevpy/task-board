import { renderHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';
import { initRouter, renderCurrentRoute } from './router/router.js';
import { initBackground } from './components/background/background.js';
import { initAuthState, onAuthChange } from './auth/authState.js';

initBackground();
renderHeader();
renderFooter();
initRouter();

initAuthState().then(() => {
  onAuthChange(() => {
    renderHeader();
    renderCurrentRoute();
  });
});
