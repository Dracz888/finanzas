// ═══════════════════════════════════════════
//  DORADO CLUB — Data Layer v1
// ═══════════════════════════════════════════

export const SYSTEM_ROLES = {
  GG:   { label: "Gerente General",           color: "#C9A227", canManageUsers: true,  canSeeAll: true,  canAssignTo: "all",    defaultPerms: { verTodos: true,  crearTareas: true,  eliminarTareas: true  }, system: true },
  SI:   { label: "Súper Intendente",          color: "#e0b84a", canManageUsers: true,  canSeeAll: true,  canAssignTo: "all",    defaultPerms: { verTodos: true,  crearTareas: true,  eliminarTareas: true  }, system: true },
  GADM: { label: "Gerente Administrativo",    color: "#60a5fa", canManageUsers: false, canSeeAll: true,  canAssignTo: "nonAdm", defaultPerms: { verTodos: true,  crearTareas: true,  eliminarTareas: false }, system: true },
  GMK:  { label: "Gerente de Mercadeo",       color: "#a78bfa", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GRH:  { label: "Gerente de RRHH",          color: "#22c55e", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GI:   { label: "Gerente Inmobiliaria",     color: "#f97316", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GCO:  { label: "Gerente de Condominio",    color: "#14b8a6", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GKG:  { label: "Gerente de Komplex Gym",   color: "#ec4899", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GDFC: { label: "Gerente de DFC",           color: "#f59e0b", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
  GSB:  { label: "Gerente de Sport Bar",     color: "#84cc16", canManageUsers: false, canSeeAll: false, canAssignTo: "none",   defaultPerms: { verTodos: false, crearTareas: false, eliminarTareas: false }, system: true },
};

export function getRoles() {
  const custom = JSON.parse(sessionStorage.getItem("dc_roles") || "[]");
  const all = { ...SYSTEM_ROLES };
  custom.forEach(r => { all[r.key] = r; });
  return all;
}

// Proxy dinámico — permite ROLES[key] en todos los componentes
export const ROLES = new Proxy({}, {
  get(_, key)  { return getRoles()[key]; },
  has(_, key)  { return key in getRoles(); },
  ownKeys(_)   { return Object.keys(getRoles()); },
  getOwnPropertyDescriptor(_, key) {
    const val = getRoles()[key];
    return val ? { value: val, writable: true, enumerable: true, configurable: true } : undefined;
  },
});

export function getCustomRoles()    { return JSON.parse(sessionStorage.getItem("dc_roles")    || "[]"); }
export function saveCustomRoles(d)  { sessionStorage.setItem("dc_roles", JSON.stringify(d)); }

// ── Etiquetas ──
export const ETIQUETAS_INITIAL = [
  { id: "urgente",   label: "Urgente",   color: "#D32F2F" },
  { id: "cardio",    label: "Cardio",    color: "#60a5fa" },
  { id: "ventas",    label: "Ventas",    color: "#22c55e" },
  { id: "limpieza",  label: "Limpieza",  color: "#f97316" },
  { id: "marketing", label: "Marketing", color: "#a78bfa" },
  { id: "cliente",   label: "Cliente",   color: "#f59e0b" },
];

// ── Usuarios ──
export const USERS_INITIAL = [
  { id: 1, user: "gerente",   pass: "dorado2024", nombre: "Gerente General",    rolKey: "GG",  avatar: "GG", activo: true, perms: { verTodos: true,  crearTareas: true,  eliminarTareas: true  } },
  { id: 2, user: "superintendente", pass: "super2024", nombre: "Súper Intendente", rolKey: "SI",  avatar: "SI", activo: true, perms: { verTodos: true,  crearTareas: true,  eliminarTareas: true  } },
];

// ── Tareas ──
export const TAREAS_INITIAL = [
  { id: 1, titulo: "Revisión de estados financieros", prioridad: "alta",  estado: "pendiente",  fecha: "2026-06-20", asignadoA: [1], creadoPor: 1, descripcion: "Consolidar ingresos y egresos del mes de junio.", adjuntos: [], comentarios: [], etiquetas: ["urgente"], recurrencia: "mensual", plantilla: null },
  { id: 2, titulo: "Reunión de directivos",           prioridad: "alta",  estado: "pendiente",  fecha: "2026-06-18", asignadoA: [1,2], creadoPor: 1, descripcion: "Reunión mensual de todos los gerentes de área.", adjuntos: [], comentarios: [], etiquetas: [], recurrencia: "mensual", plantilla: null },
];

// ── Reportes ──
export const REPORTES_INITIAL = [
  { id: 1, titulo: "Informe de Gestión – Junio 2026", tipo: "gestion", fecha: "2026-06-01", autorId: 1, estado: "aprobado",  contenido: "Resumen de actividades del mes de junio.", adjuntos: [] },
];

// ── Plantillas de reporte ──
export const PLANTILLAS_INITIAL = [
  {
    id: 1, nombre: "Reporte de Asistencia", tipo: "asistencia", creadoPor: 1,
    descripcion: "Plantilla estándar para registrar asistencia semanal.",
    campos: [
      { id: "semana",      label: "Semana",                tipo: "text",   requerido: true  },
      { id: "total",       label: "Total de asistentes",   tipo: "number", requerido: true  },
      { id: "pico",        label: "Hora pico",             tipo: "text",   requerido: false },
      { id: "observacion", label: "Observaciones",         tipo: "textarea",requerido: false },
    ],
    adjuntoEjemplo: null,
  },
  {
    id: 2, nombre: "Reporte de Mantenimiento", tipo: "mantenimiento", creadoPor: 1,
    descripcion: "Para registrar incidencias y trabajos de mantenimiento.",
    campos: [
      { id: "equipo",      label: "Equipo/Área afectada",  tipo: "text",    requerido: true  },
      { id: "problema",    label: "Problema detectado",    tipo: "textarea",requerido: true  },
      { id: "accion",      label: "Acción tomada",         tipo: "textarea",requerido: true  },
      { id: "estado_eq",   label: "Estado del equipo",     tipo: "select",  opciones: ["Operativo","En reparación","Fuera de servicio"], requerido: true },
    ],
    adjuntoEjemplo: null,
  },
];

// ── Anuncios ──
export const ANUNCIOS_INITIAL = [
  { id: 1, titulo: "¡Bienvenidos a Dorado Club!", contenido: "Sistema de gestión empresarial Dorado Club. Solo el Gerente General y el Súper Intendente pueden crear cuentas de acceso.", autorId: 1, fecha: "2026-06-15", prioridad: "alta", activo: true },
];

// ── Historial / Auditoría ──
export const HISTORIAL_INITIAL = [
  { id: 1, tipo: "login", msg: "Sistema Dorado Club iniciado", fecha: "2026-06-15", hora: "00:00", userId: 1, ip: "127.0.0.1" },
];

// ── Notificaciones ──
export const NOTIF_INITIAL = [
  { id: 1, userId: 1, msg: "¡Bienvenido al sistema Dorado Club!", fecha: "2026-06-15", leida: false },
  { id: 2, userId: 2, msg: "¡Bienvenido al sistema Dorado Club!", fecha: "2026-06-15", leida: false },
];

// ── Storage helpers ──
export function initStorage() {
  if (!sessionStorage.getItem("dc_users"))      sessionStorage.setItem("dc_users",      JSON.stringify(USERS_INITIAL));
  if (!sessionStorage.getItem("dc_tareas"))     sessionStorage.setItem("dc_tareas",     JSON.stringify(TAREAS_INITIAL));
  if (!sessionStorage.getItem("dc_reportes"))   sessionStorage.setItem("dc_reportes",   JSON.stringify(REPORTES_INITIAL));
  if (!sessionStorage.getItem("dc_plantillas")) sessionStorage.setItem("dc_plantillas", JSON.stringify(PLANTILLAS_INITIAL));
  if (!sessionStorage.getItem("dc_anuncios"))   sessionStorage.setItem("dc_anuncios",   JSON.stringify(ANUNCIOS_INITIAL));
  if (!sessionStorage.getItem("dc_historial"))  sessionStorage.setItem("dc_historial",  JSON.stringify(HISTORIAL_INITIAL));
  if (!sessionStorage.getItem("dc_notifs"))     sessionStorage.setItem("dc_notifs",     JSON.stringify(NOTIF_INITIAL));
  if (!sessionStorage.getItem("dc_etiquetas"))  sessionStorage.setItem("dc_etiquetas",  JSON.stringify(ETIQUETAS_INITIAL));
  if (!sessionStorage.getItem("dc_roles"))      sessionStorage.setItem("dc_roles",      JSON.stringify([]));
  if (!sessionStorage.getItem("dc_theme"))      sessionStorage.setItem("dc_theme",      "dark");
}

export function getUsers()      { return JSON.parse(sessionStorage.getItem("dc_users")      || "[]"); }
export function getTareas()     { return JSON.parse(sessionStorage.getItem("dc_tareas")     || "[]"); }
export function getReportes()   { return JSON.parse(sessionStorage.getItem("dc_reportes")   || "[]"); }
export function getPlantillas() { return JSON.parse(sessionStorage.getItem("dc_plantillas") || "[]"); }
export function getAnuncios()   { return JSON.parse(sessionStorage.getItem("dc_anuncios")   || "[]"); }
export function getHistorial()  { return JSON.parse(sessionStorage.getItem("dc_historial")  || "[]"); }
export function getNotifs()     { return JSON.parse(sessionStorage.getItem("dc_notifs")     || "[]"); }
export function getEtiquetas()  { return JSON.parse(sessionStorage.getItem("dc_etiquetas")  || "[]"); }
export function getTheme()      { return sessionStorage.getItem("dc_theme") || "dark"; }

export function saveUsers(d)      { sessionStorage.setItem("dc_users",      JSON.stringify(d)); }
export function saveTareas(d)     { sessionStorage.setItem("dc_tareas",     JSON.stringify(d)); }
export function saveReportes(d)   { sessionStorage.setItem("dc_reportes",   JSON.stringify(d)); }
export function savePlantillas(d) { sessionStorage.setItem("dc_plantillas", JSON.stringify(d)); }
export function saveAnuncios(d)   { sessionStorage.setItem("dc_anuncios",   JSON.stringify(d)); }
export function saveHistorial(d)  { sessionStorage.setItem("dc_historial",  JSON.stringify(d)); }
export function saveNotifs(d)     { sessionStorage.setItem("dc_notifs",     JSON.stringify(d)); }
export function saveEtiquetas(d)  { sessionStorage.setItem("dc_etiquetas",  JSON.stringify(d)); }
export function saveTheme(t)      { sessionStorage.setItem("dc_theme", t); }

// ── Permisos ──
export function resolvePerms(u) {
  const roles = getRoles();
  const base  = roles[u.rolKey]?.defaultPerms || { verTodos: false, crearTareas: false, eliminarTareas: false };
  const ind   = u.perms || {};
  return {
    verTodos:       ind.verTodos       !== undefined ? ind.verTodos       : base.verTodos,
    crearTareas:    ind.crearTareas    !== undefined ? ind.crearTareas    : base.crearTareas,
    eliminarTareas: ind.eliminarTareas !== undefined ? ind.eliminarTareas : base.eliminarTareas,
    canManageUsers: roles[u.rolKey]?.canManageUsers || false,
    canSeeAll:      roles[u.rolKey]?.canSeeAll      || false,
    canAssignTo:    roles[u.rolKey]?.canAssignTo    || "none",
  };
}

// ── Helpers ──
export function addHistorial(msg, userId, tipo = "accion") {
  const h    = getHistorial();
  const now  = new Date();
  const hora = now.toTimeString().slice(0, 5);
  const fecha= now.toISOString().split("T")[0];
  saveHistorial([{ id: Date.now(), tipo, msg, fecha, hora, userId }, ...h].slice(0, 200));
}

export function addNotif(userId, msg) {
  const n = getNotifs();
  saveNotifs([{ id: Date.now(), userId, msg, fecha: new Date().toISOString().split("T")[0], leida: false }, ...n]);
}

export function getUnreadCount(userId) {
  return getNotifs().filter(n => n.userId === userId && !n.leida).length;
}

export function getTareaUrgencia(fechaStr) {
  if (!fechaStr) return null;
  const hoy    = new Date(); hoy.setHours(0,0,0,0);
  const limite = new Date(fechaStr + "T00:00:00");
  return Math.round((limite - hoy) / 86400000);
}

// ── Backup / Restauración ──
export function exportBackup() {
  const data = {
    version: 4,
    fecha: new Date().toISOString(),
    users:      getUsers(),
    tareas:     getTareas(),
    reportes:   getReportes(),
    plantillas: getPlantillas(),
    anuncios:   getAnuncios(),
    historial:  getHistorial(),
    etiquetas:  getEtiquetas(),
    roles:      getCustomRoles(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `dorado-club-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.users)      saveUsers(data.users);
    if (data.tareas)     saveTareas(data.tareas);
    if (data.reportes)   saveReportes(data.reportes);
    if (data.plantillas) savePlantillas(data.plantillas);
    if (data.anuncios)   saveAnuncios(data.anuncios);
    if (data.historial)  saveHistorial(data.historial);
    if (data.etiquetas)  saveEtiquetas(data.etiquetas);
    if (data.roles)      saveCustomRoles(data.roles);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

export function nextFechaRecurrencia(fechaStr, tipo) {
  if (!fechaStr || !tipo) return null;
  const d = new Date(fechaStr + "T00:00:00");
  if (tipo === "semanal")   d.setDate(d.getDate() + 7);
  if (tipo === "quincenal") d.setDate(d.getDate() + 15);
  if (tipo === "mensual")   d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export function getStatsUsuario(userId) {
  const tareas   = getTareas();
  const reportes = getReportes();
  const completadas  = tareas.filter(t => t.asignadoA.includes(userId) && t.estado === "completada").length;
  const pendientes   = tareas.filter(t => t.asignadoA.includes(userId) && t.estado === "pendiente").length;
  const enProceso    = tareas.filter(t => t.asignadoA.includes(userId) && t.estado === "en_proceso").length;
  const total        = tareas.filter(t => t.asignadoA.includes(userId)).length;
  const misReportes  = reportes.filter(r => r.autorId === userId).length;
  const aprobados    = reportes.filter(r => r.autorId === userId && r.estado === "aprobado").length;
  const tasa         = total > 0 ? Math.round((completadas / total) * 100) : 0;
  return { completadas, pendientes, enProceso, total, misReportes, aprobados, tasa };
}
