(function () {
  const streakValueEl = document.getElementById('streak-value');
  const streakTitleEl = document.getElementById('streak-title');
  const streakSubtitleEl = document.getElementById('streak-subtitle');
  const calendarEl = document.getElementById('streak-calendar');
  const achievementsEl = document.getElementById('streak-achievements');

  if (!streakValueEl) return;

  fetch('/api/streak')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      streakValueEl.textContent = String(data.currentStreak);
      if (streakTitleEl) streakTitleEl.textContent = data.currentStreak + ' Day Streak!';
      if (streakSubtitleEl) streakSubtitleEl.textContent = 'Momentum is building across your recent study sessions.';

      if (calendarEl) {
        Array.from(calendarEl.querySelectorAll('[data-day]')).forEach(function (cell) {
          const key = cell.getAttribute('data-date');
          if (key && data.monthActivity[key]) {
            cell.classList.add('bg-secondary', 'text-on-secondary', 'rounded-full');
            if (cell.getAttribute('data-is-today') === 'true') {
              cell.classList.add('border-2', 'border-on-secondary-container');
            }
          }
        });
      }

      if (achievementsEl && Array.isArray(data.achievements)) {
        const cards = achievementsEl.querySelectorAll('[data-achievement]');
        data.achievements.forEach(function (achievement, index) {
          const card = cards[index];
          if (!card) return;
          if (!achievement.unlocked) {
            card.classList.add('opacity-60');
          }
          const title = card.querySelector('[data-achievement-title]');
          const desc = card.querySelector('[data-achievement-desc]');
          if (title) title.textContent = achievement.title;
          if (desc) desc.textContent = achievement.description;
        });
      }
    })
    .catch(function () {});
})();
