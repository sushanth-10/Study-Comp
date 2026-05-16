(function () {
  const timeEl = document.getElementById('focus-time');
  const phaseEl = document.getElementById('focus-phase');
  const titleEl = document.getElementById('focus-title');
  const subtitleEl = document.getElementById('focus-subtitle');
  const pauseBtn = document.getElementById('focus-pause');
  const pauseLabelEl = document.getElementById('focus-pause-label');
  const endBtn = document.getElementById('focus-end');
  const ringEl = document.getElementById('focus-ring');

  if (!timeEl || !pauseBtn || !endBtn) return;

  let totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let running = true;
  let interruptions = 0;
  const startedAt = Date.now();

  function render() {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    timeEl.textContent = minutes + ':' + seconds;
    if (phaseEl) phaseEl.textContent = running ? 'minutes remaining' : 'paused';
    if (ringEl) {
      const pct = remaining / totalSeconds;
      ringEl.setAttribute('stroke-dashoffset', String(289 - pct * 289));
    }
  }

  async function postSession(finalized) {
    const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const focusScore = Math.max(50, 92 - interruptions * 8 - (finalized ? 0 : 10));
    await fetch('/api/analytics/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'focus',
        subject: 'Deep Work',
        topic: titleEl ? titleEl.textContent : 'Focus Session',
        durationMinutes: durationMinutes,
        focusScore: focusScore,
        productivityScore: Math.max(55, focusScore - 4),
        fatigueScore: Math.min(65, 18 + durationMinutes / 2),
        interruptions: interruptions,
        metadata: { finalized: finalized, timerLength: totalSeconds / 60 },
      }),
    }).catch(function () {});
  }

  pauseBtn.addEventListener('click', function () {
    running = !running;
    if (!running) interruptions += 1;
    pauseBtn.querySelector('.material-symbols-outlined').textContent = running ? 'pause' : 'play_arrow';
    if (pauseLabelEl) pauseLabelEl.textContent = running ? 'Pause' : 'Resume';
    render();
  });

  endBtn.addEventListener('click', function (event) {
    event.preventDefault();
    postSession(false).finally(function () {
      window.location.href = '/dashboard';
    });
  });

  fetch('/api/focus/analytics')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (titleEl && data.completedSessions) {
        titleEl.textContent = data.completedSessions + ' focus sessions completed';
      }
      if (subtitleEl && data.averageFocusDuration) {
        subtitleEl.textContent = 'Avg focus block ' + data.averageFocusDuration + ' mins · Productivity ' + data.productivityScore;
      }
    })
    .catch(function () {});

  render();
  const ticker = setInterval(function () {
    if (!running) return;
    remaining -= 1;
    render();
    if (remaining <= 0) {
      clearInterval(ticker);
      running = false;
      phaseEl.textContent = 'session complete';
      pauseBtn.disabled = true;
      postSession(true);
    }
  }, 1000);
})();
