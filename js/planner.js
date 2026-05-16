(function () {
  const STORAGE_KEY = 'scholarly_planner_tasks';
  const listEl = document.getElementById('planner-task-list');
  const modalEl = document.getElementById('planner-modal');
  const formEl = document.getElementById('planner-form');
  const openBtn = document.getElementById('planner-add-open');
  const closeBtn = document.getElementById('planner-add-close');

  if (!listEl || !modalEl || !formEl || !openBtn || !closeBtn) return;

  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const dateInput = document.getElementById('planner-date');
  const titleInput = document.getElementById('planner-title');
  const subjectInput = document.getElementById('planner-subject');
  const timeInput = document.getElementById('planner-time');
  const minutesInput = document.getElementById('planner-minutes');
  const priorityInput = document.getElementById('planner-priority');

  function isoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function defaultTasks() {
    return [
      {
        id: crypto.randomUUID(),
        title: 'Review Calculus - Derivatives',
        subject: 'Mathematics',
        date: isoDate(today),
        time: '09:00',
        minutes: 60,
        priority: 'high',
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: 'Practice Organic Chemistry',
        subject: 'Chemistry',
        date: isoDate(today),
        time: '14:00',
        minutes: 45,
        priority: 'medium',
        completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: 'Read Physics Chapter 7',
        subject: 'Physics',
        date: isoDate(tomorrow),
        time: '10:30',
        minutes: 50,
        priority: 'low',
        completed: false,
      },
    ];
  }

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) return saved;
    } catch (error) {}
    const seeded = defaultTasks();
    saveTasks(seeded);
    return seeded;
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  let tasks = loadTasks();

  function formatDateLabel(value) {
    if (value === isoDate(today)) return 'Today';
    if (value === isoDate(tomorrow)) return 'Tomorrow';
    return new Date(value + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatHours(minutes) {
    if (minutes < 60) return minutes + 'm';
    const hours = minutes / 60;
    return Number.isInteger(hours) ? hours + 'h' : hours.toFixed(1) + 'h';
  }

  function priorityClasses(priority) {
    if (priority === 'high') return 'bg-error-container text-error';
    if (priority === 'low') return 'bg-surface-container-high text-on-surface-variant';
    return 'bg-secondary-container text-on-secondary-container';
  }

  function priorityBorder(priority) {
    if (priority === 'high') return 'border-l-error';
    if (priority === 'low') return 'border-l-outline-variant';
    return 'border-l-secondary';
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const minutes = tasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0);
    const pending = total - completed;
    document.getElementById('planner-total').textContent = String(total);
    document.getElementById('planner-completed').textContent = completed + '/' + total;
    document.getElementById('planner-hours').textContent = formatHours(minutes);
    document.getElementById('planner-pending-label').textContent = pending + ' pending';

    const priorities = ['high', 'medium', 'low'];
    document.getElementById('planner-priority-list').innerHTML = priorities
      .map(function (priority) {
        const count = tasks.filter((task) => task.priority === priority && !task.completed).length;
        return `
          <div class="flex items-center justify-between rounded-lg bg-surface-container-low px-unit-3 py-unit-3">
            <span class="text-label-md font-label-md capitalize text-primary">${priority}</span>
            <span class="text-label-md font-label-md text-on-surface-variant">${count}</span>
          </div>
        `;
      })
      .join('');
  }

  function renderTasks() {
    const sorted = tasks.slice().sort(function (a, b) {
      return (a.date + a.time).localeCompare(b.date + b.time);
    });
    const groups = sorted.reduce(function (result, task) {
      result[task.date] = result[task.date] || [];
      result[task.date].push(task);
      return result;
    }, {});

    if (!sorted.length) {
      listEl.innerHTML = `
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-unit-8 text-center">
          <span class="material-symbols-outlined text-primary text-[40px]">event_available</span>
          <h3 class="text-headline-sm font-headline-sm text-primary mt-unit-3">Nothing planned yet</h3>
          <p class="text-body-sm text-on-surface-variant mt-unit-1">Add your first task to build a study schedule.</p>
        </div>
      `;
      updateStats();
      return;
    }

    listEl.innerHTML = Object.keys(groups)
      .map(function (date) {
        const pending = groups[date].filter((task) => !task.completed).length;
        const cards = groups[date]
          .map(function (task) {
            const completeClass = task.completed ? 'opacity-60' : '';
            return `
              <article class="bg-surface-container-lowest rounded-xl border border-outline-variant border-l-4 ${priorityBorder(task.priority)} shadow-sm p-unit-4 flex items-center gap-unit-4 ${completeClass}" data-id="${task.id}">
                <button class="planner-toggle w-10 h-10 shrink-0 rounded-full border-2 ${task.completed ? 'border-secondary bg-secondary-container text-on-secondary-container' : 'border-outline text-transparent'} flex items-center justify-center" type="button" aria-label="Toggle complete">
                  <span class="material-symbols-outlined">check</span>
                </button>
                <div class="min-w-0 flex-1">
                  <h4 class="text-headline-sm font-headline-sm text-primary ${task.completed ? 'line-through' : ''}">${task.title}</h4>
                  <div class="mt-unit-3 flex flex-wrap items-center gap-unit-3 text-body-sm text-on-surface-variant">
                    <span class="inline-flex items-center gap-unit-1"><span class="material-symbols-outlined text-[18px]">menu_book</span>${task.subject}</span>
                    <span class="inline-flex items-center gap-unit-1"><span class="material-symbols-outlined text-[18px]">schedule</span>${task.time} (${task.minutes}min)</span>
                    <span class="px-unit-2 py-unit-1 rounded-full text-label-sm font-label-sm uppercase ${priorityClasses(task.priority)}">${task.priority}</span>
                  </div>
                </div>
                <button class="planner-delete w-10 h-10 rounded-full text-error hover:bg-error-container flex items-center justify-center" type="button" aria-label="Delete task">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </article>
            `;
          })
          .join('');
        return `
          <section class="mb-unit-8">
            <div class="flex items-center gap-unit-2 mb-unit-3">
              <span class="material-symbols-outlined text-secondary">calendar_month</span>
              <h3 class="text-headline-sm font-headline-sm text-primary">${formatDateLabel(date)}</h3>
              <span class="text-label-md font-label-md text-on-surface-variant">${pending} pending</span>
            </div>
            <div class="space-y-unit-4">${cards}</div>
          </section>
        `;
      })
      .join('');
    updateStats();
  }

  function openModal() {
    formEl.reset();
    dateInput.value = isoDate(today);
    timeInput.value = '09:00';
    minutesInput.value = '45';
    priorityInput.value = 'medium';
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
    setTimeout(function () { titleInput.focus(); }, 0);
  }

  function closeModal() {
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modalEl.addEventListener('click', function (event) {
    if (event.target === modalEl) closeModal();
  });

  formEl.addEventListener('submit', function (event) {
    event.preventDefault();
    tasks.push({
      id: crypto.randomUUID(),
      title: titleInput.value.trim(),
      subject: subjectInput.value.trim(),
      date: dateInput.value,
      time: timeInput.value,
      minutes: Number(minutesInput.value),
      priority: priorityInput.value,
      completed: false,
    });
    saveTasks(tasks);
    closeModal();
    renderTasks();
  });

  listEl.addEventListener('click', function (event) {
    const card = event.target.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    if (event.target.closest('.planner-toggle')) {
      tasks = tasks.map(function (task) {
        return task.id === id ? { ...task, completed: !task.completed } : task;
      });
    }
    if (event.target.closest('.planner-delete')) {
      tasks = tasks.filter(function (task) { return task.id !== id; });
    }
    saveTasks(tasks);
    renderTasks();
  });

  renderTasks();
})();
