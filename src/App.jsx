import { useEffect, useState } from 'react';
import { store } from './finance.js';
import { Icon } from './ui.jsx';
import Configuracion from './Configuracion.jsx';
import Registro from './Registro.jsx';
import Historial from './Historial.jsx';
import Gestion from './Gestion.jsx';

const TABS = [
  { id: 'registro',  label: 'Registro',      icon: Icon.plus },
  { id: 'historial', label: 'Historial',     icon: Icon.list },
  { id: 'gestion',   label: 'Gestión',       icon: Icon.chart },
  { id: 'config',    label: 'Configuración', icon: Icon.settings },
];

export default function App() {
  const [tab, setTab] = useState('registro');
  const [theme, setTheme] = useState(() => store.loadTheme());
  const [categories, setCategories] = useState(() => store.loadCategories());
  const [records, setRecords] = useState(() => store.loadRecords());
  const [methods, setMethods] = useState(() => store.loadMethods());

  useEffect(() => { store.saveCategories(categories); }, [categories]);
  useEffect(() => { store.saveRecords(records); }, [records]);
  useEffect(() => { store.saveMethods(methods); }, [methods]);
  useEffect(() => {
    store.saveTheme(theme);
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <Icon.wallet width={22} height={22} />
          <span>Finanzas</span>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Icon.sun width={20} height={20} /> : <Icon.moon width={20} height={20} />}
        </button>
      </div>

      <main className="content">
        {tab === 'registro' && (
          <Registro categories={categories} records={records} setRecords={setRecords} methods={methods} />
        )}
        {tab === 'historial' && (
          <Historial categories={categories} records={records} setRecords={setRecords} methods={methods} />
        )}
        {tab === 'gestion' && <Gestion records={records} methods={methods} />}
        {tab === 'config' && (
          <Configuracion
            categories={categories} setCategories={setCategories}
            records={records} setRecords={setRecords}
            methods={methods} setMethods={setMethods}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => {
          const Ico = t.icon;
          return (
            <button
              key={t.id}
              className={`nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Ico width={22} height={22} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
