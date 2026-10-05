/* ==========================================================
   Librería Nexus — Catálogo administrativo + Formulario
   ========================================================== */
(function () {
  'use strict';

  function statusBadge(stock) {
    const st = NexusEmp.stockStatus(stock);
    const cls = st.key === 'disponible' ? 'badge-disponible' : st.key === 'bajo' ? 'badge-bajo' : 'badge-agotado';
    return `<span class="inline-flex items-center px-space-sm py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider ${cls}">${st.label}</span>`;
  }

  /* ---------------- Catálogo (libros.html) ---------------- */
  async function initCatalogo() {
    const tbody = document.getElementById('books-tbody');
    if (!tbody) return;

    let books = await NexusEmp.getBooks();

    const catSelect = document.getElementById('category-select');
    const cats = [...new Set(books.map(b => NexusEmp.normalizeCategory(b.categoria)))].sort();
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      catSelect.appendChild(opt);
    });

    const searchInput = document.getElementById('search-input');
    const statusSelect = document.getElementById('status-select');
    const recienteCheck = document.getElementById('reciente-check');

    function getFiltered() {
      const q = searchInput.value.toLowerCase().trim();
      const cat = catSelect.value;
      const st = statusSelect.value;
      const soloRecientes = recienteCheck.checked;
      return books.filter(b => {
        const hay = (b.titulo || '') + ' ' + (b.autor || '') + ' ' + b.id + ' ' + (b.isbn || '');
        if (q && !hay.toLowerCase().includes(q)) return false;
        if (cat && NexusEmp.normalizeCategory(b.categoria) !== cat) return false;
        if (st && NexusEmp.stockStatus(b.stock).key !== st) return false;
        if (soloRecientes && b.reciente !== true) return false;
        return true;
      });
    }

    function render() {
      const list = getFiltered();
      document.getElementById('result-count').textContent = `${list.length} de ${books.length} títulos`;
      tbody.innerHTML = list.map(b => `
        <tr class="hover:bg-surface-container-low/60 transition-colors group">
          <td class="py-space-lg px-space-md font-mono font-label-md text-label-md text-outline">${b.id}</td>
          <td class="py-space-lg px-space-sm"><div class="w-12 h-16 rounded overflow-hidden shadow-md bg-surface-container"><img class="w-full h-full object-cover" src="${NexusEmp.getBookCoverPath(b)}" onerror="NexusEmp.coverFallback(this)" alt="${NexusEmp.escapeHtml(b.titulo)}"></div></td>
          <td class="py-space-lg px-space-md min-w-[220px]">
            <div class="flex flex-col">
              <span class="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors">${NexusEmp.escapeHtml(b.titulo)}</span>
              ${b.reciente ? '<span class="text-secondary font-label-sm text-label-sm uppercase tracking-wider">Recién llegado</span>' : ''}
            </div>
          </td>
          <td class="py-space-lg px-space-md"><span class="font-body-md text-body-md text-on-surface">${NexusEmp.escapeHtml(b.autor)}</span></td>
          <td class="py-space-lg px-space-md"><span class="inline-flex px-space-sm py-1 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">${NexusEmp.escapeHtml(NexusEmp.normalizeCategory(b.categoria))}</span></td>
          <td class="py-space-lg px-space-md"><span class="font-title-md text-title-md text-primary">${b.stock}</span></td>
          <td class="py-space-lg px-space-md">${statusBadge(b.stock)}</td>
          <td class="py-space-lg px-space-md text-right whitespace-nowrap">
            <button class="p-2 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all" title="Ver" data-action="ver" data-id="${b.id}"><span class="material-symbols-outlined text-[18px]">visibility</span></button>
            <a class="p-2 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-all inline-flex" title="Editar" href="libro-form.html?id=${b.id}"><span class="material-symbols-outlined text-[18px]">edit</span></a>
            <a class="px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-secondary hover:text-on-secondary font-title-md text-title-md transition-all shadow-sm" href="inventario.html?foco=${b.id}">Stock</a>
            <button class="p-2 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-all" title="Eliminar" data-action="eliminar" data-id="${b.id}"><span class="material-symbols-outlined text-[18px]">delete</span></button>
          </td>
        </tr>`).join('') || `<tr><td colspan="8" class="py-space-xl text-center text-on-surface-variant">Sin resultados</td></tr>`;
    }

    function refresh() { NexusEmp.invalidate(); return NexusEmp.getBooks(true).then(list => { books = list; render(); }); }

    [searchInput, statusSelect, recienteCheck].forEach(el => el.addEventListener('input', render));
    catSelect.addEventListener('change', render);
    render();

    tbody.addEventListener('click', async function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const book = books.find(b => b.id === id);
      if (btn.dataset.action === 'ver' && book) {
        const modal = document.getElementById('view-modal');
        document.getElementById('view-modal-body').innerHTML = `
          <div class="flex gap-space-lg">
            <img class="w-28 rounded-md shadow-md" src="${NexusEmp.getBookCoverPath(book)}" onerror="NexusEmp.coverFallback(this)" alt="">
            <div class="flex flex-col gap-1">
              <h3 class="font-headline-sm text-headline-sm text-primary">${NexusEmp.escapeHtml(book.titulo)}</h3>
              <p class="font-body-md text-body-md text-on-surface-variant">${NexusEmp.escapeHtml(book.autor)}</p>
              <p class="font-body-sm text-body-sm text-outline">${NexusEmp.escapeHtml(book.editorial || '')} • ${book.anio_publicacion || '—'} • ${NexusEmp.escapeHtml(book.idioma || '')}</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant">ISBN: ${book.isbn || '—'}</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant">Categoría: ${NexusEmp.escapeHtml(NexusEmp.normalizeCategory(book.categoria))}</p>
              <p class="font-title-md text-title-md text-primary">${NexusEmp.formatPrice(book.precio)} • Stock: ${book.stock}</p>
            </div>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-space-md">${NexusEmp.escapeHtml(book.descripcion || '')}</p>
          <button class="mt-space-lg w-full py-2.5 rounded-lg bg-surface-container-high font-title-md text-title-md" id="close-view">Cerrar</button>`;
        modal.classList.remove('hidden');
        document.getElementById('close-view').onclick = () => modal.classList.add('hidden');
      }
      if (btn.dataset.action === 'eliminar' && book) {
        if (confirm(`¿Seguro que deseas eliminar "${book.titulo}" del catálogo? Esta acción no se puede deshacer desde esta demo.`)) {
          NexusEmp.deleteBook(id);
          NexusEmp.toast('Libro eliminado', `"${book.titulo}" fue retirado del catálogo (demo).`);
          await refresh();
        }
      }
    });
  }

  /* ---------------- Formulario (libro-form.html) ---------------- */
  async function initForm() {
    const form = document.getElementById('book-form');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');
    let editing = null;
    const books = await NexusEmp.getBooks();

    const cats = [...new Set(books.map(b => NexusEmp.normalizeCategory(b.categoria)))].sort();
    const catSelect = document.getElementById('f-categoria');
    cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o); });

    if (editId) {
      editing = books.find(b => String(b.id) === String(editId));
      if (editing) fillForm(editing);
      document.getElementById('form-title').textContent = `Editar libro #${editing ? editing.id : editId}`;
      document.getElementById('form-subtitle').textContent = 'Los cambios se guardan como ajustes demo sobre data/libros.json.';
      document.getElementById('f-id-display').value = editing ? editing.id : editId;
      document.getElementById('delete-btn').classList.remove('hidden');
    } else {
      document.getElementById('form-title').textContent = 'Agregar nuevo libro';
      const nextId = await NexusEmp.getNextId();
      document.getElementById('f-id-display').value = nextId + ' (automático)';
      document.getElementById('f-anio').value = new Date().getFullYear();
      document.getElementById('delete-btn').classList.add('hidden');
    }

    function fillForm(b) {
      document.getElementById('f-titulo').value = b.titulo || '';
      document.getElementById('f-autor').value = b.autor || '';
      document.getElementById('f-isbn').value = b.isbn || '';
      catSelect.value = NexusEmp.normalizeCategory(b.categoria);
      document.getElementById('f-editorial').value = b.editorial || '';
      document.getElementById('f-anio').value = b.anio_publicacion || '';
      document.getElementById('f-idioma').value = b.idioma || '';
      document.getElementById('f-precio').value = b.precio != null ? b.precio : '';
      document.getElementById('f-stock').value = b.stock != null ? b.stock : 0;
      document.getElementById('f-descripcion').value = b.descripcion || '';
      document.getElementById('f-reciente').checked = b.reciente === true;
      updatePreview();
    }

    function updatePreview() {
      const cat = catSelect.value;
      const img = document.getElementById('preview-cover');
      const idVal = editing ? editing.id : document.getElementById('f-id-display').value.replace(' (automático)', '');
      const folderMap = NexusEmp.categoryFolderMap[cat] || 'otros';
      img.src = `../imagenes/${folderMap}/${parseInt(idVal, 10) || 0}.jpg`;
      img.onerror = function () { this.onerror = null; this.src = '../imagenes/placeholder.svg'; };
      document.getElementById('preview-title').textContent = document.getElementById('f-titulo').value || 'Sin título';
      document.getElementById('preview-author').textContent = document.getElementById('f-autor').value || 'Autor desconocido';
      document.getElementById('preview-category').textContent = cat || '—';
      const price = parseFloat(document.getElementById('f-precio').value);
      document.getElementById('preview-price').textContent = isNaN(price) ? '—' : price.toFixed(2) + ' €';
      const stock = parseInt(document.getElementById('f-stock').value, 10) || 0;
      const st = NexusEmp.stockStatus(stock);
      document.getElementById('preview-status').textContent = st.label + ` (${stock})`;
    }

    ['f-titulo', 'f-autor', 'f-precio', 'f-stock'].forEach(id => document.getElementById(id).addEventListener('input', updatePreview));
    catSelect.addEventListener('change', updatePreview);
    updatePreview();

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const book = {
        titulo: document.getElementById('f-titulo').value.trim(),
        autor: document.getElementById('f-autor').value.trim(),
        isbn: document.getElementById('f-isbn').value.trim(),
        categoria: catSelect.value,
        editorial: document.getElementById('f-editorial').value.trim(),
        anio_publicacion: parseInt(document.getElementById('f-anio').value, 10) || null,
        idioma: document.getElementById('f-idioma').value.trim(),
        precio: parseFloat(document.getElementById('f-precio').value) || 0,
        stock: parseInt(document.getElementById('f-stock').value, 10) || 0,
        reciente: document.getElementById('f-reciente').checked,
        descripcion: document.getElementById('f-descripcion').value.trim()
      };
      if (!book.titulo || !book.autor || !book.categoria) {
        alert('Título, autor y categoría son obligatorios.');
        return;
      }
      if (editing) {
        NexusEmp.saveBookChanges(editing.id, book);
        NexusEmp.toast('Cambios guardados', `"${book.titulo}" actualizado correctamente.`);
      } else {
        const nextId = await NexusEmp.getNextId();
        book.id = nextId;
        book.imagen = `img/libros/${nextId}.jpg`;
        NexusEmp.addBook(book);
        NexusEmp.toast('Libro registrado', `"${book.titulo}" agregado con ID ${nextId}.`);
      }
      setTimeout(() => window.location.href = 'libros.html', 900);
    });

    document.getElementById('delete-btn').addEventListener('click', function () {
      if (!editing) return;
      if (confirm(`¿Eliminar definitivamente "${editing.titulo}"?`)) {
        NexusEmp.deleteBook(editing.id);
        window.location.href = 'libros.html';
      }
    });
  }

  /* ---------------- Recientes ---------------- */
  async function initRecientes() {
    const tbody = document.getElementById('recientes-tbody');
    if (!tbody) return;
    let books = (await NexusEmp.getBooks()).filter(b => b.reciente === true);

    function render() {
      tbody.innerHTML = books.length ? books.map(b => `
        <tr class="hover:bg-surface-container-low/60 transition-colors">
          <td class="py-space-lg px-space-md font-mono font-label-md text-label-md text-outline">${b.id}</td>
          <td class="py-space-lg px-space-sm"><div class="w-12 h-16 rounded overflow-hidden shadow-md bg-surface-container"><img class="w-full h-full object-cover" src="${NexusEmp.getBookCoverPath(b)}" onerror="NexusEmp.coverFallback(this)" alt=""></div></td>
          <td class="py-space-lg px-space-md"><span class="font-headline-sm text-headline-sm text-primary">${NexusEmp.escapeHtml(b.titulo)}</span></td>
          <td class="py-space-lg px-space-md">${NexusEmp.escapeHtml(b.autor)}</td>
          <td class="py-space-lg px-space-md">${NexusEmp.escapeHtml(NexusEmp.normalizeCategory(b.categoria))}</td>
          <td class="py-space-lg px-space-md text-right whitespace-nowrap">
            <a class="p-2 rounded-lg text-outline hover:text-primary hover:bg-surface-container inline-flex" href="libro-form.html?id=${b.id}" title="Editar"><span class="material-symbols-outlined text-[18px]">edit</span></a>
            <button class="px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-secondary hover:text-on-secondary font-title-md text-title-md transition-all shadow-sm" data-quitar="${b.id}">Quitar novedad</button>
          </td>
        </tr>`).join('') : '<tr><td colspan="6" class="py-space-xl text-center text-on-surface-variant">No hay libros marcados como recién llegados.</td></tr>';
    }
    render();

    tbody.addEventListener('click', async function (e) {
      const btn = e.target.closest('button[data-quitar]');
      if (!btn) return;
      const id = Number(btn.dataset.quitar);
      const book = books.find(b => b.id === id);
      if (!confirm(`¿Quitar "${book.titulo}" de Recién Llegados? Dejará de mostrarse como novedad en la web pública.`)) return;
      NexusEmp.saveBookChanges(id, { reciente: false });
      NexusEmp.toast('Novedad retirada', `"${book.titulo}" ya no aparecerá como recién llegado.`);
      NexusEmp.invalidate();
      books = (await NexusEmp.getBooks(true)).filter(b => b.reciente === true);
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCatalogo().catch(console.error);
    initForm().catch(console.error);
    initRecientes().catch(console.error);
  });
})();
