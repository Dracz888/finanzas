import { useMemo, useState } from 'react';
import {
  TYPES, TYPE_LIST, toUSD, fmt, fmtUSD, findMethod,
} from './finance.js';
import { Icon } from './ui.jsx';

function toDraft(r) {
  return {
    date: r.date,
    categoryId: r.categoryId,
    method: r.method,
    monto: String(r.monto ?? ''),
    tasa: String(r.tasa ?? ''),
    nota: r.nota || '',
  };
}

export default function Historial({ categories, records, setRecords, methods }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (r.categoryName || '').toLowerCase().includes(q) ||
        (r.nota || '').toLowerCase().includes(q)
      );
    });
  }, [records, query, typeFilter]);

  const startEdit = (r) => {
    setEditingId(r.id);
    setDraft(toDraft(r));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const remove = (id) => {
    if (window.confirm('¿Eliminar este registro?')) {
      setRecords(records.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  const meth = draft ? findMethod(methods, draft.method) : null;
  const isFixed = meth?.fixedRate === 1;
  const cat = draft ? categories.find((c) => c.id === draft.categoryId) : null;
  const montoNum = draft ? Number(draft.monto) || 0 : 0;
  const effRate = isFixed ? 1 : Number(draft?.tasa) || 0;
  const canSave = draft && cat && meth && montoNum > 0 && (isFixed || effRate > 0) && draft.date;

  const save = (record) => {
    if (!canSave) return;
    const montoUSD = toUSD(montoNum, effRate, draft.method, methods);
    const updated = {
      ...record,
      date: draft.date,
      categoryId: cat.id,
      categoryName: cat.name,
      type: cat.type,
      method: draft.method,
      monto: montoNum,
      tasa: isFixed ? 1 : effRate,
      montoUSD,
      nota: draft.nota.trim(),
    };
    setRecords(records.map((r) => (r.id === record.id ? updated : r)));
    cancelEdit();
  };

  if (records.length === 0) {
    return (
      <div className="view">
        <header className="view-head"><h1>Historial</h1></header>
        <section className="card">
          <p className="empty">Aún no has registrado movimientos.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Historial</h1>
        <p>Revisa y modifica tus registros ({records.length}).</p>
      </header>

      <section className="card">
        <div className="form">
          <label className="field">
            <span>Buscar</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Categoría o nota…"
            />
          </label>
          <div className="period-bar">
            <button className={typeFilter === 'all' ? 'active' : ''} onClick={() => setTypeFilter('all')}>
              Todos
            </button>
            {TYPE_LIST.map((t) => (
              <button
                key={t.id}
                className={typeFilter === t.id ? 'active' : ''}
                onClick={() => setTypeFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        {filtered.length === 0 ? (
          <p className="empty">No hay registros que coincidan con la búsqueda.</p>
        ) : (
          <ul className="rec-list">
            {filtered.map((r) => {
              if (editingId === r.id) {
                return (
                  <li key={r.id} className="rec-edit">
                    <label className="field">
                      <span>Fecha</span>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      />
                    </label>

                    <label className="field">
                      <span>Categoría</span>
                      <select
                        value={draft.categoryId}
                        onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                      >
                        <option value="">Selecciona una categoría…</option>
                        {!categories.some((c) => c.id === draft.categoryId) && (
                          <option value={draft.categoryId} disabled>
                            {r.categoryName} (eliminada)
                          </option>
                        )}
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
                    </label>

                    <label className="field">
                      <span>Método de pago</span>
                      <div className="method-grid">
                        {methods.map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            className={`method-chip ${draft.method === m.id ? 'active' : ''}`}
                            onClick={() => setDraft({ ...draft, method: m.id })}
                          >
                            <strong>{m.label}</strong>
                            <small>{m.note}</small>
                          </button>
                        ))}
                      </div>
                    </label>

                    {meth && (
                      <div className="field-row">
                        <label className="field">
                          <span>Monto ({meth.short})</span>
                          <input
                            type="number" inputMode="decimal" min="0" step="any"
                            value={draft.monto}
                            onChange={(e) => setDraft({ ...draft, monto: e.target.value })}
                          />
                        </label>
                        <label className="field">
                          <span>Tasa</span>
                          <input
                            type="number" inputMode="decimal" min="0" step="any"
                            value={isFixed ? 1 : draft.tasa}
                            onChange={(e) => setDraft({ ...draft, tasa: e.target.value })}
                            disabled={isFixed}
                          />
                        </label>
                      </div>
                    )}

                    <label className="field">
                      <span>Nota (opcional)</span>
                      <input
                        type="text"
                        value={draft.nota}
                        onChange={(e) => setDraft({ ...draft, nota: e.target.value })}
                        maxLength={140}
                      />
                    </label>

                    <div className="rec-edit-actions">
                      <button type="button" className="btn-secondary" onClick={cancelEdit}>
                        <Icon.x width={18} height={18} /> Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!canSave}
                        onClick={() => save(r)}
                      >
                        <Icon.check width={18} height={18} /> Guardar
                      </button>
                    </div>
                  </li>
                );
              }

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
                  <div className="rec-actions">
                    <button className="icon-btn" onClick={() => startEdit(r)} aria-label="Editar">
                      <Icon.edit width={16} height={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => remove(r.id)} aria-label="Eliminar">
                      <Icon.trash width={16} height={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
