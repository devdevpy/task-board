import { renderHeader } from './components/header/header.js';
import { renderFooter } from './components/footer/footer.js';
import { initRouter } from './router/router.js';
import { initBackground } from './components/background/background.js';

initBackground();
renderHeader();
renderFooter();
initRouter();
