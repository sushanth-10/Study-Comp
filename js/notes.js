(function () {
  const dropZone = document.getElementById('notes-drop-zone');
  const grid = document.getElementById('notes-grid');
  const searchInput = document.getElementById('notes-search');
  const fileInput = document.getElementById('notes-file-input');
  const addBtn = document.getElementById('notes-add-btn');
  const emptyEl = document.getElementById('notes-empty');
  const countEl = document.getElementById('notes-count');
  const uploadStatus = document.getElementById('notes-upload-status');
  const viewer = document.getElementById('notes-viewer');
  const viewerFrame = document.getElementById('notes-viewer-frame');
  const viewerTitle = document.getElementById('notes-viewer-title');
  const viewerClose = document.getElementById('notes-viewer-close');
  const RECENT_KEY = 'scholarly_recent_opened_notes';

  if (!dropZone || !grid) return;

  let searchTimer = null;

  function escapeHtml(text) {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  }

  function rememberOpenedNote(pdf) {
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (e) {}
    recent = recent.filter(function (item) {
      return item.id !== pdf.id;
    });
    recent.unshift({
      id: pdf.id,
      name: pdf.name,
      filename: pdf.filename,
      uploaded_at: pdf.uploaded_at,
      opened_at: new Date().toISOString(),
      size_label: pdf.size_label || '',
    });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 12)));
  }

  function setStatus(msg, isError) {
    if (!uploadStatus) return;
    uploadStatus.textContent = msg || '';
    uploadStatus.className =
      'text-body-sm mt-unit-2 ' + (isError ? 'text-error' : 'text-secondary');
    uploadStatus.classList.toggle('hidden', !msg);
  }

  function setUploading(active) {
    dropZone.classList.toggle('notes-drop-active', active);
    dropZone.classList.toggle('opacity-70', active);
    if (addBtn) addBtn.disabled = active;
  }

  async function fetchList() {
    const q = searchInput ? searchInput.value.trim() : '';
    const url = '/api/notes/list' + (q ? '?q=' + encodeURIComponent(q) : '');
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load PDFs');
    render(data.pdfs || []);
  }

  function render(pdfs) {
    grid.innerHTML = '';
    if (countEl) countEl.textContent = pdfs.length + ' PDF' + (pdfs.length === 1 ? '' : 's');

    if (!pdfs.length) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    pdfs.forEach(function (pdf) {
      const card = document.createElement('article');
      card.className =
        'bg-surface-container-lowest p-unit-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-secondary transition-all';
      card.innerHTML =
        '<div class="flex justify-between items-start mb-unit-3">' +
        '<div class="flex items-center gap-unit-3 min-w-0">' +
        '<span class="material-symbols-outlined text-primary text-[32px] flex-shrink-0" style="font-variation-settings:\'FILL\' 1">picture_as_pdf</span>' +
        '<h3 class="text-headline-sm font-headline-sm text-primary truncate">' +
        escapeHtml(pdf.name) +
        '</h3></div>' +
        '<button type="button" class="notes-delete p-1 rounded-lg text-outline-variant hover:text-error hover:bg-error-container transition-colors" title="Delete">' +
        '<span class="material-symbols-outlined text-[20px]">delete</span></button></div>' +
        '<p class="text-body-sm text-on-surface-variant mb-unit-4 truncate">' +
        escapeHtml(pdf.filename) +
        '</p>' +
        '<div class="flex items-center justify-between pt-unit-4 border-t border-surface-container">' +
        '<span class="text-label-sm font-label-sm text-outline">' +
        formatDate(pdf.uploaded_at) +
        ' · ' +
        escapeHtml(pdf.size_label || '') +
        '</span>' +
        '<div class="flex gap-unit-3">' +
        '<a href="/api/notes/pdf/' +
        encodeURIComponent(pdf.id) +
        '" target="_blank" rel="noopener" class="notes-open-link text-label-sm font-label-md text-secondary hover:underline">Open</a>' +
        '<button type="button" class="notes-open text-label-sm font-label-md text-primary hover:underline">View</button>' +
        '</div></div>';

      card.querySelector('.notes-delete').dataset.id = pdf.id;
      card.querySelector('.notes-open').dataset.id = pdf.id;
      card.querySelector('.notes-open').dataset.name = pdf.name;

      card.querySelector('.notes-open').addEventListener('click', function () {
        rememberOpenedNote(pdf);
        openViewer(pdf.id, pdf.name);
      });
      card.querySelector('.notes-open-link').addEventListener('click', function () {
        rememberOpenedNote(pdf);
      });
      card.querySelector('.notes-delete').addEventListener('click', function () {
        removePdf(pdf.id, pdf.name);
      });
      grid.appendChild(card);
    });
  }

  function openViewer(id, name) {
    viewerTitle.textContent = name;
    viewerFrame.src = '/api/notes/pdf/' + encodeURIComponent(id);
    viewer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    viewer.classList.add('hidden');
    viewerFrame.src = '';
    document.body.style.overflow = '';
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []).filter(function (f) {
      return f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    });
    if (!files.length) {
      setStatus('Please drop PDF files only.', true);
      return;
    }

    setUploading(true);
    let ok = 0;
    for (const file of files) {
      setStatus('Uploading ' + file.name + '…', false);
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/notes/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        ok += 1;
      } catch (err) {
        setStatus(err.message, true);
        setUploading(false);
        await fetchList();
        return;
      }
    }
    setStatus(ok === 1 ? '1 PDF saved.' : ok + ' PDFs saved.', false);
    setUploading(false);
    await fetchList();
    setTimeout(function () {
      setStatus('');
    }, 3000);
  }

  async function removePdf(id, name) {
    if (!confirm('Delete "' + name + '"?')) return;
    try {
      const res = await fetch('/api/notes/' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await fetchList();
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('notes-drop-hover');
  });
  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('notes-drop-hover');
  });
  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('notes-drop-hover');
    uploadFiles(e.dataTransfer.files);
  });

  dropZone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      uploadFiles(fileInput.files);
      fileInput.value = '';
    });
  }
  if (addBtn && fileInput) {
    addBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.click();
    });
  }

  dropZone.addEventListener('click', function () {
    if (fileInput) fileInput.click();
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(fetchList, 250);
    });
  }

  if (viewerClose) viewerClose.addEventListener('click', closeViewer);
  if (viewer) {
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer) closeViewer();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeViewer();
  });

  fetchList().catch(function (err) {
    setStatus(err.message, true);
  });
})();
