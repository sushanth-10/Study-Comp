(function () {
  const timeEl = document.getElementById('focus-time');
  const phaseEl = document.getElementById('focus-phase');
  const titleEl = document.getElementById('focus-title');
  const subtitleEl = document.getElementById('focus-subtitle');
  const startBtn = document.getElementById('focus-start');
  const startIconEl = document.getElementById('focus-start-icon');
  const startLabelEl = document.getElementById('focus-start-label');
  const resetBtn = document.getElementById('focus-reset');
  const endBtn = document.getElementById('focus-end');
  const ringEl = document.getElementById('focus-ring');
  const modeButtons = Array.from(document.querySelectorAll('[data-focus-mode]'));
  const settingsForm = document.getElementById('focus-settings-form');
  const focusLimitInput = document.getElementById('focus-limit');
  const focusSecondsInput = document.getElementById('focus-seconds');
  const breakLimitInput = document.getElementById('break-limit');
  const breakSecondsInput = document.getElementById('break-seconds');

  if (!timeEl || !startBtn || !resetBtn || !endBtn || !ringEl) return;

  const state = {
    mode: 'focus',
    running: false,
    elapsed: 0,
    remaining: 25 * 60,
    focusLimit: 0,
    breakLimit: 25 * 60,
    interruptions: 0,
    startedAt: null,
    ticker: null,
  };

  function format(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
    const secs = String(safe % 60).padStart(2, '0');
    return minutes + ':' + secs;
  }

  function currentDisplaySeconds() {
    return state.mode === 'focus' ? state.elapsed : state.remaining;
  }

  function currentTotalSeconds() {
    if (state.mode === 'focus') return state.focusLimit || Math.max(1, state.elapsed || 1);
    return state.breakLimit || 25 * 60;
  }

  function labelDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (!minutes) return secs + ' seconds';
    if (!secs) return minutes + ' minutes';
    return minutes + ' minutes ' + secs + ' seconds';
  }

  function setRing() {
    const total = currentTotalSeconds();
    const value = state.mode === 'focus' ? Math.min(state.elapsed, total) : state.remaining;
    const pct = state.mode === 'focus' ? value / total : value / total;
    ringEl.setAttribute('stroke-dashoffset', String(289 - Math.max(0, Math.min(1, pct)) * 289));
  }

  function render() {
    timeEl.textContent = format(currentDisplaySeconds());
    const modeLabel = state.mode === 'focus' ? 'Focus mode' : 'Long break';
    if (phaseEl) {
      if (state.running) {
        phaseEl.textContent = state.mode === 'focus' ? 'counting up' : 'minutes remaining';
      } else {
        phaseEl.textContent = modeLabel + ' ready';
      }
    }
    startIconEl.textContent = state.running ? 'pause' : 'play_arrow';
    startLabelEl.textContent = state.running ? 'Pause' : 'Start';
    titleEl.textContent = state.mode === 'focus' ? 'Deep Work Focus' : 'Long Break';
    subtitleEl.textContent =
      state.mode === 'focus'
        ? (state.focusLimit ? 'Custom limit: ' + labelDuration(state.focusLimit) : 'Open-ended focus timer')
        : 'Preset for ' + labelDuration(state.breakLimit);
    modeButtons.forEach(function (button) {
      const active = button.dataset.focusMode === state.mode;
      button.classList.toggle('bg-secondary-container', active);
      button.classList.toggle('text-on-secondary-container', active);
      button.classList.toggle('bg-primary-container/50', !active);
      button.classList.toggle('text-primary-fixed', !active);
    });
    setRing();
  }

  function playFinishSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.setValueAtTime(0.9, context.currentTime);
      master.connect(context.destination);
      [0, 0.24, 0.48, 0.72, 0.96, 1.2, 1.44, 1.68].forEach(function (offset, index) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index % 2 ? 'square' : 'sawtooth';
        oscillator.frequency.value = index % 2 ? 1180 : 760;
        gain.gain.setValueAtTime(0.001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.7, context.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + offset + 0.2);
        oscillator.connect(gain).connect(master);
        oscillator.start(context.currentTime + offset);
        oscillator.stop(context.currentTime + offset + 0.22);
      });
      if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 350]);
    } catch (error) {}
  }

  async function postSession(finalized) {
    if (state.mode !== 'focus' || state.elapsed < 60) return;
    const durationMinutes = Math.max(1, Math.round(state.elapsed / 60));
    const focusScore = Math.max(50, 92 - state.interruptions * 8 - (finalized ? 0 : 10));
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
        interruptions: state.interruptions,
        metadata: {
          finalized: finalized,
          timerMode: state.mode,
          timerLength: state.focusLimit ? state.focusLimit / 60 : durationMinutes,
        },
      }),
    }).catch(function () {});
  }

  function stopTicker() {
    clearInterval(state.ticker);
    state.ticker = null;
    state.running = false;
  }

  function completeTimer() {
    stopTicker();
    playFinishSound();
    if (phaseEl) phaseEl.textContent = state.mode === 'focus' ? 'focus limit complete' : 'break complete';
    postSession(true);
    render();
  }

  function tick() {
    if (state.mode === 'focus') {
      state.elapsed += 1;
      if (state.focusLimit && state.elapsed >= state.focusLimit) {
        completeTimer();
        return;
      }
    } else {
      state.remaining -= 1;
      if (state.remaining <= 0) {
        state.remaining = 0;
        completeTimer();
        return;
      }
    }
    render();
  }

  function startTimer() {
    if (!state.startedAt) state.startedAt = Date.now();
    state.running = true;
    state.ticker = setInterval(tick, 1000);
    render();
  }

  function pauseTimer() {
    state.interruptions += 1;
    stopTicker();
    render();
  }

  function resetTimer() {
    stopTicker();
    state.elapsed = 0;
    state.remaining = state.breakLimit;
    state.interruptions = 0;
    state.startedAt = null;
    render();
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    if (state.running && state.mode === 'focus') postSession(false);
    state.mode = mode;
    resetTimer();
  }

  startBtn.addEventListener('click', function () {
    if (state.running) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', resetTimer);

  endBtn.addEventListener('click', function (event) {
    event.preventDefault();
    postSession(false).finally(function () {
      window.location.href = '/dashboard';
    });
  });

  modeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      setMode(button.dataset.focusMode);
    });
  });

  settingsForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const focusMinutes = Math.max(0, Number(focusLimitInput.value || 0));
    const focusSeconds = Math.max(0, Math.min(59, Number(focusSecondsInput.value || 0)));
    const breakMinutes = Math.max(0, Number(breakLimitInput.value || 25));
    const breakSeconds = Math.max(0, Math.min(59, Number(breakSecondsInput.value || 0)));
    state.focusLimit = focusMinutes * 60 + focusSeconds;
    state.breakLimit = Math.max(1, breakMinutes * 60 + breakSeconds);
    resetTimer();
  });

  fetch('/api/focus/analytics')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const completedEl = document.getElementById('focus-completed');
      const averageEl = document.getElementById('focus-average');
      if (completedEl) completedEl.textContent = data.completedSessions || 0;
      if (averageEl) averageEl.textContent = (data.averageFocusDuration || 0) + 'm';
    })
    .catch(function () {});

  render();
})();
