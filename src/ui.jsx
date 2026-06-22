// Componentes de interfaz reutilizables: iconos y gráficos SVG ligeros
/* eslint-disable react-refresh/only-export-components */

// --- Iconos (SVG inline, sin dependencias) --------------------------------
const I = (path, props = {}) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" {...props}>{path}</svg>
);

export const Icon = {
  settings: (p) => I(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>, p),
  plus: (p) => I(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, p),
  chart: (p) => I(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>, p),
  trash: (p) => I(<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>, p),
  check: (p) => I(<polyline points="20 6 9 17 4 12" />, p),
  sun: (p) => I(<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.2" y1="4.2" x2="5.6" y2="5.6" /><line x1="18.4" y1="18.4" x2="19.8" y2="19.8" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.2" y1="19.8" x2="5.6" y2="18.4" /><line x1="18.4" y1="5.6" x2="19.8" y2="4.2" /></>, p),
  moon: (p) => I(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />, p),
  wallet: (p) => I(<><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>, p),
  arrowUp: (p) => I(<><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>, p),
  arrowDown: (p) => I(<><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>, p),
  download: (p) => I(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>, p),
  sheet: (p) => I(<><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="12" y1="3" x2="12" y2="21" /></>, p),
};

// --- Gráfico de barras comparativo ----------------------------------------
export function BarCompare({ data }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <div className="bar-track">
            <div className="bar-fill"
              style={{ width: `${(Math.abs(d.value) / max) * 100}%`, background: d.color }} />
          </div>
          <div className="bar-meta">
            <span>{d.label}</span>
            <strong style={{ color: d.color }}>{d.display}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Gráfico de dona (distribución) ---------------------------------------
const DONUT_COLORS = ['#3b82f6', '#16c784', '#f0a020', '#ea3943', '#a855f7', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#64748b'];

export function Donut({ data, formatValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return <p className="empty-mini">Sin datos para mostrar.</p>;
  const R = 60, C = 2 * Math.PI * R;
  const slices = [];
  let acc = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const d = data[i];
    const frac = d.value / total;
    slices.push({
      ...d,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      dash: frac * C,
      offset: -acc * C,
      pct: frac * 100,
    });
    acc += frac;
  }
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" className="donut">
        <g transform="rotate(-90 80 80)">
          {slices.map((s, i) => (
            <circle key={i} cx="80" cy="80" r={R} fill="none"
              stroke={s.color} strokeWidth="22"
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={s.offset} />
          ))}
        </g>
        <text x="80" y="74" textAnchor="middle" className="donut-c1">Total</text>
        <text x="80" y="94" textAnchor="middle" className="donut-c2">
          {formatValue ? formatValue(total) : total}
        </text>
      </svg>
      <ul className="legend">
        {slices.map((s, i) => (
          <li key={i}>
            <span className="dot" style={{ background: s.color }} />
            <span className="lg-name">{s.name}</span>
            <span className="lg-val">{formatValue ? formatValue(s.value) : s.value}</span>
            <span className="lg-pct">{s.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Gráfico de columnas (evolución mensual) ------------------------------
export function ColumnChart({ series, formatValue }) {
  if (!series.length) return <p className="empty-mini">Aún no hay movimientos por mes.</p>;
  const max = Math.max(1, ...series.map((s) => Math.max(s.ingreso, s.salida)));
  return (
    <div className="cols">
      <div className="cols-plot">
        {series.map((s) => (
          <div className="col-group" key={s.key} title={`Neto: ${formatValue(s.neto)}`}>
            <div className="col-bars">
              <div className="col col-in" style={{ height: `${(s.ingreso / max) * 100}%` }} />
              <div className="col col-out" style={{ height: `${(s.salida / max) * 100}%` }} />
            </div>
            <span className="col-label">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="cols-legend">
        <span><i style={{ background: 'var(--green)' }} /> Ingresos</span>
        <span><i style={{ background: 'var(--red)' }} /> Salidas</span>
      </div>
    </div>
  );
}
