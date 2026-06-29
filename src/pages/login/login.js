import loginTemplate from './login.html?raw';
import './login.css';
import { signIn, signUp } from '../../auth/authState.js';
import { navigate } from '../../router/router.js';

let mode = 'login'; // 'login' | 'register'

export function renderLoginPage() {
  return loginTemplate;
}

export function mountLoginPage() {
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const switchText = document.getElementById('auth-switch-text');
  const toggleBtn = document.getElementById('auth-toggle');
  const submitBtn = document.getElementById('auth-submit');
  const form = document.getElementById('auth-form');
  const alertBox = document.getElementById('auth-alert');

  function showAlert(message, type = 'danger') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} mb-3`;
    alertBox.classList.remove('d-none');
  }

  function clearAlert() {
    alertBox.classList.add('d-none');
  }

  function updateUi() {
    if (mode === 'login') {
      title.textContent = 'Welcome back';
      subtitle.textContent = 'Sign in to manage your projects';
      switchText.textContent = "Don't have an account?";
      toggleBtn.textContent = 'Create one';
      submitBtn.innerHTML = '<i data-lucide="log-in"></i> Login';
    } else {
      title.textContent = 'Create account';
      subtitle.textContent = 'Start managing your projects today';
      switchText.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign in';
      submitBtn.innerHTML = '<i data-lucide="user-plus"></i> Register';
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  toggleBtn.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    clearAlert();
    updateUi();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-75');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { error } =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password);

    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-75');

    if (error) {
      showAlert(error.message);
      return;
    }

    if (mode === 'register') {
      showAlert('Account created! Please check your email to confirm, then log in.', 'success');
      mode = 'login';
      updateUi();
      return;
    }

    navigate('/dashboard');
  });

  updateUi();
}
