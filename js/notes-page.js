(function () {
  const searchInput = document.getElementById('notes-search');
  const filtersEl = document.getElementById('notes-filters');
  const gridEl = document.getElementById('notes-grid');

  if (!gridEl) return;

  function card(note) {
    return (
      '<div class="bg-surface-container-lowest p-unit-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:border-secondary transition-all cursor-pointer">' +
      '<div class="flex justify-between items-start mb-unit-2">' +
      '<h3 class="text-headline-sm font-headline-sm text-primary">' + note.title + '</h3>' +
      '<span class="material-symbols-outlined text-outline-variant">more_vert</span></div>' +
      '<p class="text-body-sm text-on-surface-variant mb-unit-4 line-clamp-3">' + note.preview + '</p>' +
      '<div class="flex items-center justify-between mt-auto pt-unit-4 border-t border-surface-container">' +
      '<span class="text-label-sm font-label-sm text-outline">' + note.date + '</span>' +
      '<span class="bg-secondary-container text-on-secondary-container px-unit-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">' + note.subject + '</span></div></div>'
    );
  }

  function renderFilters(categories) {
    if (!filtersEl) return;
    filtersEl.innerHTML =
      '<span class="bg-primary text-on-primary px-unit-4 py-unit-1 rounded-full text-label-sm font-label-sm whitespace-nowrap">All Notes</span>' +
      categories
        .map(function (category) {
          return '<span class="bg-surface-container-high text-on-surface-variant px-unit-4 py-unit-1 rounded-full text-label-sm font-label-sm whitespace-nowrap">' + category + '</span>';
        })
        .join('');
  }

  function load(query) {
    const url = '/api/notes' + (query ? '?q=' + encodeURIComponent(query) : '');
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        renderFilters(data.categories || []);
        gridEl.innerHTML = (data.notes || []).map(card).join('');
      })
      .catch(function () {});
  }

  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        load(searchInput.value.trim());
      }, 250);
    });
  }

  load('');
})();
