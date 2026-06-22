import { useState } from 'react';
import { TYPE_LIST, uid } from './finance.js';
import { exportJSON, exportXLSX } from './export.js';
import { Icon } from './ui.jsx';

export default function Configuracion({ categories, setCategories, records }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('ingreso');

  const add = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const dup = categories.some(
      (c) => c.name.toLowerCase() === n.toLowerCase() && c.type === type
    );
    if (dup) return;
    setCategories([{ id: uid(), name: n, type }, ...categories]);
    setName('');
  };

  const remove = (id) => {
    const used = records.some((r) => r.categoryId === id);
    const msg = used
      ? 'Esta categoría tiene registros asociados. ¿Eliminarla de todas formas? Los registros se conservarán.'
      : '¿Eliminar esta categoría?';
    if (window.confirm(msg)) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  const grouped = TYPE_LIST.map((t) => ({
    type: t,
    items: categories.filter((c) => c.type === t.id),
  }));

  return (
    <div className="view">
      <header className="view-head">
        <h1>Configuración</h1>
        <p>Crea y administra las categorías de tus movimientos.</p>
      </header>

      <section className="card">
        <h2 className="card-title">Nueva categoría</h2>
        <form onSubmit={add} className="form">
          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Alquiler, Freelance…"
              maxLength={40}
            />
          </label>

          <label className="field">
            <span>Tipo</span>
            <div className="type-picker">
              {TYPE_LIST.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`type-chip ${type === t.id ? 'active' : ''}`}
                  style={type === t.id ? { borderColor: t.color, color: t.color } : undefined}
                  onClick={() => setType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </label>

          <button type="submit" className="btn-primary" disabled={!name.trim()}>
            <Icon.plus width={18} height={18} /> Crear categoría
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Categorías ({categories.length})</h2>
        {categories.length === 0 && (
          <p className="empty">Todavía no tienes categorías. Crea la primera arriba.</p>
        )}
        {grouped.map(({ type: t, items }) =>
          items.length === 0 ? null : (
            <div className="cat-group" key={t.id}>
              <div className="cat-group-head">
                <span className="type-badge" style={{ background: t.color }}>{t.label}</span>
                <span className="count">{items.length}</span>
              </div>
              <ul className="cat-list">
                {items.map((c) => (
                  <li key={c.id} className="cat-item">
                    <span className="dot" style={{ background: t.color }} />
                    <span className="cat-name">{c.name}</span>
                    <button className="icon-btn danger" onClick={() => remove(c.id)} aria-label="Eliminar">
                      <Icon.trash width={18} height={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </section>

      <section className="card">
        <h2 className="card-title"><Icon.download width={18} height={18} /> Exportar datos</h2>
        <p className="hint">
          Descarga tus {records.length} registro{records.length === 1 ? '' : 's'} para
          guardarlos o llevarlos a otra app.
        </p>
        <div className="export-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportXLSX(records)}
            disabled={records.length === 0}
          >
            <Icon.sheet width={18} height={18} /> Exportar a Excel (.xlsx)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportJSON(records, categories)}
          >
            <Icon.download width={18} height={18} /> Copia de seguridad (JSON)
          </button>
        </div>
        <p className="hint">
          El Excel incluye fecha, categoría, tipo, método de pago, monto, tasa y monto en USD.
          La copia JSON guarda además tus categorías para restaurar todo en otra app.
        </p>
      </section>
    </div>
  );
}
