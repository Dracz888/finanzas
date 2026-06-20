import { useMemo, useState } from 'react';
import {
  TYPES, fmt, fmtUSD, monthKey, monthLabel,
  filterByPeriod, totalsByType, balancesByMethod, netByMethodUSD,
  outflowByCategory, monthlySeries,
} from './finance.js';
import { Icon, BarCompare, Donut, ColumnChart } from './ui.jsx';

export default function Gestion({ records }) {
  const [period, setPeriod] = useState('all');

  // Meses disponibles para el filtro
  const months = useMemo(() => {
    const set = new Set(records.map((r) => monthKey(r.date)).filter(Boolean));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filtered = useMemo(() => filterByPeriod(records, period), [records, period]);

  const totals = useMemo(() => totalsByType(filtered), [filtered]);
  const balances = useMemo(() => balancesByMethod(filtered), [filtered]);
  const netUSD = useMemo(() => netByMethodUSD(filtered), [filtered]);
  const outflow = useMemo(() => outflowByCategory(filtered), [filtered]);
  const series = useMemo(
    () => monthlySeries(records).map((s) => ({ ...s, label: monthLabel(s.key) })),
    [records]
  );

  const barData = [
    { label: 'Ingresos', value: totals.ingreso, color: TYPES.ingreso.color, display: fmtUSD(totals.ingreso) },
    { label: 'Egresos',  value: totals.egreso,  color: TYPES.egreso.color,  display: fmtUSD(totals.egreso) },
    { label: 'Gastos',   value: totals.gasto,   color: TYPES.gasto.color,   display: fmtUSD(totals.gasto) },
  ];

  const netColor = totals.neto >= 0 ? TYPES.ingreso.color : TYPES.egreso.color;

  if (records.length === 0) {
    return (
      <div className="view">
        <header className="view-head"><h1>Gestión</h1></header>
        <section className="card">
          <p className="empty">Registra movimientos para ver aquí tus indicadores y gráficos.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Gestión</h1>
        <p>Resumen financiero e indicadores.</p>
      </header>

      <div className="period-bar">
        <button className={period === 'all' ? 'active' : ''} onClick={() => setPeriod('all')}>Todo</button>
        <button className={period === 'thisMonth' ? 'active' : ''} onClick={() => setPeriod('thisMonth')}>Este mes</button>
        <button className={period === 'lastMonth' ? 'active' : ''} onClick={() => setPeriod('lastMonth')}>Mes ant.</button>
        <select
          className={months.includes(period) ? 'active' : ''}
          value={months.includes(period) ? period : ''}
          onChange={(e) => e.target.value && setPeriod(e.target.value)}
        >
          <option value="">Mes…</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      {/* Resultado neto destacado */}
      <section className="net-hero card">
        <span className="net-label">Resultado Neto</span>
        <strong className="net-value" style={{ color: netColor }}>{fmtUSD(totals.neto)}</strong>
        <span className="net-sub">{totals.neto >= 0 ? 'Superávit' : 'Déficit'} en el periodo</span>
      </section>

      {/* Indicadores principales */}
      <div className="kpi-grid">
        <Kpi label="Ingresos" value={fmtUSD(totals.ingreso)} color={TYPES.ingreso.color} icon={<Icon.arrowUp width={16} height={16} />} />
        <Kpi label="Egresos"  value={fmtUSD(totals.egreso)}  color={TYPES.egreso.color}  icon={<Icon.arrowDown width={16} height={16} />} />
        <Kpi label="Gastos"   value={fmtUSD(totals.gasto)}   color={TYPES.gasto.color}   icon={<Icon.arrowDown width={16} height={16} />} />
      </div>

      {/* Disponible por método / moneda */}
      <section className="card">
        <h2 className="card-title"><Icon.wallet width={18} height={18} /> Disponible por moneda</h2>
        <ul className="balance-list">
          {balances.map((m) => (
            <li key={m.id} className="balance-item">
              <div className="bl-left">
                <strong>{m.label}</strong>
                <small>{m.note} · {m.short}</small>
              </div>
              <div className="bl-right">
                <span className={`bl-amount ${m.balance < 0 ? 'neg' : ''}`}>
                  {m.symbol}{fmt(m.balance, m.currency)}
                </span>
                <small>≈ {fmtUSD(netUSD[m.id] || 0)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Comparativo Ingreso vs Egreso vs Gasto */}
      <section className="card">
        <h2 className="card-title"><Icon.chart width={18} height={18} /> Ingresos vs Salidas</h2>
        <BarCompare data={barData} />
      </section>

      {/* Distribución de salidas por categoría */}
      <section className="card">
        <h2 className="card-title">Salidas por categoría</h2>
        <Donut data={outflow} formatValue={fmtUSD} />
      </section>

      {/* Evolución mensual */}
      <section className="card">
        <h2 className="card-title">Evolución mensual</h2>
        <ColumnChart series={series} formatValue={fmtUSD} />
      </section>
    </div>
  );
}

function Kpi({ label, value, color, icon }) {
  return (
    <div className="kpi" style={{ '--kc': color }}>
      <span className="kpi-icon" style={{ color }}>{icon}</span>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
    </div>
  );
}
