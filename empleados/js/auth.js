/* ==========================================================
   Librería Nexus — Autenticación de empleados (DEMO)
   ----------------------------------------------------------
   IMPORTANTE: Esta es una autenticación temporal de
   demostración que guarda la sesión en el navegador.
   Cuando exista el servidor de datos, reemplace las
   funciones login()/logout() por llamadas a la API real
   (p. ej. POST /api/auth/login) y guarde un token JWT.
   ========================================================== */
(function () {
  'use strict';

  // Cuentas de demostración creadas internamente.
  // Se sustituirán por cuentas reales en el servidor.
  const DEMO_EMPLOYEES = [
    { id: 'admin@librerianexus.com', password: 'nexus2026', nombre: 'Alejandro Morales', rol: 'Administrador', area: 'Encargado de Sala' },
    { id: 'empleada@librerianexus.com', password: 'nexus2026', nombre: 'Lucía Fernández', rol: 'Empleado', area: 'Catalogadora' },
    { id: '#EMP-304', password: 'nexus2026', nombre: 'Empleado Sala', rol: 'Empleado', area: 'Atención' }
  ];

  const SESSION_KEY = 'nexus_emp_session';

  function saveSession(emp, remember) {
    const store = remember ? localStorage : sessionStorage;
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    store.setItem(SESSION_KEY, JSON.stringify({
      id: emp.id, nombre: emp.nombre, rol: emp.rol, area: emp.area,
      inicio: new Date().toISOString()
    }));
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function login(employeeId, password, remember) {
    const id = (employeeId || '').trim().toLowerCase();
    const emp = DEMO_EMPLOYEES.find(e => e.id.toLowerCase() === id || e.id.toLowerCase() === (employeeId || '').trim().toLowerCase());
    if (emp && emp.password === password) {
      saveSession(emp, remember);
      return { ok: true, empleado: emp };
    }
    return { ok: false, error: 'Credenciales no válidas. Verifica tu correo/ID y contraseña.' };
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    window.location.href = 'login.html';
  }

  function requireAuth() {
    if (!getSession()) {
      window.location.replace('login.html');
      return null;
    }
    return getSession();
  }

  window.NexusAuth = {
    login, logout, getSession, requireAuth,
    // Futuro: reemplazar por AuthService con tokens reales
    DEMO_EMPLOYEES
  };
})();
