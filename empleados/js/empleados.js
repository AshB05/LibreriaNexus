/* ==========================================================
   Librería Nexus — Capa de datos compartida (DEMO)
   ----------------------------------------------------------
   Hoy los datos se leen de ../data/libros.json.
   Las operaciones de escritura (alta, edición, stock,
   reciente, borrado) se guardan como "overrides" en
   localStorage hasta que se conecte la API real.
   Al migrar al servidor, basta reemplazar las funciones
   loadBooksFromSource / applyOverrides por fetch a la API.
   ========================================================== */
(function () {
  'use strict';

  const DATA_URL = '../data/libros.json';
  const LS_OVERRIDES = 'nexus_emp_overrides';
  const LS_CREATED   = 'nexus_emp_created';
  const LS_DELETED   = 'nexus_emp_deleted';

  let cache = null;

  // Mapeo de categorías a carpetas (idéntico al sistema público)
  const categoryFolderMap = {
    'Literatura': 'literatura',
    'Ciencia': 'ciencia',
    'Tecnología': 'tecnologia',
    'Historia': 'historia',
    'Filosofía': 'filosofia',
    'Psicología': 'psicologia',
    'Negocios y Economía': 'negocios-economia',
    'Arte y Diseño': 'arte-diseno'
  };

  // El JSON existente puede venir con la codificación latin1
  // (p. ej. "TecnologA-a"). Normalizamos a acentos correctos.
  function normalizeCategory(cat) {
    if (!cat) return cat;
    const fixed = cat
      .replace('A-a', 'ía')
      .replace('A�o', 'ño')
      .replace('A�', 'ñ')
      .replace('A3', 'ó');
    return fixed;
  }

  function getBookCoverPath(book) {
    const folder = categoryFolderMap[normalizeCategory(book.categoria)] || 'otros';
    return `../imagenes/${folder}/${book.id}.jpg`;
  }

  function coverFallback(imgEl) {
    imgEl.onerror = null;
    imgEl.src = '../imagenes/placeholder.svg';
  }

  function getOverrides() {
    try { return JSON.parse(localStorage.getItem(LS_OVERRIDES) || '[]'); } catch (e) { return []; }
  }
  function getCreated() {
    try { return JSON.parse(localStorage.getItem(LS_CREATED) || '[]'); } catch (e) { return []; }
  }
  function getDeleted() {
    try { return JSON.parse(localStorage.getItem(LS_DELETED) || '[]'); } catch (e) { return []; }
  }

  function applyOverrides(books) {
    const overrides = getOverrides();
    const created = getCreated();
    const deleted = getDeleted();
    let list = books
      .filter(b => !deleted.includes(b.id))
      .map(b => {
        const ov = overrides.find(o => o.id === b.id);
        return ov ? Object.assign({}, b, ov.changes) : b;
      });
    list = list.concat(created.filter(c => !deleted.includes(c.id)));
    return list;
  }

  async function getBooks(force) {
    if (cache && !force) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('No se pudo cargar data/libros.json');
    const data = await res.json();
    const base = data.libros || data;
    cache = applyOverrides(base);
    return cache;
  }

  function invalidate() { cache = null; }

  // Datos demo: editar un libro existente
  function saveBookChanges(id, changes) {
    const overrides = getOverrides().filter(o => o.id !== id);
    overrides.push({ id, changes });
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
    // Si es un libro creado en demo, actualizamos su registro
    const created = getCreated();
    const idx = created.findIndex(c => c.id === id);
    if (idx >= 0) { created[idx] = Object.assign({}, created[idx], changes); localStorage.setItem(LS_CREATED, JSON.stringify(created)); }
    invalidate();
  }

  function addBook(book) {
    const created = getCreated();
    created.push(book);
    localStorage.setItem(LS_CREATED, JSON.stringify(created));
    invalidate();
  }

  function deleteBook(id) {
    const deleted = getDeleted();
    if (!deleted.includes(id)) deleted.push(id);
    localStorage.setItem(LS_DELETED, JSON.stringify(deleted));
    invalidate();
  }

  async function getNextId() {
    const books = await getBooks();
    return books.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0) + 1;
  }

  function resetDemo() {
    localStorage.removeItem(LS_OVERRIDES);
    localStorage.removeItem(LS_CREATED);
    localStorage.removeItem(LS_DELETED);
    invalidate();
  }

  // Estado de stock según reglas del negocio
  function stockStatus(stock) {
    const n = Number(stock) || 0;
    if (n > 2) return { key: 'disponible', label: 'Disponible' };
    if (n >= 1) return { key: 'bajo', label: 'Stock bajo' };
    return { key: 'agotado', label: 'Agotado' };
  }

  function formatPrice(p) {
    const n = Number(p);
    return isNaN(n) ? '—' : n.toFixed(2) + ' €';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Rellena el nombre/rol del empleado y el estado activo del menú
  function initChrome(activePath) {
    const session = window.NexusAuth ? window.NexusAuth.getSession() : null;
    if (session) {
      document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = session.nombre);
      document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = session.area + ' • ' + session.rol);
      document.querySelectorAll('[data-user-badge]').forEach(el => el.textContent = session.rol);
    }
    document.querySelectorAll('nav a[data-path]').forEach(a => {
      if (a.dataset.path === activePath) {
        a.classList.add('bg-secondary', 'text-on-secondary', 'font-title-md');
        a.classList.remove('text-on-primary-container', 'font-body-md');
        a.setAttribute('aria-current', 'page');
      }
    });
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); window.NexusAuth.logout(); });
    });
  }

  function toast(title, msg) {
    const el = document.createElement('div');
    el.className = 'nexus-toast';
    el.innerHTML = `<span class="material-symbols-outlined" style="color:#fe8357">verified</span><div><p class="font-title-md text-title-md"></p><p class="font-body-sm text-body-sm" style="color:#bec7da"></p></div>`;
    el.querySelector('p').textContent = title;
    el.children[1].children[1].textContent = msg || '';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  window.NexusEmp = {
    DATA_URL, categoryFolderMap, normalizeCategory, getBookCoverPath, coverFallback,
    getBooks, saveBookChanges, addBook, deleteBook, getNextId, resetDemo,
    stockStatus, formatPrice, escapeHtml, initChrome, toast, invalidate
  };
})();
