(function () {
  const chatEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const quickActions = document.querySelectorAll('[data-ai-prompt]');

  if (!chatEl || !inputEl || !sendBtn) return;

  let busy = false;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  }

  function formatReply(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p class="font-body-md text-body-md text-on-surface mt-unit-3">')
      .replace(/\n/g, '<br/>');
  }

  function scrollToBottom() {
    const scroll = document.querySelector('.ai-chat-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  function bubble(isUser) {
    const wrap = document.createElement('div');
    wrap.className =
      'flex flex-col ' +
      (isUser ? 'items-end max-w-[85%] self-end' : 'items-start max-w-[85%]');

    const head = document.createElement('div');
    head.className = 'flex items-center gap-unit-2 mb-unit-1';
    if (isUser) {
      head.innerHTML =
        '<span class="font-label-md text-label-md text-on-surface-variant">You</span>';
    } else {
      head.innerHTML =
        '<span class="material-symbols-outlined text-primary text-body-sm">auto_awesome</span>' +
        '<span class="font-label-md text-label-md text-primary">Scholar AI</span>';
    }

    const body = document.createElement('div');
    body.className = isUser
      ? 'bg-primary text-on-primary p-unit-4 rounded-xl rounded-tr-none shadow-lg ai-msg-body'
      : 'bg-surface-container-lowest p-unit-4 rounded-xl rounded-tl-none shadow-[12px_12px_24px_rgba(4,22,50,0.04)] border border-secondary-container/30 ai-msg-body';

    wrap.appendChild(head);
    wrap.appendChild(body);
    return { wrap, body };
  }

  function appendUserMessage(text) {
    const { wrap, body } = bubble(true);
    body.innerHTML =
      '<p class="font-body-md text-body-md">' + escapeHtml(text) + '</p>';
    chatEl.appendChild(wrap);
    scrollToBottom();
  }

  function appendLoading() {
    const { wrap, body } = bubble(false);
    body.innerHTML =
      '<div class="flex items-center gap-unit-2 text-secondary ai-loading">' +
      '<span class="material-symbols-outlined animate-pulse">psychology</span>' +
      '<span class="font-label-md text-label-md">Thinking…</span></div>';
    wrap.dataset.loading = 'true';
    chatEl.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function renderAiContent(body, data) {
    let html = '';

    if (data.status) {
      html +=
        '<div class="flex items-center gap-unit-2 mb-unit-3 text-secondary">' +
        '<span class="material-symbols-outlined">psychology</span>' +
        '<span class="font-label-md text-label-md">' +
        escapeHtml(data.status) +
        '</span></div>';
    }

    html +=
      '<p class="font-body-md text-body-md text-on-surface">' +
      formatReply(data.reply || '') +
      '</p>';

    if (data.tags && data.tags.length) {
      html += '<div class="mt-unit-4 flex flex-wrap gap-unit-2">';
      data.tags.forEach(function (tag) {
        html +=
          '<span class="bg-secondary-container text-on-secondary-container px-unit-3 py-unit-1 rounded-full text-label-sm font-label-sm">' +
          escapeHtml(tag) +
          '</span>';
      });
      html += '</div>';
    }

    if (data.youtube && data.youtube.length) {
      html +=
        '<div class="mt-unit-4 pt-unit-3 border-t border-outline-variant/40">' +
        '<p class="font-label-md text-label-md text-primary mb-unit-2 flex items-center gap-unit-1">' +
        '<span class="material-symbols-outlined text-body-sm">play_circle</span>YouTube picks</p>' +
        '<div class="flex flex-col gap-unit-2">';
      data.youtube.forEach(function (v) {
        const meta = [v.publisher, v.duration].filter(Boolean).join(' · ');
        html +=
          '<a href="' +
          escapeHtml(v.url) +
          '" target="_blank" rel="noopener noreferrer" ' +
          'class="flex gap-unit-3 p-unit-2 rounded-lg hover:bg-surface-container transition-colors no-underline group">' +
          (v.thumbnail
            ? '<img src="' +
              escapeHtml(v.thumbnail) +
              '" alt="" class="w-24 h-14 object-cover rounded-md flex-shrink-0 bg-surface-container"/>'
            : '<span class="w-24 h-14 flex items-center justify-center rounded-md bg-surface-container text-primary flex-shrink-0">' +
              '<span class="material-symbols-outlined">play_circle</span></span>') +
          '<span class="min-w-0"><span class="font-body-sm text-body-sm text-on-surface group-hover:text-primary line-clamp-2">' +
          escapeHtml(v.title) +
          '</span>' +
          (meta
            ? '<span class="block text-label-sm text-on-surface-variant mt-unit-1">' +
              escapeHtml(meta) +
              '</span>'
            : '') +
          '</span></a>';
      });
      html += '</div></div>';
    }

    if (data.search_results && data.search_results.length) {
      html +=
        '<div class="mt-unit-4 pt-unit-3 border-t border-outline-variant/40">' +
        '<p class="font-label-md text-label-md text-primary mb-unit-2 flex items-center gap-unit-1">' +
        '<span class="material-symbols-outlined text-body-sm">travel_explore</span>Web results</p>' +
        '<ul class="flex flex-col gap-unit-2 list-none m-0 p-0">';
      data.search_results.forEach(function (r) {
        html +=
          '<li><a href="' +
          escapeHtml(r.url) +
          '" target="_blank" rel="noopener noreferrer" ' +
          'class="block p-unit-2 rounded-lg hover:bg-surface-container transition-colors no-underline">' +
          '<span class="font-body-sm text-body-sm text-primary">' +
          escapeHtml(r.title) +
          '</span>' +
          (r.snippet
            ? '<span class="block text-label-sm text-on-surface-variant mt-unit-1 line-clamp-2">' +
              escapeHtml(r.snippet) +
              '</span>'
            : '') +
          '</a></li>';
      });
      html += '</ul></div>';
    }

    body.innerHTML = html;
  }

  function removeLoading() {
    const el = chatEl.querySelector('[data-loading="true"]');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    const msg = (text || inputEl.value).trim();
    if (!msg || busy) return;

    busy = true;
    inputEl.value = '';
    sendBtn.disabled = true;
    appendUserMessage(msg);
    appendLoading();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      removeLoading();
      const { wrap, body } = bubble(false);
      renderAiContent(body, data);
      chatEl.appendChild(wrap);
    } catch (err) {
      removeLoading();
      const { wrap, body } = bubble(false);
      body.innerHTML =
        '<p class="font-body-md text-body-md text-error">' +
        escapeHtml(
          err.message ||
            'Something went wrong. Make sure the server is running (python app.py).'
        ) +
        '</p>';
      chatEl.appendChild(wrap);
    } finally {
      busy = false;
      sendBtn.disabled = false;
      inputEl.focus();
      scrollToBottom();
    }
  }

  sendBtn.addEventListener('click', function () {
    sendMessage();
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  quickActions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const prompt = btn.getAttribute('data-ai-prompt');
      if (prompt) sendMessage(prompt);
    });
  });
})();
