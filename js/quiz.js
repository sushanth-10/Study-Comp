(function () {
  const setupEl = document.getElementById('quiz-setup');
  const playEl = document.getElementById('quiz-play');
  const resultsEl = document.getElementById('quiz-results');
  const footerEl = document.getElementById('quiz-footer');
  const form = document.getElementById('quiz-form');
  const topicInput = document.getElementById('quiz-topic');
  const countSelect = document.getElementById('quiz-count');
  const generateBtn = document.getElementById('quiz-generate');
  const setupError = document.getElementById('quiz-setup-error');

  const progressLabel = document.getElementById('quiz-progress-label');
  const progressPct = document.getElementById('quiz-progress-pct');
  const progressBar = document.getElementById('quiz-progress-bar');
  const questionTitle = document.getElementById('quiz-question');
  const topicBadge = document.getElementById('quiz-topic-badge');
  const optionsEl = document.getElementById('quiz-options');
  const skipBtn = document.getElementById('quiz-skip');
  const submitBtn = document.getElementById('quiz-submit');
  const feedbackEl = document.getElementById('quiz-feedback');

  const scoreEl = document.getElementById('quiz-final-score');
  const summaryEl = document.getElementById('quiz-final-summary');
  const restartBtn = document.getElementById('quiz-restart');

  if (!setupEl || !form) return;

  const optionBase =
    'bg-surface-container-lowest p-unit-4 rounded-xl border border-surface-container-high shadow-sm hover:border-secondary transition-all active:scale-[0.98] flex items-start gap-unit-4';
  const optionSelected =
    'bg-secondary-container p-unit-4 rounded-xl border-2 border-on-secondary-container shadow-sm flex items-start gap-unit-4';
  const optionCorrect =
    'bg-secondary-container p-unit-4 rounded-xl border-2 border-on-secondary-container shadow-sm flex items-start gap-unit-4';
  const optionWrong =
    'bg-error-container p-unit-4 rounded-xl border-2 border-error shadow-sm flex items-start gap-unit-4';

  let state = {
    questions: [],
    topic: '',
    difficulty: 'moderate',
    index: 0,
    selected: null,
    answered: false,
    score: 0,
    skipped: 0,
  };

  function show(view) {
    setupEl.classList.toggle('hidden', view !== 'setup');
    playEl.classList.toggle('hidden', view !== 'play');
    resultsEl.classList.toggle('hidden', view !== 'results');
    footerEl.classList.toggle('hidden', view !== 'play');
  }

  function getDifficulty() {
    const picked = form.querySelector('input[name="difficulty"]:checked');
    return picked ? picked.value : 'moderate';
  }

  function setLoading(loading) {
    generateBtn.disabled = loading;
    generateBtn.textContent = loading ? 'Generating…' : 'Generate Quiz';
  }

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    const total = state.questions.length;
    const num = state.index + 1;
    const pct = Math.round((num / total) * 100);

    progressLabel.textContent = 'QUESTION ' + num + ' OF ' + total;
    progressPct.textContent = pct + '% Complete';
    progressBar.style.width = pct + '%';
    questionTitle.textContent = q.question;
    topicBadge.textContent = state.topic.toUpperCase() + ' · ' + state.difficulty.toUpperCase();

    optionsEl.innerHTML = '';
    state.selected = null;
    state.answered = false;
    feedbackEl.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Answer';

    q.options.forEach(function (opt, i) {
      const letter = String.fromCharCode(65 + i);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full text-left group quiz-option';
      btn.dataset.index = String(i);
      btn.innerHTML =
        '<div class="' +
        optionBase +
        '">' +
        '<div class="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high text-primary font-bold flex items-center justify-center text-label-md group-hover:bg-secondary group-hover:text-on-secondary transition-colors">' +
        letter +
        '</div>' +
        '<p class="text-body-md font-body-md text-on-surface-variant group-hover:text-on-surface transition-colors pt-1 flex-1">' +
        escapeHtml(opt) +
        '</p></div>';
      btn.addEventListener('click', function () {
        if (state.answered) return;
        optionsEl.querySelectorAll('.quiz-option div').forEach(function (inner) {
          inner.className = optionBase;
        });
        state.selected = i;
        btn.querySelector('div').className = optionSelected;
      });
      optionsEl.appendChild(btn);
    });
  }

  function markAnswer(correct) {
    state.answered = true;
    const q = state.questions[state.index];
    const buttons = optionsEl.querySelectorAll('.quiz-option');

    buttons.forEach(function (btn, i) {
      const inner = btn.querySelector('div');
      if (i === q.correct_index) inner.className = optionCorrect;
      else if (state.selected === i) inner.className = optionWrong;
    });

    if (correct) state.score += 1;
    feedbackEl.classList.remove('hidden');
    feedbackEl.innerHTML =
      '<p class="text-body-sm ' +
      (correct ? 'text-secondary' : 'text-error') +
      ' font-label-md">' +
      (correct ? 'Correct!' : 'Not quite.') +
      (q.explanation ? ' ' + escapeHtml(q.explanation) : '') +
      '</p>';
    submitBtn.textContent =
      state.index < state.questions.length - 1 ? 'Next Question' : 'See Results';
  }

  function showResults() {
    const total = state.questions.length;
    const pct = Math.round((state.score / total) * 100);
    scoreEl.textContent = state.score + ' / ' + total;
    summaryEl.textContent =
      'You scored ' +
      pct +
      '% on ' +
      state.topic +
      ' (' +
      state.difficulty +
      '). ' +
      (state.skipped ? state.skipped + ' skipped. ' : '') +
      'Keep practicing to improve retention!';
    show('results');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    setupError.classList.add('hidden');
    const topic = topicInput.value.trim();
    const difficulty = getDifficulty();
    const count = parseInt(countSelect.value, 10) || 15;

    if (topic.length < 2) {
      setupError.textContent = 'Please enter a topic (at least 2 characters).';
      setupError.classList.remove('hidden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate quiz');

      state = {
        questions: data.questions,
        topic: data.topic,
        difficulty: data.difficulty,
        index: 0,
        selected: null,
        answered: false,
        score: 0,
        skipped: 0,
      };

      show('play');
      renderQuestion();
    } catch (err) {
      setupError.textContent = err.message;
      setupError.classList.remove('hidden');
    } finally {
      setLoading(false);
    }
  });

  skipBtn.addEventListener('click', function () {
    if (!state.answered) {
      state.skipped += 1;
      if (state.index < state.questions.length - 1) {
        state.index += 1;
        renderQuestion();
      } else {
        showResults();
      }
    }
  });

  submitBtn.addEventListener('click', function () {
    if (!state.answered) {
      if (state.selected === null) {
        feedbackEl.classList.remove('hidden');
        feedbackEl.innerHTML =
          '<p class="text-body-sm text-error">Select an answer before submitting.</p>';
        return;
      }
      const q = state.questions[state.index];
      markAnswer(state.selected === q.correct_index);
      return;
    }

    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResults();
    }
  });

  restartBtn.addEventListener('click', function () {
    show('setup');
    topicInput.focus();
  });

  show('setup');
})();
