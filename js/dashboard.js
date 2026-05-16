(function () {
  const greetingEl = document.getElementById('dashboard-greeting');
  const subtitleEl = document.getElementById('dashboard-subtitle');
  const streakEl = document.getElementById('dashboard-streak-value');
  const goalPctEl = document.getElementById('dashboard-goal-pct');
  const goalRingEl = document.getElementById('dashboard-goal-ring');
  const upcomingTitleEl = document.getElementById('dashboard-upcoming-title');
  const upcomingTimeEl = document.getElementById('dashboard-upcoming-time');
  const notesListEl = document.getElementById('dashboard-notes-list');

  if (!greetingEl) return;

  function fmtHours(value) {
    return Number(value || 0).toFixed(1).replace('.0', '');
  }

  function strokeOffset(percent) {
    const circumference = 201;
    return circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return mins + ' mins ago';
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + ' hours ago';
    return Math.round(hours / 24) + ' days ago';
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
  }

  function renderNotes(items) {
    if (!notesListEl) return;
    notesListEl.innerHTML = '';
    items.slice(0, 3).forEach(function (item, index) {
      const icon = index === 1 ? 'bookmark' : 'description';
      const wrap = document.createElement('div');
      wrap.className =
        'bg-surface-container-lowest p-unit-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-unit-4';
      wrap.innerHTML =
        '<div class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">' +
        '<span class="material-symbols-outlined text-primary"' +
        (icon === 'bookmark' ? " style=\"font-variation-settings: 'FILL' 1;\"" : '') +
        '>' + icon + '</span></div>' +
        '<div class="flex-grow">' +
        '<h4 class="text-label-md font-label-md text-primary">' + item.title + '</h4>' +
        '<p class="text-label-sm font-label-sm text-on-surface-variant">' + timeAgo(item.timestamp) + '</p>' +
        '</div><span class="material-symbols-outlined text-on-surface-variant">more_vert</span>';
      notesListEl.appendChild(wrap);
    });
  }

  Promise.all([
    fetchJson('/api/session'),
    fetchJson('/api/dashboard/overview'),
    fetchJson('/api/dashboard/activity'),
    fetchJson('/api/dashboard/insights'),
  ])
    .then(function ([session, overview, activity, insights]) {
      const firstName = (session.user.name || 'Scholar').split(' ')[0];
      greetingEl.textContent = 'Hello, ' + firstName + '!';
      subtitleEl.textContent =
        fmtHours(overview.studyHours) +
        'h studied today · Focus ' +
        overview.focusScore +
        ' · Mastery ' +
        overview.masteryLevel +
        '% · Consistency ' +
        overview.weeklyConsistency +
        '%';
      if (streakEl) streakEl.textContent = String(overview.weeklyStreak);
      if (goalPctEl) goalPctEl.textContent = overview.topicCompletion + '%';
      if (goalRingEl) goalRingEl.setAttribute('stroke-dashoffset', String(strokeOffset(overview.topicCompletion)));
      if (upcomingTitleEl) {
        upcomingTitleEl.textContent =
          activity.items[0]?.title || insights.items[0]?.title || 'Adaptive Review Session';
      }
      if (upcomingTimeEl) {
        const insight = insights.items[0];
        upcomingTimeEl.textContent = insight ? insight.message : 'Your next best study window is ready.';
      }
      renderNotes(activity.items.filter(function (item) {
        return !/quiz$/i.test(item.title);
      }));
    })
    .catch(function () {});
})();
