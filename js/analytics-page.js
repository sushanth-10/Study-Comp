(function () {
  const state = { range: 'weekly' };
  const rangeButtons = document.querySelectorAll('.analytics-range-btn');
  const els = {
    greeting: document.getElementById('analytics-greeting'),
    subtitle: document.getElementById('analytics-subtitle'),
    statusPill: document.getElementById('analytics-status-pill'),
    accuracy: document.getElementById('metric-accuracy'),
    accuracyNote: document.getElementById('metric-accuracy-note'),
    mastery: document.getElementById('metric-mastery'),
    masteryNote: document.getElementById('metric-mastery-note'),
    focus: document.getElementById('metric-focus'),
    focusNote: document.getElementById('metric-focus-note'),
    burnout: document.getElementById('metric-burnout'),
    burnoutNote: document.getElementById('metric-burnout-note'),
    performanceChart: document.getElementById('performance-chart'),
    performancePrediction: document.getElementById('performance-prediction'),
    responseSpeed: document.getElementById('response-speed'),
    responseSpeedBar: document.getElementById('response-speed-bar'),
    deepThinkingRate: document.getElementById('deep-thinking-rate'),
    deepThinkingBar: document.getElementById('deep-thinking-bar'),
    fastGuessRate: document.getElementById('fast-guess-rate'),
    fastGuessBar: document.getElementById('fast-guess-bar'),
    masteryHeatmap: document.getElementById('mastery-heatmap'),
    masterySummary: document.getElementById('mastery-summary'),
    fatigueBadge: document.getElementById('fatigue-level-badge'),
    fatigueChart: document.getElementById('fatigue-chart'),
    recommendedAction: document.getElementById('recommended-action'),
    frustrationIndex: document.getElementById('frustration-index'),
    insights: document.getElementById('analytics-insights'),
    recommendations: document.getElementById('analytics-recommendations'),
    velocity: document.getElementById('velocity-score'),
    consistency: document.getElementById('consistency-score'),
    engagement: document.getElementById('engagement-score')
  };

  if (!els.greeting) return;

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.detail || 'Request failed');
        return data;
      });
    });
  }

  function setRange(range) {
    state.range = range;
    rangeButtons.forEach(function (btn) {
      const active = btn.getAttribute('data-range') === range;
      btn.classList.toggle('bg-primary', active);
      btn.classList.toggle('text-on-primary', active);
      btn.classList.toggle('text-on-surface-variant', !active);
    });
    load();
  }

  function pct(value) {
    return Math.max(0, Math.min(100, Number(value || 0)));
  }

  let performanceChartInstance = null;
  let fatigueChartInstance = null;

  function renderChart(container, dataItems, color, labelName) {
    if (!dataItems || !dataItems.length) {
      container.innerHTML = '<div class="h-full flex items-center justify-center text-on-surface-variant text-body-sm">No chart data yet.</div>';
      return null;
    }
    container.innerHTML = '<canvas class="w-full h-full"></canvas>';
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    const labels = dataItems.map(function(item) { return item.label; });
    const data = dataItems.map(function(item) { return Number(item.value || 0); });

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: labelName,
          data: data,
          borderColor: color,
          backgroundColor: color + '33',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: color
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#e0e3e5' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function gradientForScore(score) {
    if (score >= 85) return 'linear-gradient(135deg, #476550 0%, #c6e8cd 100%)';
    if (score >= 70) return 'linear-gradient(135deg, #1b2b48 0%, #d7e2ff 100%)';
    return 'linear-gradient(135deg, #ba1a1a 0%, #ffdad6 100%)';
  }

  function renderHeatmap(items) {
    if (!items || !items.length) {
      els.masteryHeatmap.innerHTML = '<p class="text-body-sm text-on-surface-variant">No mastery data yet.</p>';
      return;
    }
    els.masteryHeatmap.innerHTML = items.map(function (item) {
      return '<div class="rounded-xl p-unit-4 text-white shadow-sm" style="background:' + gradientForScore(item.value || item.mastery) + '">' +
        '<p class="text-label-sm opacity-80">' + (item.topic || item.label) + '</p>' +
        '<h4 class="text-headline-sm font-headline-sm mt-unit-2">' + pct(item.value || item.mastery) + '%</h4>' +
        '<p class="text-body-sm opacity-90 mt-unit-2">Confidence ' + pct(item.confidence || 0) + '%</p>' +
      '</div>';
    }).join('');
  }

  function renderInsights(items) {
    els.insights.innerHTML = (items || []).map(function (item) {
      const tone = item.severity === 'warning'
        ? 'bg-error-container text-on-error-container'
        : item.severity === 'success'
        ? 'bg-secondary-container text-on-secondary-container'
        : 'bg-surface-container text-on-surface';
      return '<article class="rounded-xl p-unit-4 ' + tone + '">' +
        '<div class="flex items-start justify-between gap-unit-3">' +
        '<div><h4 class="text-label-md">' + item.title + '</h4><p class="text-body-sm mt-unit-2">' + item.message + '</p></div>' +
        '<span class="text-label-sm opacity-80">' + item.metric + '</span>' +
        '</div></article>';
    }).join('');
  }

  function renderRecommendations(items) {
    els.recommendations.innerHTML = (items || []).map(function (item) {
      return '<article class="bg-surface-container rounded-xl p-unit-4">' +
        '<div class="flex items-center justify-between gap-unit-3">' +
        '<h4 class="text-label-md text-primary">' + item.recommendedTopic + '</h4>' +
        '<span class="text-label-sm text-secondary">+' + item.recommendedSessionLength + 'm</span>' +
        '</div>' +
        '<p class="text-body-sm text-on-surface-variant mt-unit-2">' + item.reason + '</p>' +
      '</article>';
    }).join('');
  }

  function fatigueTone(level) {
    if (level === 'high') return ['bg-error-container', 'text-on-error-container'];
    if (level === 'medium') return ['bg-secondary-container', 'text-on-secondary-container'];
    return ['bg-primary-fixed', 'text-primary'];
  }

  function load() {
    const query = '?range=' + encodeURIComponent(state.range);
    Promise.all([
      fetchJson('/api/session'),
      fetchJson('/api/analytics/overview' + query),
      fetchJson('/api/analytics/performance' + query),
      fetchJson('/api/analytics/focus' + query),
      fetchJson('/api/analytics/mastery' + query),
      fetchJson('/api/analytics/fatigue' + query),
      fetchJson('/api/analytics/streaks'),
      fetchJson('/api/analytics/recommendations' + query),
      fetchJson('/api/dashboard/insights')
    ]).then(function (results) {
      const session = results[0];
      const overview = results[1];
      const performance = results[2];
      const focus = results[3];
      const mastery = results[4];
      const fatigue = results[5];
      const streaks = results[6];
      const recommendations = results[7];
      const insights = results[8];

      const firstName = (session.user.name || 'Scholar').split(' ')[0];
      els.greeting.textContent = firstName + ', here is your ' + state.range + ' learning intelligence.';
      els.subtitle.textContent = 'Accuracy ' + overview.accuracy + '%, mastery ' + overview.masteryScore + '%, focus quality ' + overview.focusQuality + ', burnout risk ' + fatigue.burnoutRisk + '%.';

      els.accuracy.textContent = overview.accuracy + '%';
      els.accuracyNote.textContent = 'Weekly improvement ' + (overview.weeklyImprovement >= 0 ? '+' : '') + overview.weeklyImprovement + ' points';
      els.mastery.textContent = overview.masteryScore + '%';
      els.masteryNote.textContent = 'Completion rate ' + performance.completionRate + '%';
      els.focus.textContent = overview.focusQuality;
      els.focusNote.textContent = focus.distractedSessions + ' distracted sessions detected';
      els.burnout.textContent = fatigue.burnoutRisk + '%';
      els.burnoutNote.textContent = 'Recommended action: ' + fatigue.recommendedAction.replace(/_/g, ' ');

      if (performanceChartInstance) performanceChartInstance.destroy();
      performanceChartInstance = renderChart(els.performanceChart, performance.charts.accuracyLine || overview.charts.line, '#041632', 'Accuracy');
      els.performancePrediction.textContent =
        (performance.predictive.bestStudyTiming || 'best timing') + ' · readiness ' + (performance.predictive.examReadiness || 0) + '%';

      els.responseSpeed.textContent = performance.responseSpeed + 's';
      els.responseSpeedBar.style.width = pct(100 - performance.responseSpeed * 3) + '%';
      els.deepThinkingRate.textContent = pct((performance.hesitationPatterns.deepThinkingRate || 0) * 100) + '%';
      els.deepThinkingBar.style.width = pct((performance.hesitationPatterns.deepThinkingRate || 0) * 100) + '%';
      els.fastGuessRate.textContent = pct((performance.hesitationPatterns.fastGuessRate || 0) * 100) + '%';
      els.fastGuessBar.style.width = pct((performance.hesitationPatterns.fastGuessRate || 0) * 100) + '%';

      renderHeatmap(mastery.charts.heatmap || []);
      els.masterySummary.textContent = (mastery.weakTopics || []).length + ' weak topics need revision';

      if (fatigueChartInstance) fatigueChartInstance.destroy();
      fatigueChartInstance = renderChart(els.fatigueChart, fatigue.charts.fatigueTrend || [], '#ba1a1a', 'Fatigue');
      const tones = fatigueTone(fatigue.fatigueLevel);
      els.fatigueBadge.className = 'px-unit-3 py-unit-1 rounded-full text-label-sm ' + tones[0] + ' ' + tones[1];
      els.fatigueBadge.textContent = fatigue.fatigueLevel.toUpperCase();
      els.recommendedAction.textContent = fatigue.recommendedAction.replace(/_/g, ' ');
      els.frustrationIndex.textContent = fatigue.frustrationIndex;

      renderInsights(insights.items || []);
      renderRecommendations(recommendations.items || []);

      els.velocity.textContent = overview.learningVelocity;
      els.consistency.textContent = streaks.consistencyScore + '%';
      els.engagement.textContent = streaks.engagementPrediction + '%';

      els.statusPill.innerHTML =
        '<span class="material-symbols-outlined text-[18px]">insights</span>' +
        '<span>Predicted weak topics: ' + ((performance.predictive.weakFutureTopics || []).slice(0, 2).join(', ') || 'stable') + '</span>';
    }).catch(function (error) {
      els.subtitle.textContent = error.message || 'Could not load analytics data.';
    });
  }

  rangeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setRange(btn.getAttribute('data-range'));
    });
  });

  load();
})();
