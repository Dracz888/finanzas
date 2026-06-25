// ============================================================
//  Núcleo financiero: constantes, persistencia y cálculos
// ============================================================

// --- Tipos de categoría ---------------------------------------------------
// "principal" son ingresos/egresos/gastos reales: entran en el Resultado Neto.
// "prestamo" son préstamos y transferencias (lo que entra se compensa con lo
// que sale): no afectan el Resultado Neto, tienen su propia tarjeta en Gestión.
export const TYPES = {
  ingreso:      { id: 'ingreso',      label: 'Ingreso',     color: '#16c784', sign: +1, group: 'principal' },
  egreso:       { id: 'egreso',       label: 'Egreso',      color: '#ea3943', sign: -1, group: 'principal' },
  gasto:        { id: 'gasto',        label: 'Gasto',       color: '#f0a020', sign: -1, group: 'principal' },
  prestamo_in:  { id: 'prestamo_in',  label: 'Préstamo +',  color: '#a855f7', sign: +1, group: 'prestamo' },
  prestamo_out: { id: 'prestamo_out', label: 'Préstamo −',  color: '#7c3aed', sign: -1, group: 'prestamo' },
};
export const TYPE_LIST = Object.values(TYPES);
export const PRINCIPAL_TYPES = TYPE_LIST.filter((t) => t.group === 'principal').map((t) => t.id);
export const PRESTAMO_TYPES = TYPE_LIST.filter((t) => t.group === 'prestamo').map((t) => t.id);

// --- Métodos de pago ------------------------------------------------------
// Cada método tiene su moneda nativa. Dólares y USDT son USD (tasa fija 1).
// Cop (efectivo) y Bancolombia (banco) son ambos pesos colombianos pero se
// rastrean por separado porque viven en lugares distintos.
// Los métodos son editables desde Configuración; esta lista es solo la
// semilla inicial con la que arranca una instalación nueva.
const SEED_METHODS = [
  { id: 'usd',         label: 'Dólares',     short: 'USD',  currency: 'USD', symbol: '$',   fixedRate: 1, note: 'Efectivo' },
  { id: 'usdt',        label: 'USDT',        short: 'USDT', currency: 'USD', symbol: '₮',   fixedRate: 1, note: 'Cripto' },
  { id: 'bs',          label: 'Bs',          short: 'Bs',   currency: 'VES', symbol: 'Bs',  fixedRate: null, note: 'Bolívares' },
  { id: 'cop',         label: 'Cop',         short: 'COP',  currency: 'COP', symbol: '$',   fixedRate: null, note: 'Efectivo' },
  { id: 'bancolombia', label: 'Bancolombia', short: 'Banco',currency: 'COP', symbol: '$',   fixedRate: null, note: 'Banco' },
];

export const findMethod = (methods, id) => methods.find((m) => m.id === id);

// --- Categorías de ejemplo (semilla inicial) ------------------------------
const SEED_CATEGORIES = [
  { id: 'c-salario',   name: 'Salario',        type: 'ingreso' },
  { id: 'c-ventas',    name: 'Ventas',         type: 'ingreso' },
  { id: 'c-comida',    name: 'Comida',         type: 'gasto'   },
  { id: 'c-transporte',name: 'Transporte',     type: 'gasto'   },
  { id: 'c-servicios', name: 'Servicios',      type: 'egreso'  },
  { id: 'c-compras',   name: 'Compras',        type: 'egreso'  },
];

// --- Persistencia (localStorage) -----------------------------------------
const KEYS = {
  categories: 'fin.categories',
  records:    'fin.records',
  theme:      'fin.theme',
  methods:    'fin.methods',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* lleno o privado */ }
}

export const store = {
  loadCategories: () => {
    const existing = read(KEYS.categories, null);
    if (existing) return existing;
    write(KEYS.categories, SEED_CATEGORIES);
    return SEED_CATEGORIES;
  },
  saveCategories: (c) => write(KEYS.categories, c),
  loadRecords:    () => read(KEYS.records, []),
  saveRecords:    (r) => write(KEYS.records, r),
  loadTheme:      () => read(KEYS.theme, 'dark'),
  saveTheme:      (t) => write(KEYS.theme, t),
  loadMethods:    () => {
    const existing = read(KEYS.methods, null);
    if (existing) return existing;
    write(KEYS.methods, SEED_METHODS);
    return SEED_METHODS;
  },
  saveMethods:    (m) => write(KEYS.methods, m),
};

// --- Utilidades -----------------------------------------------------------
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

// Monto en USD a partir del monto local y la tasa (unidades locales por 1 USD)
export const toUSD = (monto, tasa, methodId, methods) => {
  const m = findMethod(methods, methodId);
  if (m && m.fixedRate === 1) return monto;
  const t = Number(tasa);
  if (!t || t <= 0) return 0;
  return monto / t;
};

// Formato de moneda
export function fmt(amount, currency = 'USD', opts = {}) {
  const n = Number(amount) || 0;
  const decimals = opts.decimals ?? (currency === 'VES' || currency === 'COP' ? 0 : 2);
  try {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  } catch {
    return n.toFixed(decimals);
  }
}

export const fmtUSD = (n) => '$' + fmt(n, 'USD', { decimals: 2 });

// Etiqueta de mes a partir de fecha ISO (YYYY-MM)
export const monthKey = (iso) => (iso || '').slice(0, 7);
export function monthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${names[Number(m) - 1] || ''} ${y}`;
}

// ============================================================
//  Agregaciones para la pestaña de Gestión
// ============================================================

// Filtra registros por periodo:
//   'all' | 'thisMonth' | 'lastMonth' | 'YYYY-MM' (mes concreto) |
//   'YYYY' (año completo) | 'm-MM' (ese mes en cualquier año)
export function filterByPeriod(records, period) {
  if (!period || period === 'all') return records;
  const now = new Date();
  if (period === 'thisMonth') {
    const key = todayISO().slice(0, 7);
    return records.filter((r) => monthKey(r.date) === key);
  }
  if (period === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return records.filter((r) => monthKey(r.date) === key);
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    return records.filter((r) => monthKey(r.date) === period);
  }
  if (/^\d{4}$/.test(period)) {
    return records.filter((r) => monthKey(r.date).slice(0, 4) === period);
  }
  if (/^m-\d{2}$/.test(period)) {
    const mm = period.slice(2);
    return records.filter((r) => monthKey(r.date).slice(5, 7) === mm);
  }
  return records;
}

// Totales por tipo (en USD)
export function totalsByType(records) {
  const t = { ingreso: 0, egreso: 0, gasto: 0 };
  for (const r of records) {
    if (t[r.type] !== undefined) t[r.type] += Number(r.montoUSD) || 0;
  }
  t.neto = t.ingreso - t.egreso - t.gasto;
  return t;
}

// Disponible por método de pago (en su moneda nativa)
export function balancesByMethod(records, methods) {
  const map = {};
  for (const m of methods) map[m.id] = 0;
  for (const r of records) {
    const sign = TYPES[r.type]?.sign ?? 0;
    if (map[r.method] === undefined) map[r.method] = 0;
    map[r.method] += sign * (Number(r.monto) || 0);
  }
  return methods.map((m) => ({ ...m, balance: map[m.id] || 0 }));
}

// Disponible total en USD (suma de saldos convertidos)
export function netByMethodUSD(records) {
  const map = {};
  for (const r of records) {
    const sign = TYPES[r.type]?.sign ?? 0;
    map[r.method] = (map[r.method] || 0) + sign * (Number(r.montoUSD) || 0);
  }
  return map;
}

// Distribución de salidas (egreso + gasto) por categoría, en USD
// Excluye préstamos/transferencias: no son un gasto real.
export function outflowByCategory(records) {
  const map = {};
  for (const r of records) {
    if (r.type === 'ingreso' || PRESTAMO_TYPES.includes(r.type)) continue;
    const k = r.categoryName || 'Sin categoría';
    map[k] = (map[k] || 0) + (Number(r.montoUSD) || 0);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Evolución mensual (ingresos / salidas / neto en USD)
// Excluye préstamos/transferencias de la evolución de ingresos vs salidas.
export function monthlySeries(records) {
  const map = {};
  for (const r of records) {
    if (!PRINCIPAL_TYPES.includes(r.type)) continue;
    const k = monthKey(r.date);
    if (!k) continue;
    if (!map[k]) map[k] = { key: k, ingreso: 0, salida: 0 };
    const usd = Number(r.montoUSD) || 0;
    if (r.type === 'ingreso') map[k].ingreso += usd;
    else map[k].salida += usd;
  }
  return Object.values(map)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((x) => ({ ...x, neto: x.ingreso - x.salida }));
}

// Totales de préstamos y transferencias (en USD): lo recibido, lo dado y el
// resultado neto (positivo = ganaste, negativo = perdiste, 0 = se compensó).
export function totalsByPrestamo(records) {
  let received = 0, given = 0;
  for (const r of records) {
    if (r.type === 'prestamo_in') received += Number(r.montoUSD) || 0;
    else if (r.type === 'prestamo_out') given += Number(r.montoUSD) || 0;
  }
  return { received, given, neto: received - given };
}
