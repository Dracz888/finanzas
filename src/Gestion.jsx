import { useMemo, useState } from 'react';
import {
  TYPES, fmt, fmtUSD, monthKey, monthLabel,
  filterByPeriod, totalsByType, balancesByMethod, netByMethodUSD,
  outflowByCategory, monthlySeries, totalsByPrestamo,
} from './finance.js';
import { Icon, BarCompare, Donut, ColumnChart } from './ui.jsx';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function Gestion({ records, methods }) {
  const [period, setPeriod] = useState('all');

  // Años disponibles para el filtro
  const years = useMemo(() => {
    const set = new Set(records.map((r) => monthKey(r.date).slice(0, 4)).filter(Boolean));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Mes y año actualmente seleccionados (derivados del periodo activo)
  const monthYearMatch = /^(\d{4})-(\d{2})$/.exec(period);
  const yearOnlyMatch = /^(\d{4})$/.exec(period);
  const monthOnlyMatch = /^m-(\d{2})$/.exec(period);
  const selYear = monthYearMatch?.[1] ?? yearOnlyMatch?.[1] ?? '';
  const selMonth = monthYearMatch?.[2] ?? monthOnlyMatch?.[1] ?? '';

  const applyMonthYear = (month, year) => {
    if (month && year) setPeriod(`${year}-${month}`);
    else if (year) setPeriod(year);
    else if (month) setPeriod(`m-${month}`);
    else setPeriod('all');
  };

  const filtered = useMemo(() => filterByPeriod(records, period), [records, period]);

  const totals = useMemo(() => totalsByType(filtered), [filtered]);
  const balances = useMemo(() => balancesByMethod(filtered, methods), [filtered, methods]);
  const netUSD = useMemo(() => netByMethodUSD(filtered), [filtered]);
  const outflow = useMemo(() => outflowByCategory(filtered), [filtered]);
  const prestamo = useMemo(() => totalsByPrestamo(filtered), [filtered]);
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
      </div>
      <div className="period-bar">
        <select
          className={selMonth ? 'active' : ''}
          value={selMonth}
          onChange={(e) => applyMonthYear(e.target.value, selYear)}
        >
          <option value="">Mes…</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={String(i + 1).padStart(2, '0')}>{name}</option>
          ))}
        </select>
        <select
          className={selYear ? 'active' : ''}
          value={selYear}
          onChange={(e) => applyMonthYear(selMonth, e.target.value)}
        >
          <option value="">Año…</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
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

      {/* Préstamos y transferencias: no afectan el Resultado Neto */}
      {(prestamo.received > 0 || prestamo.given > 0) && (
        <section className="card">
          <h2 className="card-title"><Icon.swap width={18} height={18} /> Préstamos y Transferencias</h2>
          <ul className="balance-list">
            <li className="balance-item">
              <div className="bl-left"><strong>Recibido</strong></div>
              <div className="bl-right"><span className="bl-amount neutral">{fmtUSD(prestamo.received)}</span></div>
            </li>
            <li className="balance-item">
              <div className="bl-left"><strong>Otorgado</strong></div>
              <div className="bl-right"><span className="bl-amount neutral">{fmtUSD(prestamo.given)}</span></div>
            </li>
          </ul>
          {Math.abs(prestamo.neto) > 0.005 && (
            <p className={`prestamo-net ${prestamo.neto > 0 ? 'pos' : 'neg'}`}>
              {prestamo.neto > 0 ? 'Ganaste' : 'Perdiste'} {fmtUSD(Math.abs(prestamo.neto))} en préstamos/transferencias
            </p>
          )}
        </section>
      )}

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
