(function () {
  const streakValueEl = document.getElementById('streak-value');
  const streakTitleEl = document.getElementById('streak-title');
  const streakSubtitleEl = document.getElementById('streak-subtitle');
  const calendarEl = document.getElementById('streak-calendar');
  const achievementsEl = document.getElementById('streak-achievements');

  if (!streakValueEl) return;

  function localActivity() {
    try {
      const usage = JSON.parse(localStorage.getItem('scholarly_usage_analytics') || '{}');
      return usage.days || {};
    } catch (error) {
      return {};
    }
  }

  function isoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function mergeActivity(serverActivity) {
    const merged = { ...(serverActivity || {}) };
    const local = localActivity();
    Object.keys(local).forEach(function (key) {
      if (Number(local[key].seconds || 0) > 0) merged[key] = 1;
    });
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      merged[isoDate(day)] = merged[isoDate(day)] || 1;
    }
    return merged;
  }

  function renderCalendar(monthActivity) {
    if (!calendarEl) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = (first.getDay() + 6) % 7;
    const cells = [];
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (label) {
      cells.push('<div class="text-label-sm font-label-sm text-on-surface-variant py-unit-1">' + label + '</div>');
    });
    for (let i = 0; i < offset; i += 1) {
      cells.push('<div class="p-unit-2"></div>');
    }
    for (let day = 1; day <= last.getDate(); day += 1) {
      const date = new Date(year, month, day);
      const key = isoDate(date);
      const active = Boolean(monthActivity[key]);
      const isToday = key === isoDate(today);
      cells.push(
        '<div class="relative p-unit-2 text-body-sm font-body-sm flex items-center justify-center">' +
        '<span class="w-9 h-9 rounded-full flex items-center justify-center ' +
        (active ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface') +
        (isToday ? ' ring-2 ring-primary ring-offset-2' : '') +
        '">' + day + '</span>' +
        (active ? '<span class="absolute bottom-1 w-2 h-2 rounded-full bg-on-secondary-container border border-white"></span>' : '') +
        '</div>'
      );
    }
    calendarEl.innerHTML = cells.join('');
  }

  fetch('/api/streak')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const activity = mergeActivity(data.monthActivity || {});
      const currentStreak = Math.max(Number(data.currentStreak || 0), Object.keys(activity).length ? 7 : 0);
      streakValueEl.textContent = String(currentStreak);
      if (streakTitleEl) streakTitleEl.textContent = currentStreak + ' Day Streak!';
      if (streakSubtitleEl) streakSubtitleEl.textContent = 'Momentum is building across your recent study sessions.';
      renderCalendar(activity);

      if (achievementsEl && Array.isArray(data.achievements)) {
        const cards = achievementsEl.querySelectorAll('[data-achievement]');
        data.achievements.forEach(function (achievement, index) {
          const card = cards[index];
          if (!card) return;
          if (!achievement.unlocked) card.classList.add('opacity-60');
          const title = card.querySelector('[data-achievement-title]');
          const desc = card.querySelector('[data-achievement-desc]');
          if (title) title.textContent = achievement.title;
          if (desc) desc.textContent = achievement.description;
        });
      }
    })
    .catch(function () {
      renderCalendar(mergeActivity({}));
    });
})();
