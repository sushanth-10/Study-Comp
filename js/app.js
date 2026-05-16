(function () {
  const AUTH_KEY = 'scholarly_logged_in';
  const PROFILE_KEY = 'scholarly_profile';
  const ANALYTICS_KEY = 'scholarly_usage_analytics';

  const NAV_ITEMS = [
    { id: 'dashboard', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'analytics', href: '/analytics', icon: 'monitoring', label: 'Analytics' },
    { id: 'planner', href: '/planner', icon: 'event_note', label: 'Study Planner' },
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

  function readProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function writeProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  function profileInitial(name) {
    const value = (name || 'Scholar').trim();
    return value ? value.charAt(0).toUpperCase() : 'S';
  }

  function profileName() {
    return readProfile().name || 'Scholar';
  }

  function profileAvatarHtml(profile, sizeClass) {
    if (profile.photo) {
      return '<img alt="Profile photo" class="w-full h-full object-cover" src="' + profile.photo + '"/>';
    }
    return '<span class="' + (sizeClass || 'text-label-md') + ' font-label-md">' + profileInitial(profile.name) + '</span>';
  }

  function renderProfileButtons() {
    const profile = readProfile();
    profile.name = profile.name || 'Scholar';
    document.querySelectorAll('.scholarly-profile-button').forEach(function (button) {
      button.innerHTML = profileAvatarHtml(profile, 'text-label-md');
      button.setAttribute('aria-label', 'Edit profile for ' + profile.name);
      button.title = 'Edit profile';
    });
    const preview = document.getElementById('profile-preview');
    if (preview) preview.innerHTML = profileAvatarHtml(profile, 'text-headline-sm');
    const nameInput = document.getElementById('profile-name-input');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.name;
    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) greetingEl.textContent = 'Hello, ' + profile.name.split(' ')[0] + '!';
  }

  function ensureProfileModal() {
    if (document.getElementById('profile-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'profile-modal hidden';
    modal.innerHTML = `
      <form id="profile-form" class="profile-card">
        <div class="profile-card-header">
          <div>
            <h2>Edit Profile</h2>
            <p>Update your display name and profile photo.</p>
          </div>
          <button id="profile-close" class="profile-icon-button" type="button" aria-label="Close profile editor">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="profile-photo-row">
          <div id="profile-preview" class="profile-preview"></div>
          <div>
            <label class="profile-upload-button" for="profile-photo-input">
              <span class="material-symbols-outlined">add_a_photo</span>
              Choose Photo
            </label>
            <input id="profile-photo-input" type="file" accept="image/*" hidden/>
            <button id="profile-remove-photo" class="profile-remove-button" type="button">Remove photo</button>
          </div>
        </div>
        <label class="profile-field">
          Name
          <input id="profile-name-input" type="text" placeholder="Your name" maxlength="80"/>
        </label>
        <button class="profile-save-button" type="submit">Save Profile</button>
      </form>
    `;
    document.body.appendChild(modal);

    const form = document.getElementById('profile-form');
    const close = document.getElementById('profile-close');
    const nameInput = document.getElementById('profile-name-input');
    const fileInput = document.getElementById('profile-photo-input');
    const removePhoto = document.getElementById('profile-remove-photo');

    close.addEventListener('click', closeProfileModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeProfileModal();
    });
    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const profile = readProfile();
        profile.name = nameInput.value.trim() || profile.name || 'Scholar';
        profile.photo = reader.result;
        writeProfile(profile);
        renderProfileButtons();
      };
      reader.readAsDataURL(file);
    });
    removePhoto.addEventListener('click', function () {
      const profile = readProfile();
      delete profile.photo;
      writeProfile(profile);
      fileInput.value = '';
      renderProfileButtons();
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const profile = readProfile();
      profile.name = nameInput.value.trim() || 'Scholar';
      writeProfile(profile);
      renderProfileButtons();
      closeProfileModal();
    });
  }

  function openProfileModal() {
    ensureProfileModal();
    renderProfileButtons();
    const modal = document.getElementById('profile-modal');
    modal.classList.remove('hidden');
    document.getElementById('profile-name-input').focus();
  }

  function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('hidden');
  }

  function makeProfileButton(extraClass) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scholarly-profile-button ' + (extraClass || '');
    button.addEventListener('click', openProfileModal);
    return button;
  }

  function readUsage() {
    try {
      const value = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch (error) {
      return {};
    }
  }

  function writeUsage(data) {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function trackTimeOnSite() {
    const page = document.body.dataset.page || 'app';
    const startedAt = Date.now();
    function commitTime() {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const usage = readUsage();
      const key = todayKey();
      usage.days = usage.days || {};
      usage.days[key] = usage.days[key] || { seconds: 0, pages: {}, sessions: 0 };
      usage.days[key].seconds += seconds;
      usage.days[key].sessions += 1;
      usage.days[key].pages[page] = (usage.days[key].pages[page] || 0) + seconds;
      usage.lastSeen = new Date().toISOString();
      writeUsage(usage);
    }
    window.addEventListener('pagehide', commitTime, { once: true });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') commitTime();
    }, { once: true });
  }

  function installProfileButton() {
    ensureProfileModal();
    renderProfileButtons();

    fetch('/api/session')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (session) {
        if (!session || !session.user) return;
        const profile = readProfile();
        if (!profile.name || profile.name === 'Scholar') {
          profile.name = session.user.name || 'Scholar';
          if (session.user.avatarUrl && !profile.photo) profile.photo = session.user.avatarUrl;
          writeProfile(profile);
          renderProfileButtons();
        }
      })
      .catch(function () { });
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
      installProfileButton();
      trackTimeOnSite();
    }
  });
})();
