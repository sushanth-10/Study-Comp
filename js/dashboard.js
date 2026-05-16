(function () {
  const greetingEl = document.getElementById('dashboard-greeting');
  const subtitleEl = document.getElementById('dashboard-subtitle');
  const streakEl = document.getElementById('dashboard-streak-value');
  const goalPctEl = document.getElementById('dashboard-goal-pct');
  const goalRingEl = document.getElementById('dashboard-goal-ring');
  const upcomingTitleEl = document.getElementById('dashboard-upcoming-title');
  const upcomingTimeEl = document.getElementById('dashboard-upcoming-time');
  const notesListEl = document.getElementById('dashboard-notes-list');
  const plannerListEl = document.getElementById('dashboard-planner-list');
  const searchInput = document.getElementById('mindmap-search');
  const searchBtn = document.getElementById('mindmap-btn');
  const suggestionsBox = document.getElementById('mindmap-suggestions');
  const topicsListEl = document.getElementById('mindmap-topics-list');

  const RECENT_NOTES_KEY = 'scholarly_recent_opened_notes';
  const PLANNER_KEY = 'scholarly_planner_tasks';
  const PROFILE_KEY = 'scholarly_profile';

  if (!greetingEl) return;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text || '';
    return el.innerHTML;
  }

  function fmtHours(value) {
    return Number(value || 0).toFixed(1).replace('.0', '');
  }

  function openRoadmap(topic) {
    const cleanTopic = (topic || '').trim();
    if (!cleanTopic) return;
    window.location.href = '/visual?topic=' + encodeURIComponent(cleanTopic) + '&v=' + Date.now();
  }

  function strokeOffset(percent) {
    const circumference = 201;
    return circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;
  }

  function timeAgo(iso) {
    if (!iso) return 'Recently';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return mins + ' mins ago';
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + ' hours ago';
    return Math.round(hours / 24) + ' days ago';
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
  }

  function loadRecentOpenedNotes() {
    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_NOTES_KEY) || '[]');
      return Array.isArray(recent) ? recent : [];
    } catch (error) {
      return [];
    }
  }

  function loadPlannerTasks() {
    try {
      const tasks = JSON.parse(localStorage.getItem(PLANNER_KEY) || '[]');
      return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
      return [];
    }
  }

  function localProfileName(fallback) {
    try {
      const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return profile.name || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function renderNotes(pdfs) {
    if (!notesListEl) return;
    const recent = loadRecentOpenedNotes();
    const pdfById = new Map((pdfs || []).map(function (pdf) {
      return [pdf.id, pdf];
    }));
    const opened = recent
      .filter(function (note) { return pdfById.has(note.id); })
      .map(function (note) {
        return { ...pdfById.get(note.id), opened_at: note.opened_at };
      });
    const remaining = (pdfs || [])
      .filter(function (pdf) {
        return !opened.some(function (note) { return note.id === pdf.id; });
      })
      .sort(function (a, b) {
        return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
      });
    const items = opened.concat(remaining).slice(0, 3);

    if (!items.length) {
      notesListEl.innerHTML =
        '<div class="bg-surface-container-lowest p-unit-4 rounded-xl border border-outline-variant shadow-sm text-on-surface-variant">' +
        'No uploaded notes yet. Add PDFs from the Notes page and they will appear here.' +
        '</div>';
      return;
    }

    notesListEl.innerHTML = items
      .map(function (item) {
        const when = item.opened_at ? 'Opened ' + timeAgo(item.opened_at) : 'Uploaded ' + timeAgo(item.uploaded_at);
        return (
          '<a class="bg-surface-container-lowest p-unit-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-unit-4 hover:border-secondary transition-colors no-underline" href="/api/notes/pdf/' +
          encodeURIComponent(item.id) +
          '" target="_blank" rel="noopener">' +
          '<div class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center">' +
          '<span class="material-symbols-outlined text-primary" style="font-variation-settings:\'FILL\' 1">picture_as_pdf</span>' +
          '</div>' +
          '<div class="flex-grow min-w-0">' +
          '<h4 class="text-label-md font-label-md text-primary truncate">' +
          escapeHtml(item.name || item.filename || 'Uploaded note') +
          '</h4>' +
          '<p class="text-label-sm font-label-sm text-on-surface-variant truncate">' +
          escapeHtml(when) +
          '</p>' +
          '</div><span class="material-symbols-outlined text-on-surface-variant">open_in_new</span></a>'
        );
      })
      .join('');
  }

  function priorityClass(priority) {
    if (priority === 'high') return 'bg-error-container text-error';
    if (priority === 'low') return 'bg-surface-container-high text-on-surface-variant';
    return 'bg-secondary-container text-on-secondary-container';
  }

  function renderPlannerTasks() {
    if (!plannerListEl) return [];
    const todaysTasks = loadPlannerTasks()
      .filter(function (task) {
        return task.date === todayIso() && !task.completed;
      })
      .sort(function (a, b) {
        return (a.time || '').localeCompare(b.time || '');
      });

    if (!todaysTasks.length) {
      plannerListEl.innerHTML =
        '<div class="bg-surface-container-lowest p-unit-4 rounded-xl border border-outline-variant shadow-sm text-on-surface-variant">' +
        'No planner tasks for today.' +
        '</div>';
      return [];
    }

    plannerListEl.innerHTML = todaysTasks
      .slice(0, 3)
      .map(function (task) {
        return (
          '<a class="bg-surface-container-lowest p-unit-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-unit-4 hover:border-secondary transition-colors no-underline" href="/planner">' +
          '<div class="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">' +
          '<span class="material-symbols-outlined">event_available</span></div>' +
          '<div class="flex-grow min-w-0">' +
          '<h4 class="text-label-md font-label-md text-primary truncate">' +
          escapeHtml(task.title) +
          '</h4>' +
          '<p class="text-label-sm font-label-sm text-on-surface-variant truncate">' +
          escapeHtml((task.subject || 'Study') + ' · ' + (task.time || 'Any time') + ' · ' + task.minutes + 'min') +
          '</p></div>' +
          '<span class="px-unit-2 py-unit-1 rounded-full text-label-sm font-label-sm uppercase ' +
          priorityClass(task.priority) +
          '">' +
          escapeHtml(task.priority || 'medium') +
          '</span></a>'
        );
      })
      .join('');
    return todaysTasks;
  }

  const todaysTasks = renderPlannerTasks();

  Promise.all([
    fetchJson('/api/session'),
    fetchJson('/api/dashboard/overview'),
    fetchJson('/api/dashboard/activity'),
    fetchJson('/api/dashboard/insights'),
    fetchJson('/api/notes/list'),
  ])
    .then(function ([session, overview, activity, insights, notes]) {
      const firstName = localProfileName(session.user.name || 'Scholar').split(' ')[0];
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
        upcomingTitleEl.textContent = todaysTasks[0]?.title || activity.items[0]?.title || 'Adaptive Review Session';
      }
      if (upcomingTimeEl) {
        upcomingTimeEl.textContent = todaysTasks[0]
          ? 'Today at ' + todaysTasks[0].time + ' · ' + todaysTasks[0].minutes + ' min'
          : insights.items[0]?.message || 'Your next best study window is ready.';
      }
      renderNotes(notes.pdfs || []);
    })
    .catch(function () {
      renderNotes([]);
    });

  // Mind map search logic
  if (searchInput && searchBtn && suggestionsBox && topicsListEl) {
    const defaultTopics = [
      "Keynesian Theory", "Neural Plasticity", "Organic Chemistry", "Microeconomics", "Data Structures"
    ];

    function renderSuggestions(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = defaultTopics.filter(t => t.toLowerCase().includes(q));
      
      topicsListEl.innerHTML = filtered.length ? filtered.map(t => 
        `<li class="px-4 py-2 hover:bg-surface-container-high cursor-pointer text-body-md text-on-surface transition-colors" data-topic="${escapeHtml(t)}">
          <span class="material-symbols-outlined text-[18px] text-on-surface-variant align-middle mr-2">history</span>${escapeHtml(t)}
        </li>`
      ).join('') : `<li class="px-4 py-2 text-on-surface-variant text-body-sm">No recent topics found. Hit search to generate mind map.</li>`;
    }

    searchInput.addEventListener('focus', function() {
      suggestionsBox.classList.remove('hidden');
      renderSuggestions(searchInput.value);
    });

    searchInput.addEventListener('input', function() {
      renderSuggestions(searchInput.value);
    });

    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target) && !searchBtn.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
      }
    });

    topicsListEl.addEventListener('click', function(e) {
      const li = e.target.closest('li[data-topic]');
      if (li) {
        const topic = li.getAttribute('data-topic');
        searchInput.value = topic;
        suggestionsBox.classList.add('hidden');
        openRoadmap(topic);
      }
    });

    searchBtn.addEventListener('click', function() {
      openRoadmap(searchInput.value);
    });

    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        openRoadmap(searchInput.value);
      }
    });
  }
})();
