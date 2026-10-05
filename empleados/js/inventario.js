/* Inventario y Stock - Libreria Nexus (demo) */
(function () {
  'use strict';

  /* ---------------- Inventario ---------------- */
  async function initInventario() {
    const list = document.getElementById('inv-list');
    if (!list) return;
    let books = await NexusEmp.getBooks();
    const params = new URLSearchParams(window.location.search);
    const foco = params.get('foco');

    function counts() {
      return {
        disponible: books.filter(b => Number(b.stock) > 2).length,
        bajo: books.filter(b => Number(b.stock) >= 1 && Number(b.stock) <= 2).length,
        agotado: books.filter(b => Number(b.stock) === 0).length
      };
    }

    function renderCounts() {
      const c = counts();
      document.getElementById('inv-disponible').textContent = c.disponible;
      document.getElementById('inv-bajo').textContent = c.bajo;
      document.getElementById('inv-agotado').textContent = c.agotado;
    }

    function renderList() {
      const q = (document.getElementById('inv-search').value || '').toLowerCase().trim();
      const filtered = books.filter(b => {
        const t = ((b.titulo || '') + ' ' + (b.autor || '') + ' ' + b.id + ' ' + (b.isbn || '')).toLowerCase();
        return !q || t.includes(q);
      });
      list.innerHTML = filtered.map(b => {
        const st = NexusEmp.stockStatus(b.stock);
        const cls = st.key === 'disponible' ? 'badge-disponible' : st.key === 'bajo' ? 'badge-bajo' : 'badge-agotado';
        return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md p-space-lg items-center hover:bg-surface-container-low/50 transition-colors ${String(b.id) === String(foco) ? 'bg-secondary-fixed/10 ring-1 ring-secondary/40 rounded-xl' : ''}" data-id="${b.id}">
          <div class="col-span-1 lg:col-span-5 flex items-center gap-space-md min-w-0">
            <div class="w-14 h-20 rounded-md overflow-hidden shrink-0 shadow-sm bg-surface-container"><img class="w-full h-full object-cover" src="${NexusEmp.getBookCoverPath(b)}" onerror="NexusEmp.coverFallback(this)" alt=""></div>
            <div class="flex flex-col min-w-0">
              <span class="font-headline-sm text-title-md text-primary font-semibold truncate">${NexusEmp.escapeHtml(b.titulo)}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${NexusEmp.escapeHtml(b.autor)} • ${NexusEmp.escapeHtml(b.editorial || '')}</span>
              <span class="font-mono text-[11px] text-outline mt-1">ISBN: ${b.isbn || '—'} • ID #${b.id}</span>
            </div>
          </div>
          <div class="col-span-1 lg:col-span-4 flex items-center gap-space-md">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[11px] uppercase tracking-wider ${cls}">${st.label}</span>
            <span class="font-body-sm text-body-sm text-outline">Categoría: ${NexusEmp.escapeHtml(NexusEmp.normalizeCategory(b.categoria))}</span>
          </div>
          <div class="col-span-1 lg:col-span-3 flex items-center justify-start lg:justify-end gap-space-sm">
            <div class="flex items-center bg-surface-container-high rounded-xl p-1 shadow-sm">
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary transition-all active:scale-95" data-step="-1" data-id="${b.id}"><span class="material-symbols-outlined text-[16px]">remove</span></button>
              <span class="w-10 text-center font-title-md text-title-md text-primary font-semibold" id="count-${b.id}">${b.stock}</span>
              <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface hover:bg-secondary hover:text-on-secondary transition-all active:scale-95" data-step="1" data-id="${b.id}"><span class="material-symbols-outlined text-[16px]">add</span></button>
            </div>
            <button class="px-space-md py-2 rounded-lg bg-primary text-on-primary font-title-md text-body-sm hover:bg-primary-container transition-all" data-save="${b.id}">Guardar</button>
          </div>
        </div>`;
      }).join('') || '<p class="p-space-xl text-center text-on-surface-variant">Sin libros</p>';
      // Inicializar borradores con el stock actual
      books.forEach(b => { draftStocks[b.id] = Number(b.stock) || 0; });
    }

    const draftStocks = {};
    renderCounts();
    renderList();

    document.getElementById('inv-search').addEventListener('input', renderList);

    list.addEventListener('click', async function (e) {
      const stepBtn = e.target.closest('button[data-step]');
      if (stepBtn) {
        const id = stepBtn.dataset.id;
        draftStocks[id] = Math.max(0, (draftStocks[id] ?? 0) + Number(stepBtn.dataset.step));
        document.getElementById('count-' + id).textContent = draftStocks[id];
        return;
      }
      const saveBtn = e.target.closest('button[data-save]');
      if (saveBtn) {
        const id = Number(saveBtn.dataset.save);
        const book = books.find(b => b.id === id);
        const nuevo = draftStocks[id];
        if (!confirm(`¿Confirmar el ajuste de stock de "${book.titulo}" de ${book.stock} a ${nuevo}?`)) return;
        NexusEmp.saveBookChanges(id, { stock: nuevo });
        NexusEmp.toast('Stock actualizado', `"${book.titulo}" ahora tiene ${nuevo} unidades.`);
        NexusEmp.invalidate();
        books = await NexusEmp.getBooks(true);
        renderCounts();
        renderList();
      }
    });
  }


  document.addEventListener('DOMContentLoaded', function () {
    initInventario().catch(console.error);
  });
})();
