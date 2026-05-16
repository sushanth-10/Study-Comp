(function () {
  const AUTH_KEY = 'scholarly_logged_in';

  const NAV_ITEMS = [
    { id: 'dashboard', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', href: '/analytics', icon: 'monitoring', label: 'Analytics' },
    { id: 'focus', href: '/focus', icon: 'timer', label: 'Focus' },
    { id: 'notes', href: '/notes', icon: 'description', label: 'Notes' },
    { id: 'streak', href: '/streak', icon: 'local_fire_department', label: 'Streak' },
    { id: 'ai', href: '/ai', icon: 'auto_awesome', label: 'AI Assistant' },
    { id: 'quiz', href: '/quiz', icon: 'quiz', label: 'Quiz' },
  ];

  function isLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function setLoggedIn(value) {
    if (value) {
      sessionStorage.setItem(AUTH_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
  }

  function logout() {
    setLoggedIn(false);
    window.location.href = '/logout';
  }

  function buildSidebar(currentPage, dark) {
    const aside = document.createElement('aside');
    aside.className = 'app-sidebar' + (dark ? ' dark-sidebar' : '');
    aside.setAttribute('aria-label', 'Main navigation');

    const links = NAV_ITEMS.map(
      (item) => `
      <a href="${item.href}" class="app-sidebar-link${currentPage === item.id ? ' active' : ''}">
        <span class="material-symbols-outlined">${item.icon}</span>
        ${item.label}
      </a>`
    ).join('');

    aside.innerHTML = `
      <div class="app-sidebar-brand">
        <a href="/dashboard" class="flex items-center gap-2 no-underline" style="color:inherit">
          <span class="material-symbols-outlined" style="color:${dark ? '#d7e2ff' : '#041632'}">menu_book</span>
          <h1>Scholarly</h1>
        </a>
      </div>
      <nav class="app-sidebar-nav">${links}</nav>
      <div class="app-sidebar-footer">
        <button type="button" class="app-sidebar-logout" id="scholarly-logout">
          <span class="material-symbols-outlined">logout</span>
          Log out
        </button>
      </div>
    `;

    aside.querySelector('#scholarly-logout').addEventListener('click', logout);
    return aside;
  }

  function wrapWithAppShell() {
    const page = document.body.dataset.page;
    const dark = document.body.dataset.theme === 'dark';

    if (!page || document.querySelector('.app-shell')) return;

    const shell = document.createElement('div');
    shell.className = 'app-shell';

    const sidebar = buildSidebar(page, dark);
    const content = document.createElement('main');
    content.className = 'app-content';

    const children = Array.from(document.body.childNodes);
    document.body.innerHTML = '';
    document.body.appendChild(shell);
    shell.appendChild(sidebar);
    shell.appendChild(content);
    children.forEach((node) => content.appendChild(node));
  }

  function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    if (form.getAttribute('method')?.toUpperCase() === 'POST') return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      if (!email?.value.trim() || !password?.value.trim()) {
        alert('Please enter your email and password.');
        return;
      }
      setLoggedIn(true);
      window.location.href = '/dashboard';
    });
  }

  function initSignup() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    if (form.getAttribute('method')?.toUpperCase() === 'POST') return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('full_name');
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const terms = document.getElementById('terms');
      if (!name?.value.trim() || !email?.value.trim() || !password?.value.trim()) {
        alert('Please fill in all fields.');
        return;
      }
      if (terms && !terms.checked) {
        alert('Please accept the Terms of Service.');
        return;
      }
      setLoggedIn(true);
      window.location.href = '/dashboard';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('auth-page')) {
      initLogin();
      initSignup();
      return;
    }

    if (document.body.classList.contains('app-layout')) {
      wrapWithAppShell();
    }
  });
})();
