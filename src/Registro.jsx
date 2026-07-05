import { useMemo, useState } from 'react';
import {
  TYPES, TYPE_LIST, uid, todayISO, toUSD, fmt, fmtUSD, findMethod,
} from './finance.js';
import { Icon } from './ui.jsx';

export default function Registro({ categories, records, setRecords, methods }) {
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState('');
  const [method, setMethod] = useState(methods[0]?.id || '');
  const [monto, setMonto] = useState('');
  const [tasa, setTasa] = useState('');
  const [nota, setNota] = useState('');
  const [flash, setFlash] = useState(false);

  const meth = findMethod(methods, method);
  const isFixed = meth?.fixedRate === 1;
  const effRate = isFixed ? 1 : Number(tasa) || 0;
  const montoNum = Number(monto) || 0;
  const montoUSD = useMemo(
    () => toUSD(montoNum, effRate, method, methods),
    [montoNum, effRate, method, methods]
  );

  const cat = categories.find((c) => c.id === categoryId);
  const canSave =
    cat && meth && montoNum > 0 && (isFixed || effRate > 0) && date;

  const save = (e) => {
    e.preventDefault();
    if (!canSave) return;
    const rec = {
      id: uid(),
      date,
      categoryId: cat.id,
      categoryName: cat.name,
      type: cat.type,
      method,
      monto: montoNum,
      tasa: isFixed ? 1 : effRate,
      montoUSD,
      nota: nota.trim(),
      createdAt: Date.now(),
    };
    setRecords([rec, ...records]);
    // Reset suave: conserva fecha, método y tasa para registros consecutivos
    setMonto('');
    setCategoryId('');
    setNota('');
    setFlash(true);
    setTimeout(() => setFlash(false), 1400);
  };

  const recent = records.slice(0, 6);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Registro</h1>
        <p>Registro rápido de tus movimientos.</p>
      </header>

      <section className="card">
        <form onSubmit={save} className="form">
          <label className="field">
            <span>Fecha</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="field">
            <span>Categoría</span>
            {categories.length === 0 ? (
              <p className="hint warn">Crea categorías en la pestaña Configuración.</p>
            ) : (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Selecciona una categoría…</option>
                {TYPE_LIST.map((tp) => {
                  const opts = categories.filter((c) => c.type === tp.id);
                  if (!opts.length) return null;
                  return (
                    <optgroup key={tp.id} label={tp.label}>
                      {opts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}
          </label>

          <label className="field">
            <span>Método de pago</span>
            {methods.length === 0 ? (
              <p className="hint warn">Crea métodos de pago en la pestaña Configuración.</p>
            ) : (
              <div className="method-grid">
                {methods.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={`method-chip ${method === m.id ? 'active' : ''}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <strong>{m.label}</strong>
                    <small>{m.note}</small>
                  </button>
                ))}
              </div>
            )}
          </label>

          {meth && (
            <div className="field-row">
              <label className="field">
                <span>Monto ({meth.short})</span>
                <input
                  type="number" inputMode="decimal" min="0" step="any"
                  value={monto} onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                />
              </label>

              <label className="field">
                <span>Tasa</span>
                <input
                  type="number" inputMode="decimal" min="0" step="any"
                  value={isFixed ? 1 : tasa}
                  onChange={(e) => setTasa(e.target.value)}
                  placeholder={isFixed ? '1' : `${meth.short} por USD`}
                  disabled={isFixed}
                />
              </label>
            </div>
          )}

          <label className="field">
            <span>Nota (opcional)</span>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. Pago de Juan, compra del mercado…"
              maxLength={140}
            />
          </label>

          <div className="usd-preview">
            <span>Monto en USD</span>
            <strong>{fmtUSD(montoUSD)}</strong>
          </div>

          <button type="submit" className="btn-primary" disabled={!canSave}>
            {flash ? (<><Icon.check width={18} height={18} /> ¡Registrado!</>)
                   : (<><Icon.plus width={18} height={18} /> Guardar registro</>)}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Últimos registros</h2>
        {recent.length === 0 ? (
          <p className="empty">Aún no has registrado movimientos.</p>
        ) : (
          <ul className="rec-list">
            {recent.map((r) => {
              const t = TYPES[r.type];
              const m = findMethod(methods, r.method);
              return (
                <li key={r.id} className="rec-item">
                  <span className="rec-bar" style={{ background: t?.color || 'var(--text-dim)' }} />
                  <div className="rec-main">
                    <div className="rec-top">
                      <strong>{r.categoryName}</strong>
                      <span className="rec-usd" style={{ color: t?.color }}>
                        {t?.sign > 0 ? '+' : '−'}{fmtUSD(r.montoUSD)}
                      </span>
                    </div>
                    <div className="rec-sub">
                      <span>{r.date}</span>
                      <span className="rec-method">
                        {m ? `${m.label} · ${m.symbol}${fmt(r.monto, m.currency)}` : 'Método eliminado'}
                      </span>
                    </div>
                    {r.nota && <p className="rec-note">{r.nota}</p>}
                  </div>
                  <button
                    className="icon-btn danger"
                    onClick={() => setRecords(records.filter((x) => x.id !== r.id))}
                    aria-label="Eliminar"
                  >
                    <Icon.trash width={16} height={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
