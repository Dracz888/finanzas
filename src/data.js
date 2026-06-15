// ═══════════════════════════════════════════════════════════
//  DORADO CLUB — Capa de presentación (constantes + caché)
//  Los datos reales viven en el backend (ver src/api.js).
// ═══════════════════════════════════════════════════════════

// ── Métodos de pago y su moneda ──
// Si el método es en dólares (Zelle / Dólares) la tasa es siempre 1.
export const METODOS_PAGO = [
  { id: "pago_movil",  label: "Pago Móvil",  moneda: "Bs",  esUSD: false },
  { id: "zelle",       label: "Zelle",       moneda: "USD", esUSD: true  },
  { id: "dolares",     label: "Dólares",     moneda: "USD", esUSD: true  },
  { id: "bancolombia", label: "Bancolombia", moneda: "COP", esUSD: false },
  { id: "cop",         label: "COP",         moneda: "COP", esUSD: false },
];

export function metodoLabel(id) { return (METODOS_PAGO.find(m => m.id === id) || {}).label || id; }

// Monto en USD = monto / tasa (tasa 1 para métodos en dólares).
export function calcUSD(monto, metodoId, tasa) {
  const m = METODOS_PAGO.find(x => x.id === metodoId);
  const n = parseFloat(monto) || 0;
  if (!m) return 0;
  if (m.esUSD) return n;
  const t = parseFloat(tasa) || 0;
  return t > 0 ? n / t : 0;
}

export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export function mesDe(fecha) { const d = new Date(fecha + 'T00:00:00'); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; }
export function mesActual() { const d = new Date(); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; }

// ── Catálogo de módulos por departamento ──
export const MODULOS = {
  consolidado:  { label: "Consolidado General",     icon: "📈", desc: "Ingresos y egresos de todas las gerencias (solo lectura)." },
  egresos:      { label: "Egresos / Gastos",        icon: "💸", desc: "Registro de gastos propios de administración." },
  campanas:     { label: "Campañas y Publicidad",   icon: "📣", desc: "Registro de gastos de campañas y publicidad." },
  alquileres:   { label: "Alquiler de Locales",     icon: "🏢", desc: "Ingresos por alquiler de locales del Club." },
  alicuotas:    { label: "Alícuotas",               icon: "🧾", desc: "Cobro a locales según consumo (alícuota por %)." },
  afiliaciones: { label: "Afiliaciones",            icon: "🎟️", desc: "Ingresos por afiliación y planes del gimnasio." },
  entrenadores: { label: "Entrenadores",            icon: "🏋️", desc: "Entrenadores y afiliados que entrenan ($10 c/u)." },
  inventario:   { label: "Inventario",              icon: "📦", desc: "Compras, ventas y control de stock." },
  reservas:     { label: "Reservas",                icon: "📅", desc: "Reservas de canchas y tarifas." },
  clientes:     { label: "Clientes Fijos / Academia", icon: "🤝", desc: "Clientes fijos y academia con % de descuento." },
  personal:     { label: "Personal del Área",       icon: "👥", desc: "Gestión del personal del departamento." },
  reportes:     { label: "Reportes",                icon: "📊", desc: "Ingresos, gastos, novedades, mantenimiento y consolidados." },
};

// ── Departamentos del Club ──
export const DEPARTAMENTOS = {
  ejecutivo:      { label: "Ejecutivo",        icon: "♛",  color: "#C9A227", modulos: ["consolidado", "reportes"] },
  administracion: { label: "Administración",   icon: "📊", color: "#60a5fa", modulos: ["consolidado", "egresos", "reportes"] },
  mercadeo:       { label: "Mercadeo",         icon: "📣", color: "#a78bfa", modulos: ["campanas", "reportes"] },
  rrhh:           { label: "Recursos Humanos", icon: "👥", color: "#ec4899", modulos: ["personal", "reportes"] },
  inmobiliaria:   { label: "Inmobiliaria",     icon: "🏢", color: "#14b8a6", modulos: ["alquileres", "reportes"] },
  condominio:     { label: "Condominio",       icon: "🏘️", color: "#f97316", modulos: ["alicuotas", "reportes"] },
  komplex_gym:    { label: "Komplex Gym",      icon: "🏋️", color: "#D32F2F", modulos: ["afiliaciones", "entrenadores", "inventario", "reportes"] },
  dfc:            { label: "DFC",              icon: "⚽", color: "#22c55e", modulos: ["reservas", "clientes", "inventario", "reportes"] },
  sport_bar:      { label: "Sport Bar",        icon: "🍻", color: "#f59e0b", modulos: ["inventario", "reportes"] },
};

// ── Cargos: fallback local + caché cargado desde la API ──
export const SYSTEM_ROLES = {
  GG:   { key: "GG",   label: "Gerente General",        color: "#C9A227", departamento: "ejecutivo",      nivel: "Ejecutivo",      canManageUsers: true,  canSeeConsolidado: true,  canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  SI:   { key: "SI",   label: "Súper Intendente",       color: "#E0C24A", departamento: "ejecutivo",      nivel: "Ejecutivo",      canManageUsers: true,  canSeeConsolidado: true,  canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  ADM:  { key: "ADM",  label: "Gerente Administrativo", color: "#60a5fa", departamento: "administracion", nivel: "Administración", canManageUsers: false, canSeeConsolidado: true,  canRegistrarIngresos: false, canRegistrarEgresos: true,  system: true },
  MKT:  { key: "MKT",  label: "Gerente de Mercadeo",    color: "#a78bfa", departamento: "mercadeo",       nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: false, canRegistrarEgresos: true,  system: true },
  RRHH: { key: "RRHH", label: "Gerente de RRHH",        color: "#ec4899", departamento: "rrhh",           nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: false, canRegistrarEgresos: true,  system: true },
  INM:  { key: "INM",  label: "Gerente Inmobiliaria",   color: "#14b8a6", departamento: "inmobiliaria",   nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  CON:  { key: "CON",  label: "Gerente de Condominio",  color: "#f97316", departamento: "condominio",     nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  KGYM: { key: "KGYM", label: "Gerente de Komplex Gym", color: "#D32F2F", departamento: "komplex_gym",    nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  DFC:  { key: "DFC",  label: "Gerente de DFC",         color: "#22c55e", departamento: "dfc",            nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
  SB:   { key: "SB",   label: "Gerente de Sport Bar",   color: "#f59e0b", departamento: "sport_bar",      nivel: "Gerencia",       canManageUsers: false, canSeeConsolidado: false, canRegistrarIngresos: true,  canRegistrarEgresos: true,  system: true },
};

let _cargos = { ...SYSTEM_ROLES };
export function setCargos(list) {
  const next = {};
  for (const c of list) next[c.key] = c;
  _cargos = Object.keys(next).length ? next : { ...SYSTEM_ROLES };
}
export function getRoles() { return _cargos; }

// ── Permisos efectivos (calculados desde el caché de cargos) ──
export function resolvePerms(u) {
  if (!u) return {};
  const r = getRoles()[u.rolKey] || {};
  const ind = u.perms || {};
  const pick = (k) => (ind[k] !== undefined ? ind[k] : (r[k] || false));
  return {
    canManageUsers:       r.canManageUsers || false,
    canSeeConsolidado:    pick("canSeeConsolidado"),
    canRegistrarIngresos: pick("canRegistrarIngresos"),
    canRegistrarEgresos:  pick("canRegistrarEgresos"),
    departamento:         r.departamento,
    nivel:                r.nivel,
    color:                r.color,
  };
}

// ¿Puede ver / escribir en Komplex Gym? (espejo de las reglas del backend)
export function puedeLeerKG(perms)    { return perms.departamento === "komplex_gym" || perms.canSeeConsolidado || perms.canManageUsers; }
export function puedeEscribirKG(perms){ return (perms.departamento === "komplex_gym" && perms.canRegistrarIngresos) || perms.departamento === "ejecutivo" || perms.canManageUsers; }

// ── Tema (preferencia local) ──
export function getTheme()  { return localStorage.getItem("dc_theme") || "dark"; }
export function saveTheme(t){ localStorage.setItem("dc_theme", t); }
