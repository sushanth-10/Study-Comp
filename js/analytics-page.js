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

  let performanceChartInstance = null;
  let fatigueChartInstance = null;

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.detail || 'Request failed');
        return data;
      });
    });
  }

  function pct(value) {
    return Math.max(0, Math.min(100, Number(value || 0)));
  }

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text || '';
    return el.innerHTML;
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

  function chartBars(container, dataItems, color) {
    container.innerHTML = '<div class="h-full flex items-end gap-unit-2 px-unit-2">' + dataItems.map(function (item) {
      const height = Math.max(12, pct(item.value));
      return '<div class="flex-1 h-full flex flex-col items-center justify-end gap-unit-2">' +
        '<div class="w-full rounded-t-lg" style="height:' + height + '%;background:' + color + '"></div>' +
        '<span class="text-label-sm text-on-surface-variant">' + escapeHtml(item.label) + '</span>' +
      '</div>';
    }).join('') + '</div>';
    return null;
  }

  function renderChart(container, dataItems, color, labelName) {
    if (!dataItems || !dataItems.length) {
      container.innerHTML = '<div class="h-full flex items-center justify-center text-on-surface-variant text-body-sm">No chart data yet.</div>';
      return null;
    }
    if (typeof Chart === 'undefined') return chartBars(container, dataItems, color);

    container.innerHTML = '<canvas class="w-full h-full"></canvas>';
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const labels = dataItems.map(function (item) { return item.label; });
    const data = dataItems.map(function (item) { return Number(item.value || 0); });

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
        plugins: { legend: { display: false } },
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
        '<p class="text-label-sm opacity-80">' + escapeHtml(item.topic || item.label) + '</p>' +
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
        '<div><h4 class="text-label-md">' + escapeHtml(item.title) + '</h4><p class="text-body-sm mt-unit-2">' + escapeHtml(item.message) + '</p></div>' +
        '<span class="text-label-sm opacity-80">' + escapeHtml(item.metric) + '</span>' +
        '</div></article>';
    }).join('');
  }

  function renderRecommendations(items) {
    els.recommendations.innerHTML = (items || []).map(function (item) {
      return '<article class="bg-surface-container rounded-xl p-unit-4">' +
        '<div class="flex items-center justify-between gap-unit-3">' +
        '<h4 class="text-label-md text-primary">' + escapeHtml(item.recommendedTopic) + '</h4>' +
        '<span class="text-label-sm text-secondary">+' + Number(item.recommendedSessionLength || 0) + 'm</span>' +
        '</div>' +
        '<p class="text-body-sm text-on-surface-variant mt-unit-2">' + escapeHtml(item.reason) + '</p>' +
      '</article>';
    }).join('');
  }

  function fatigueTone(level) {
    if (level === 'high') return ['bg-error-container', 'text-on-error-container'];
    if (level === 'medium') return ['bg-secondary-container', 'text-on-secondary-container'];
    return ['bg-primary-fixed', 'text-primary'];
  }

  function demoDataset() {
    const linesByRange = {
      daily: [
        { label: '8 AM', value: 62 },
        { label: '11 AM', value: 74 },
        { label: '2 PM', value: 69 },
        { label: '5 PM', value: 82 },
        { label: '8 PM', value: 88 }
      ],
      weekly: [
        { label: 'Mon', value: 68 },
        { label: 'Tue', value: 73 },
        { label: 'Wed', value: 79 },
        { label: 'Thu', value: 76 },
        { label: 'Fri', value: 84 },
        { label: 'Sat', value: 89 },
        { label: 'Sun', value: 91 }
      ],
      monthly: [
        { label: 'W1', value: 64 },
        { label: 'W2', value: 72 },
        { label: 'W3', value: 81 },
        { label: 'W4', value: 88 }
      ],
      yearly: [
        { label: 'Jan', value: 58 },
        { label: 'Mar', value: 66 },
        { label: 'May', value: 79 },
        { label: 'Jul', value: 83 },
        { label: 'Sep', value: 87 },
        { label: 'Nov', value: 92 }
      ]
    };
    const line = linesByRange[state.range] || linesByRange.weekly;
    return [
      { user: { name: 'Scholar' } },
      {
        accuracy: 87,
        masteryScore: 82,
        focusQuality: 88,
        weeklyImprovement: 9,
        learningVelocity: 76,
        charts: { line: line }
      },
      {
        completionRate: 91,
        responseSpeed: 14.2,
        charts: { accuracyLine: line },
        hesitationPatterns: { deepThinkingRate: 0.64, fastGuessRate: 0.12 },
        predictive: {
          bestStudyTiming: 'Evening focus window',
          examReadiness: 86,
          weakFutureTopics: ['Organic mechanisms', 'Integration rules']
        }
      },
      { distractedSessions: 2 },
      {
        weakTopics: ['Organic mechanisms', 'Integration rules'],
        charts: {
          heatmap: [
            { topic: 'Calculus', value: 88, confidence: 84 },
            { topic: 'Physics', value: 79, confidence: 73 },
            { topic: 'Chemistry', value: 66, confidence: 62 },
            { topic: 'Biology', value: 91, confidence: 89 },
            { topic: 'Economics', value: 74, confidence: 70 },
            { topic: 'English', value: 86, confidence: 81 }
          ]
        }
      },
      {
        burnoutRisk: 22,
        recommendedAction: 'take_short_breaks',
        fatigueLevel: 'low',
        frustrationIndex: 18,
        charts: {
          fatigueTrend: [
            { label: 'Mon', value: 35 },
            { label: 'Tue', value: 31 },
            { label: 'Wed', value: 28 },
            { label: 'Thu', value: 26 },
            { label: 'Fri', value: 24 },
            { label: 'Sat', value: 21 },
            { label: 'Sun', value: 22 }
          ]
        }
      },
      { consistencyScore: 92, engagementPrediction: 89 },
      {
        items: [
          {
            recommendedTopic: 'Organic mechanisms',
            recommendedSessionLength: 35,
            reason: 'Accuracy is improving, but confidence is still softer here.'
          },
          {
            recommendedTopic: 'Integration practice',
            recommendedSessionLength: 25,
            reason: 'Short timed drills will strengthen recall speed.'
          },
          {
            recommendedTopic: 'Physics formulas',
            recommendedSessionLength: 20,
            reason: 'A quick spaced review keeps this topic stable.'
          }
        ]
      },
      {
        items: [
          {
            severity: 'success',
            title: 'Focus quality is strong',
            message: 'Your best sessions are landing after a short planning step, with fewer interruptions.',
            metric: '88/100'
          },
          {
            severity: 'warning',
            title: 'Chemistry needs a lighter review loop',
            message: 'Practice smaller batches before long problem sets to reduce fatigue.',
            metric: '66%'
          },
          {
            severity: 'info',
            title: 'Momentum is building',
            message: 'Your consistency trend suggests this week can end above target.',
            metric: '+9 pts'
          }
        ]
      }
    ];
  }

  function localAnalyticsDataset() {
    let usage = {};
    try {
      usage = JSON.parse(localStorage.getItem('scholarly_usage_analytics') || '{}') || {};
    } catch (error) {
      return null;
    }
    const days = usage.days || {};
    const dayKeys = Object.keys(days).sort().slice(-7);
    const quizzes = Array.isArray(usage.quizzes) ? usage.quizzes.slice(-12) : [];
    if (!dayKeys.length && !quizzes.length) return null;

    const totalSeconds = dayKeys.reduce(function (sum, key) {
      return sum + Number(days[key].seconds || 0);
    }, 0);
    const avgQuiz = quizzes.length
      ? Math.round(quizzes.reduce(function (sum, q) { return sum + Number(q.percent || 0); }, 0) / quizzes.length)
      : 76;
    const completion = quizzes.length
      ? Math.round(quizzes.reduce(function (sum, q) { return sum + ((Number(q.total || 0) - Number(q.skipped || 0)) / Math.max(1, Number(q.total || 1))) * 100; }, 0) / quizzes.length)
      : 80;
    const focusQuality = Math.max(55, Math.min(95, Math.round(68 + Math.min(22, totalSeconds / 900))));
    const line = dayKeys.length ? dayKeys.map(function (key) {
      return { label: key.slice(5), value: Math.min(100, Math.round(Number(days[key].seconds || 0) / 60)) };
    }) : [{ label: 'Today', value: Math.round(totalSeconds / 60) }];
    const quizTopics = quizzes.reduce(function (acc, q) {
      const topic = q.topic || 'Quiz';
      acc[topic] = acc[topic] || { total: 0, count: 0 };
      acc[topic].total += Number(q.percent || 0);
      acc[topic].count += 1;
      return acc;
    }, {});
    const heatmap = Object.keys(quizTopics).slice(-6).map(function (topic) {
      const value = Math.round(quizTopics[topic].total / quizTopics[topic].count);
      return { topic: topic, value: value, confidence: Math.max(45, value - 5) };
    });
    while (heatmap.length < 6) {
      heatmap.push([
        { topic: 'Focus time', value: focusQuality, confidence: 78 },
        { topic: 'Study rhythm', value: Math.min(92, completion), confidence: 74 },
        { topic: 'Review habit', value: Math.min(88, avgQuiz), confidence: 70 },
        { topic: 'Quiz accuracy', value: avgQuiz, confidence: 76 },
        { topic: 'Consistency', value: Math.min(95, dayKeys.length * 12), confidence: 72 },
        { topic: 'Planning', value: 81, confidence: 68 },
      ][heatmap.length]);
    }

    return [
      { user: { name: 'Scholar' } },
      {
        accuracy: avgQuiz,
        masteryScore: Math.round((avgQuiz + completion) / 2),
        focusQuality: focusQuality,
        weeklyImprovement: Math.max(1, quizzes.length),
        learningVelocity: Math.min(95, Math.round(totalSeconds / 120) + 60),
        charts: { line: line },
      },
      {
        completionRate: completion,
        responseSpeed: quizzes.length ? 14.5 : 18,
        charts: { accuracyLine: quizzes.length ? quizzes.map(function (q, index) { return { label: 'Q' + (index + 1), value: q.percent }; }) : line },
        hesitationPatterns: { deepThinkingRate: Math.min(0.85, 0.45 + totalSeconds / 20000), fastGuessRate: Math.max(0.08, 0.25 - totalSeconds / 50000) },
        predictive: {
          bestStudyTiming: 'Based on your active website time',
          examReadiness: Math.round((avgQuiz + completion + focusQuality) / 3),
          weakFutureTopics: heatmap.filter(function (h) { return h.value < 75; }).map(function (h) { return h.topic; }),
        },
      },
      { distractedSessions: Math.max(0, 4 - dayKeys.length) },
      { weakTopics: heatmap.filter(function (h) { return h.value < 75; }).map(function (h) { return h.topic; }), charts: { heatmap: heatmap } },
      {
        burnoutRisk: Math.min(55, Math.round(totalSeconds / 1200) + 12),
        recommendedAction: totalSeconds > 7200 ? 'take_long_break' : 'take_short_breaks',
        fatigueLevel: totalSeconds > 7200 ? 'medium' : 'low',
        frustrationIndex: Math.max(8, 30 - Math.round(avgQuiz / 5)),
        charts: { fatigueTrend: line.map(function (item) { return { label: item.label, value: Math.min(55, Math.round(item.value / 2) + 12) }; }) },
      },
      { consistencyScore: Math.min(100, dayKeys.length * 14), engagementPrediction: Math.min(96, focusQuality + 4) },
      { items: heatmap.filter(function (h) { return h.value < 80; }).slice(0, 3).map(function (h) {
        return { recommendedTopic: h.topic, recommendedSessionLength: 25, reason: 'Your recent quiz/time data shows this area can improve.' };
      }) },
      { items: [
        { severity: 'success', title: 'Website time is being tracked', message: 'Analytics now updates from time spent inside the app.', metric: Math.round(totalSeconds / 60) + ' min' },
        { severity: avgQuiz >= 75 ? 'success' : 'warning', title: 'Quiz performance', message: 'Recent quiz results are reflected in mastery and accuracy.', metric: avgQuiz + '%' },
        { severity: 'info', title: 'Consistency signal', message: 'Streak and engagement improve as you use the app across more days.', metric: dayKeys.length + ' days' },
      ] },
    ];
  }

  function isEmptyAnalytics(results) {
    const overview = results[1] || {};
    const performance = results[2] || {};
    const mastery = results[4] || {};
    return !Number(overview.accuracy) &&
      !Number(overview.masteryScore) &&
      !Number(overview.focusQuality) &&
      !Number(performance.completionRate) &&
      !(mastery.charts && mastery.charts.heatmap && mastery.charts.heatmap.length);
  }

  function shouldUseDemoAnalytics(results) {
    const mastery = results[4] || {};
    const recommendations = results[7] || {};
    const insights = results[8] || {};
    const heatmapCount = mastery.charts && mastery.charts.heatmap ? mastery.charts.heatmap.length : 0;
    const recommendationCount = recommendations.items ? recommendations.items.length : 0;
    const insightCount = insights.items ? insights.items.length : 0;
    return isEmptyAnalytics(results) || heatmapCount < 6 || recommendationCount < 3 || insightCount < 3;
  }

  function renderAnalytics(results, isDemo) {
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
    els.subtitle.textContent = (isDemo ? 'Sample analytics loaded: ' : '') +
      'Accuracy ' + overview.accuracy + '%, mastery ' + overview.masteryScore + '%, focus quality ' + overview.focusQuality + ', burnout risk ' + fatigue.burnoutRisk + '%.';
    els.accuracy.textContent = overview.accuracy + '%';
    els.accuracyNote.textContent = 'Improvement ' + (overview.weeklyImprovement >= 0 ? '+' : '') + overview.weeklyImprovement + ' points';
    els.mastery.textContent = overview.masteryScore + '%';
    els.masteryNote.textContent = 'Completion rate ' + performance.completionRate + '%';
    els.focus.textContent = overview.focusQuality;
    els.focusNote.textContent = focus.distractedSessions + ' distracted sessions detected';
    els.burnout.textContent = fatigue.burnoutRisk + '%';
    els.burnoutNote.textContent = 'Recommended action: ' + fatigue.recommendedAction.replace(/_/g, ' ');

    if (performanceChartInstance) performanceChartInstance.destroy();
    performanceChartInstance = renderChart(els.performanceChart, performance.charts.accuracyLine || overview.charts.line, '#041632', 'Accuracy');
    els.performancePrediction.textContent =
      (performance.predictive.bestStudyTiming || 'best timing') + ' - readiness ' + (performance.predictive.examReadiness || 0) + '%';

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
      '<span class="material-symbols-outlined text-[18px]">' + (isDemo ? 'science' : 'insights') + '</span>' +
      '<span>' + (isDemo ? 'Sample data preview' : 'Predicted weak topics: ' + ((performance.predictive.weakFutureTopics || []).slice(0, 2).join(', ') || 'stable')) + '</span>';
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
      const local = localAnalyticsDataset();
      const useDemo = !local && shouldUseDemoAnalytics(results);
      renderAnalytics(local || (useDemo ? demoDataset() : results), useDemo);
    }).catch(function () {
      renderAnalytics(localAnalyticsDataset() || demoDataset(), !localAnalyticsDataset());
    });
  }

  rangeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setRange(btn.getAttribute('data-range'));
    });
  });

  load();
})();
