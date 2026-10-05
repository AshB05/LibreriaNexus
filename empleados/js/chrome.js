/* ==========================================================
   Librería Nexus — Chrome compartido (sidebar + header)
   Cada página autenticada incluye:
     <body data-path="dashboard">
     <script src="js/auth.js"></script>
     <script src="js/empleados.js"></script>
     <script src="js/chrome.js"></script>
   ========================================================== */
(function () {
  'use strict';

  const NAV = [
    { path: 'dashboard', href: 'dashboard.html', icon: 'dashboard', label: 'Inicio / Dashboard' },
    { path: 'libros', href: 'libros.html', icon: 'menu_book', label: 'Libros / Catálogo' },
    { path: 'agregar', href: 'libro-form.html', icon: 'add_circle', label: 'Agregar Libro' },
    { path: 'inventario', href: 'inventario.html', icon: 'inventory_2', label: 'Inventario & Stock' },
    { path: 'recientes', href: 'recientes.html', icon: 'auto_awesome', label: 'Recién Llegados' },
    { path: 'configuracion', href: 'configuracion.html', icon: 'settings', label: 'Configuración' }
  ];

  function sidebarHTML(active) {
    const links = NAV.map(n => {
      const isActive = n.path === active;
      const cls = isActive
        ? 'flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all bg-secondary text-on-secondary font-title-md'
        : 'flex items-center gap-space-md px-space-md py-space-sm rounded-xl text-on-primary-container hover:bg-surface-variant/10 hover:text-on-primary transition-all font-body-md text-body-md';
      return `<a ${isActive ? 'aria-current="page"' : ''} class="${cls}" data-path="${n.path}" href="${n.href}"><span class="material-symbols-outlined text-[20px]">${n.icon}</span><span>${n.label}</span></a>`;
    }).join('');
    return `
<aside class="fixed left-0 top-0 h-full w-72 bg-primary-container text-on-primary z-50 flex flex-col justify-between shadow-[0_1px_16px_rgba(5,14,28,0.12)]">
  <div class="flex flex-col">
    <div class="h-20 px-space-lg flex items-center gap-space-sm bg-primary/40">
      <img alt="Librería Nexus" class="h-8 w-auto object-contain" src="../img/logo.png">
      <div class="flex flex-col ml-space-xs">
        <span class="font-headline-sm text-headline-sm tracking-tight text-on-primary leading-tight">Librería Nexus</span>
        <span class="font-label-sm text-label-sm text-on-primary-container tracking-wider uppercase">Terminal Empleados</span>
      </div>
    </div>
    <div class="px-space-md py-space-sm">
      <div class="px-space-sm py-space-xs flex items-center justify-between text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider mb-space-xs"><span>Navegación</span></div>
      <nav class="flex flex-col gap-space-xs">${links}</nav>
    </div>
  </div>
  <div class="p-space-md bg-primary/30 flex flex-col gap-space-sm">
    <div class="flex items-center gap-space-sm px-space-sm py-space-xs rounded-xl bg-surface-container-highest/10">
      <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span></span>
      <span class="font-label-sm text-label-sm text-on-primary-container">BD Sala: En línea</span>
    </div>
    <div class="flex items-center justify-between px-space-sm pt-space-xs text-on-primary-container font-label-sm text-label-sm"><span>Nexus v2.4.0</span><span class="text-tertiary-fixed">Sede Central</span></div>
  </div>
</aside>`;
  }

  function headerHTML() {
    return `
<header class="fixed top-0 left-72 right-0 h-20 bg-surface-bright/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(5,14,28,0.04)] z-40 flex items-center justify-between px-space-xl">
  <div class="flex items-center gap-space-md">
    <img alt="Librería Nexus" class="h-8 w-auto object-contain" src="../img/logo.png">
    <div class="hidden sm:flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-high">
      <span class="h-2 w-2 rounded-full bg-secondary"></span>
      <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wide uppercase">Conexión Estable • Sala Principal</span>
    </div>
  </div>
  <div class="flex items-center gap-space-lg">
    <div class="flex items-center gap-space-md">
      <div class="flex flex-col text-right">
        <span class="font-title-md text-title-md text-on-surface leading-tight" data-user-name>Empleado</span>
        <div class="flex items-center justify-end gap-space-xs">
          <span class="font-label-sm text-label-sm text-on-surface-variant" data-user-role></span>
          <span class="inline-block px-space-xs py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-[10px] tracking-wider uppercase font-semibold" data-user-badge></span>
        </div>
      </div>
      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm"><span class="material-symbols-outlined text-on-primary text-[18px]">person</span></div>
    </div>
    <a class="flex items-center gap-space-xs px-space-md py-space-sm rounded-xl text-secondary hover:bg-surface-container-high transition-colors font-title-md text-title-md" href="#" data-logout>
      <span class="material-symbols-outlined text-[18px]">logout</span><span>Cerrar sesión</span>
    </a>
  </div>
</header>`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const session = window.NexusAuth.requireAuth();
    if (!session) return;
    const active = document.body.dataset.page || 'dashboard';
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML(active));
    const main = document.querySelector('main');
    if (main) {
      main.classList.add('pl-72', 'pt-20', 'bg-background', 'min-h-screen');
      main.insertAdjacentHTML('beforebegin', headerHTML());
    }
    // Rellenar usuario y comportamiento informativo
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = session.nombre);
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = session.area);
    document.querySelectorAll('[data-user-badge]').forEach(el => el.textContent = session.rol);
    document.querySelectorAll('[data-logout]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.NexusAuth.logout(); }));
  });
})();
