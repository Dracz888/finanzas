import { useRef, useState } from 'react';
import { TYPE_LIST, uid } from './finance.js';
import { exportJSON, exportXLSX, mergeBackup, readBackupFile } from './export.js';
import { Icon } from './ui.jsx';

export default function Configuracion({
  categories, setCategories, records, setRecords, methods, setMethods,
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('ingreso');

  const [editingCatId, setEditingCatId] = useState(null);
  const [catDraft, setCatDraft] = useState({ name: '', type: '' });

  const [mLabel, setMLabel] = useState('');
  const [mShort, setMShort] = useState('');
  const [mSymbol, setMSymbol] = useState('');
  const [mCurrency, setMCurrency] = useState('');
  const [mFixed, setMFixed] = useState(false);
  const [mNote, setMNote] = useState('');

  const fileInputRef = useRef(null);
  const [importMsg, setImportMsg] = useState(null);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const payload = await readBackupFile(file);
      const result = mergeBackup({ categories, methods, records }, payload);
      setCategories(result.categories);
      setMethods(result.methods);
      setRecords(result.records);
      setImportMsg({ ok: true, text: `Se importaron ${result.added} registro(s) nuevos.` });
    } catch (err) {
      setImportMsg({ ok: false, text: err.message || 'No se pudo importar el archivo.' });
    }
  };

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

  const startEditCat = (c) => {
    setEditingCatId(c.id);
    setCatDraft({ name: c.name, type: c.type });
  };

  const cancelEditCat = () => setEditingCatId(null);

  const saveCat = (c) => {
    const newName = catDraft.name.trim();
    if (!newName) return;
    const typeChanged = catDraft.type !== c.type;
    const nameChanged = newName !== c.name;
    setCategories(categories.map((x) => (
      x.id === c.id ? { ...x, name: newName, type: catDraft.type } : x
    )));
    if ((typeChanged || nameChanged) && records.some((r) => r.categoryId === c.id)) {
      const cascade = window.confirm(
        'Esta categoría tiene registros asociados. ¿Actualizar también el tipo/nombre en esos registros existentes?'
      );
      if (cascade) {
        setRecords(records.map((r) => (
          r.categoryId === c.id
            ? { ...r, type: catDraft.type, categoryName: newName }
            : r
        )));
      }
    }
    setEditingCatId(null);
  };

  const grouped = TYPE_LIST.map((t) => ({
    type: t,
    items: categories.filter((c) => c.type === t.id),
  }));

  const addMethod = (e) => {
    e.preventDefault();
    const label = mLabel.trim();
    if (!label) return;
    const dup = methods.some((m) => m.label.toLowerCase() === label.toLowerCase());
    if (dup) return;
    setMethods([
      ...methods,
      {
        id: uid(),
        label,
        short: mShort.trim() || label,
        symbol: mSymbol.trim() || '$',
        currency: mCurrency.trim().toUpperCase() || label.slice(0, 3).toUpperCase(),
        fixedRate: mFixed ? 1 : null,
        note: mNote.trim(),
      },
    ]);
    setMLabel(''); setMShort(''); setMSymbol(''); setMCurrency(''); setMFixed(false); setMNote('');
  };

  const removeMethod = (id) => {
    const used = records.some((r) => r.method === id);
    const msg = used
      ? 'Este método de pago tiene registros asociados. ¿Eliminarlo de todas formas? Los registros se conservarán.'
      : '¿Eliminar este método de pago?';
    if (window.confirm(msg)) {
      setMethods(methods.filter((m) => m.id !== id));
    }
  };

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
                {items.map((c) => {
                  if (editingCatId === c.id) {
                    return (
                      <li key={c.id} className="cat-item cat-edit">
                        <input
                          type="text"
                          value={catDraft.name}
                          onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })}
                          maxLength={40}
                        />
                        <div className="type-picker">
                          {TYPE_LIST.map((tp) => (
                            <button
                              type="button"
                              key={tp.id}
                              className={`type-chip ${catDraft.type === tp.id ? 'active' : ''}`}
                              style={catDraft.type === tp.id ? { borderColor: tp.color, color: tp.color } : undefined}
                              onClick={() => setCatDraft({ ...catDraft, type: tp.id })}
                            >
                              {tp.label}
                            </button>
                          ))}
                        </div>
                        <div className="cat-edit-actions">
                          <button type="button" className="btn-secondary" onClick={cancelEditCat}>
                            <Icon.x width={16} height={16} /> Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!catDraft.name.trim()}
                            onClick={() => saveCat(c)}
                          >
                            <Icon.check width={16} height={16} /> Guardar
                          </button>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={c.id} className="cat-item">
                      <span className="dot" style={{ background: t.color }} />
                      <span className="cat-name">{c.name}</span>
                      <button className="icon-btn" onClick={() => startEditCat(c)} aria-label="Editar">
                        <Icon.edit width={18} height={18} />
                      </button>
                      <button className="icon-btn danger" onClick={() => remove(c.id)} aria-label="Eliminar">
                        <Icon.trash width={18} height={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Nuevo método de pago</h2>
        <form onSubmit={addMethod} className="form">
          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              value={mLabel}
              onChange={(e) => setMLabel(e.target.value)}
              placeholder="Ej. Euros, Zelle…"
              maxLength={30}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Abreviatura</span>
              <input
                type="text"
                value={mShort}
                onChange={(e) => setMShort(e.target.value)}
                placeholder="Ej. EUR"
                maxLength={10}
              />
            </label>
            <label className="field">
              <span>Símbolo</span>
              <input
                type="text"
                value={mSymbol}
                onChange={(e) => setMSymbol(e.target.value)}
                placeholder="Ej. €"
                maxLength={4}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Moneda</span>
              <input
                type="text"
                value={mCurrency}
                onChange={(e) => setMCurrency(e.target.value)}
                placeholder="Ej. EUR"
                maxLength={6}
              />
            </label>
            <label className="field">
              <span>Nota</span>
              <input
                type="text"
                value={mNote}
                onChange={(e) => setMNote(e.target.value)}
                placeholder="Ej. Banco, Efectivo…"
                maxLength={30}
              />
            </label>
          </div>

          <label className="checkbox-field">
            <input type="checkbox" checked={mFixed} onChange={(e) => setMFixed(e.target.checked)} />
            <span>1 unidad equivale a 1 USD (tasa fija, sin necesidad de tasa manual)</span>
          </label>

          <button type="submit" className="btn-primary" disabled={!mLabel.trim()}>
            <Icon.plus width={18} height={18} /> Crear método de pago
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Métodos de pago ({methods.length})</h2>
        {methods.length === 0 && (
          <p className="empty">Todavía no tienes métodos de pago. Crea el primero arriba.</p>
        )}
        <ul className="cat-list">
          {methods.map((m) => (
            <li key={m.id} className="cat-item">
              <span className="cat-name">
                {m.label} <small className="hint">· {m.short} · {m.symbol}</small>
              </span>
              <button className="icon-btn danger" onClick={() => removeMethod(m.id)} aria-label="Eliminar">
                <Icon.trash width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>
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
            onClick={() => exportXLSX(records, methods)}
            disabled={records.length === 0}
          >
            <Icon.sheet width={18} height={18} /> Exportar a Excel (.xlsx)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportJSON(records, categories, methods)}
          >
            <Icon.download width={18} height={18} /> Copia de seguridad (JSON)
          </button>
        </div>
        <p className="hint">
          El Excel incluye fecha, categoría, tipo, método de pago, monto, tasa y monto en USD.
          La copia JSON guarda además tus categorías para restaurar todo en otra app.
        </p>
      </section>

      <section className="card">
        <h2 className="card-title"><Icon.sheet width={18} height={18} /> Importar copia de seguridad</h2>
        <p className="hint">
          Carga un archivo JSON exportado desde esta app (o migrado desde Excel) para agregar
          sus categorías, métodos y registros a los que ya tienes. No se duplican registros
          idénticos.
        </p>
        <div className="export-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon.download width={18} height={18} /> Importar JSON
          </button>
        </div>
        {importMsg && (
          <p className={`hint ${importMsg.ok ? '' : 'warn'}`}>{importMsg.text}</p>
        )}
      </section>
    </div>
  );
}
