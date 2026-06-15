import { useState, useEffect } from 'react';
import {
  getUsers, getNotifs, saveNotifs, getUnreadCount,
  resolvePerms, initStorage, getTheme, saveTheme, addHistorial
} from './data.js';
import { Spinner } from './shared.jsx';
import { DashboardTab } from './dashboard.jsx';
import { TareasTab } from './tareas.jsx';
import { ReportesTab } from './reportes.jsx';
import { CalendarioTab } from './calendario.jsx';
import { MetricasTab, AuditoriaTab, BackupTab, PerfilTab, PlantillasTab } from './extras.jsx';
import { PersonalTab } from './personal.jsx';
import { RolesTab } from './roles.jsx';

/* ── LOGIN ── */
function LoginScreen({ onLogin }) {
  const [usuario,    setUsuario]    = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verPass,    setVerPass]    = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!usuario || !contrasena) { setError("Completa todos los campos."); return; }
    setLoading(true);
    setTimeout(() => {
      const found = getUsers().find(u => u.user === usuario && u.pass === contrasena && u.activo);
      if (found) {
        addHistorial(`${found.nombre} inició sesión`, found.id, "login");
        onLogin(found);
      } else {
        setError("Usuario o contraseña incorrectos, o cuenta inactiva.");
        setLoading(false);
      }
    }, 850);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(211,47,47,0.1) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent 0%, var(--red) 50%, transparent 100%)", opacity: 0.7 }} />

      <div style={{ width: "100%", maxWidth: "400px", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #C9A227 0%, #e0b84a 100%)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: "0 4px 20px rgba(201,162,39,0.4)" }}>DC</div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "38px", letterSpacing: "4px", color: "var(--text)" }}>DORADO CLUB</span>
          </div>
          <p style={{ fontFamily: "var(--font-cond)", fontSize: "11px", letterSpacing: "5px", color: "var(--gray)", textTransform: "uppercase", marginTop: "4px" }}>Sistema de Gestión Empresarial</p>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "14px", padding: "36px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "2px", background: "linear-gradient(90deg, transparent, var(--red), transparent)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "30px", letterSpacing: "3px", marginBottom: "4px" }}>INICIAR SESIÓN</h2>
          <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "28px" }}>Acceso exclusivo para personal autorizado</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--gray2)", marginBottom: "8px", fontFamily: "var(--font-cond)", fontWeight: 600 }}>Usuario</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)", fontSize: "15px" }}>👤</span>
                <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="nombre de usuario" autoComplete="username"
                  style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "8px", padding: "13px 14px 13px 44px", color: "var(--text)", fontSize: "15px", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "var(--red)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"} />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--gray2)", marginBottom: "8px", fontFamily: "var(--font-cond)", fontWeight: 600 }}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)", fontSize: "15px" }}>🔒</span>
                <input type={verPass ? "text" : "password"} value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "8px", padding: "13px 46px 13px 44px", color: "var(--text)", fontSize: "15px", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "var(--red)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"} />
                <button type="button" onClick={() => setVerPass(!verPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray)", fontSize: "16px", padding: "4px" }}>{verPass ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#e0b84a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: loading ? "var(--border2)" : "var(--red)", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontFamily: "var(--font-display)", letterSpacing: "3px", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--red-dark)"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--red)"; }}
            >{loading ? <><Spinner /> ACCEDIENDO...</> : "INGRESAR"}</button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: "22px", fontFamily: "var(--font-cond)", fontSize: "13px", fontStyle: "italic", color: "var(--red)", letterSpacing: "1px" }}>Excelencia en Gestión Empresarial</p>
      </div>
    </div>
  );
}

/* ── NOTIFICACIONES ── */
function NotifPanel({ userId }) {
  const [notifs, setNotifs] = useState(getNotifs().filter(n => n.userId === userId));

  function marcarTodas() {
    const all = getNotifs().map(n => n.userId === userId ? { ...n, leida: true } : n);
    saveNotifs(all);
    setNotifs(all.filter(n => n.userId === userId));
  }

  function marcarLeida(id) {
    const all = getNotifs().map(n => n.id === id ? { ...n, leida: true } : n);
    saveNotifs(all);
    setNotifs(all.filter(n => n.userId === userId));
  }

  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "12px", width: "310px", maxHeight: "380px", zIndex: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", animation: "slideDown 0.2s ease" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", letterSpacing: "2px" }}>NOTIFICACIONES</span>
        <button onClick={marcarTodas} style={{ background: "none", border: "none", color: "var(--red)", fontSize: "11px", cursor: "pointer", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>Marcar todas</button>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--gray)", fontSize: "13px" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔔</div>Sin notificaciones
          </div>
        ) : notifs.map(n => (
          <div key={n.id} onClick={() => marcarLeida(n.id)}
            style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", background: n.leida ? "transparent" : "rgba(211,47,47,0.05)", cursor: "pointer", display: "flex", gap: "10px", alignItems: "flex-start" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
            onMouseLeave={e => e.currentTarget.style.background = n.leida ? "transparent" : "rgba(211,47,47,0.05)"}
          >
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: n.leida ? "var(--border2)" : "var(--red)", flexShrink: 0, marginTop: "5px" }} />
            <div>
              <p style={{ fontSize: "12px", color: n.leida ? "var(--gray2)" : "var(--text)", lineHeight: 1.5 }}>{n.msg}</p>
              <p style={{ fontSize: "10px", color: "var(--gray)", marginTop: "2px", fontFamily: "'Barlow Condensed'" }}>{n.fecha}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── GESTIÓN (sub-tabs) ── */
function GestionTab({ user }) {
  const [sub, setSub] = useState("tareas");
  const tabs = [
    { id: "tareas",     label: "TAREAS"     },
    { id: "reportes",   label: "REPORTES"   },
    { id: "plantillas", label: "PLANTILLAS" },
  ];
  return (
    <div>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "4px", paddingTop: "10px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSub(t.id)} style={{
              background: "none", border: "none", borderBottom: sub === t.id ? "2px solid var(--red)" : "2px solid transparent",
              padding: "8px 18px 10px", cursor: "pointer",
              color: sub === t.id ? "var(--red)" : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "2px",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {sub === "tareas"     && <TareasTab     user={user} />}
      {sub === "reportes"   && <ReportesTab   user={user} />}
      {sub === "plantillas" && <PlantillasTab user={user} />}
    </div>
  );
}

/* ── PANEL DE ACCESO (sub-tabs) ── */
function AdminTab({ user }) {
  const [sub, setSub] = useState("personal");
  const tabs = [
    { id: "personal",  label: "USUARIOS"  },
    { id: "roles",     label: "CARGOS"    },
    { id: "auditoria", label: "AUDITORÍA" },
    { id: "backup",    label: "BACKUP"    },
  ];
  return (
    <div>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "4px", paddingTop: "10px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSub(t.id)} style={{
              background: "none", border: "none", borderBottom: sub === t.id ? "2px solid var(--red)" : "2px solid transparent",
              padding: "8px 18px 10px", cursor: "pointer",
              color: sub === t.id ? "var(--red)" : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "2px",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {sub === "personal"  && <PersonalTab  user={user} />}
      {sub === "roles"     && <RolesTab     user={user} />}
      {sub === "auditoria" && <AuditoriaTab user={user} />}
      {sub === "backup"    && <BackupTab    user={user} />}
    </div>
  );
}

/* ── HEADER ── */
function Header({ user, tab, setTab, onLogout, theme, toggleTheme }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread,    setUnread]    = useState(getUnreadCount(user.id));
  const perms = resolvePerms(user);

  useEffect(() => {
    const iv = setInterval(() => setUnread(getUnreadCount(user.id)), 2500);
    return () => clearInterval(iv);
  }, [user.id]);

  const tabs = [
    { id: "dashboard",  label: "INICIO"        },
    { id: "gestion",    label: "GESTIÓN"       },
    { id: "calendario", label: "CALENDARIO"    },
    { id: "metricas",   label: "MÉTRICAS"      },
    ...(perms.canManageUsers ? [{ id: "admin", label: "ACCESO" }] : []),
    { id: "perfil",     label: "PERFIL"        },
  ];

  return (
    <header style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ height: "3px", background: "linear-gradient(90deg, var(--red) 0%, #a07d1a 60%, transparent 100%)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: "54px", maxWidth: "1400px", margin: "0 auto", gap: "10px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #C9A227 0%, #e0b84a 100%)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontFamily: "var(--font-display)", color: "#1a1a1a", fontWeight: 700, letterSpacing: "0.5px" }}>DC</div>
          <span className="desktop-nav" style={{ fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "2px", color: "var(--red)" }}>DORADO CLUB</span>
        </div>

        <nav className="desktop-nav" style={{ display: "flex", gap: "3px", flex: 1, justifyContent: "center", flexWrap: "nowrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "var(--red)" : "transparent",
              border: tab === t.id ? "none" : "1px solid var(--border2)",
              borderRadius: "6px", padding: "6px 14px",
              color: tab === t.id ? "#fff" : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "12px", letterSpacing: "1.5px",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--text)"; } }}
              onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--gray2)"; } }}
            >{t.label}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Cambiar tema"
            style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "7px", padding: "6px 8px", cursor: "pointer", fontSize: "14px", color: "var(--gray2)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}
          >{theme === "dark" ? "☀️" : "🌙"}</button>

          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(o => !o)}
              style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "7px", padding: "6px 8px", cursor: "pointer", fontSize: "14px", color: "var(--gray2)", position: "relative", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}
            >
              🔔
              {unread > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "var(--red)", color: "#fff", borderRadius: "50%", width: "15px", height: "15px", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, border: "2px solid var(--bg2)" }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 300 }}>
                  <NotifPanel userId={user.id} />
                </div>
              </>
            )}
          </div>

          <button onClick={() => setTab("perfil")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: tab === "perfil" ? "rgba(211,47,47,0.15)" : "var(--bg3)", border: `1px solid ${tab === "perfil" ? "var(--red)" : "var(--border2)"}`, borderRadius: "8px", padding: "4px 8px 4px 5px", cursor: "pointer", color: "var(--text)", transition: "all 0.15s" }}>
            <div style={{ width: "26px", height: "26px", background: "var(--red)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>{user.avatar}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.2 }}>{user.nombre.split(" ")[0]}</div>
              <div style={{ fontSize: "9px", color: "var(--gray2)", fontFamily: "var(--font-cond)", letterSpacing: "1px" }}>{user.rolKey}</div>
            </div>
          </button>

          <button onClick={onLogout} title="Cerrar sesión"
            style={{ background: "rgba(211,47,47,0.1)", border: "1px solid rgba(211,47,47,0.2)", borderRadius: "7px", padding: "6px 8px", cursor: "pointer", fontSize: "14px", color: "#ef9a9a", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(211,47,47,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(211,47,47,0.1)"; }}
          >⏻</button>
        </div>
      </div>

      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "var(--bg2)", borderTop: "1px solid var(--border)", justifyContent: "space-around", padding: "6px 0 10px" }}>
        {[
          { id: "dashboard",  icon: "🏠", label: "Inicio"     },
          { id: "gestion",    icon: "📋", label: "Gestión"    },
          { id: "calendario", icon: "📅", label: "Calendario" },
          { id: "metricas",   icon: "📊", label: "Métricas"   },
          { id: "perfil",     icon: "👤", label: "Perfil"     },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 6px", color: tab === t.id ? "var(--red)" : "var(--gray)", fontFamily: "var(--font-cond)", fontSize: "9px", letterSpacing: "1px" }}>
            <span style={{ fontSize: "18px" }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

/* ── APP ROOT ── */
export default function App() {
  const [user,        setUser]        = useState(null);
  const [tab,         setTab]         = useState("dashboard");
  const [theme,       setTheme]       = useState("dark");
  const [screenReady, setScreenReady] = useState(false);

  useEffect(() => {
    initStorage();
    const t = getTheme();
    setTheme(t);
    applyTheme(t);
    const saved = sessionStorage.getItem("dc_session");
    if (saved) {
      const parsed = JSON.parse(saved);
      const fresh  = getUsers().find(u => u.id === parsed.id);
      if (fresh && fresh.activo) setUser(fresh);
    }
    setScreenReady(true);
  }, []);

  function applyTheme(t) {
    document.body.classList.toggle("light", t === "light");
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); saveTheme(next); applyTheme(next);
  }

  function handleLogin(userData) {
    setUser(userData);
    sessionStorage.setItem("dc_session", JSON.stringify({ id: userData.id }));
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem("dc_session");
    setTab("dashboard");
  }

  if (!screenReady) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const perms = resolvePerms(user);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header user={user} tab={tab} setTab={setTab} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <main style={{ minHeight: "calc(100vh - 57px)", paddingBottom: "70px", animation: "fadeUp 0.28s ease" }}>
        {tab === "dashboard"  && <DashboardTab  user={user} onNavigate={setTab} />}
        {tab === "gestion"    && <GestionTab    user={user} />}
        {tab === "calendario" && <CalendarioTab user={user} />}
        {tab === "metricas"   && <MetricasTab   user={user} />}
        {tab === "admin"      && perms.canManageUsers && <AdminTab user={user} />}
        {tab === "perfil"     && <PerfilTab     user={user} onUserUpdate={u => { setUser(u); sessionStorage.setItem("dc_session", JSON.stringify({ id: u.id })); }} />}
      </main>
    </div>
  );
}
