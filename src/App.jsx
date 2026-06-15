import { useState, useEffect } from 'react';
import { api, setToken, getToken } from './api.js';
import { resolvePerms, getTheme, saveTheme, getRoles, setCargos } from './data.js';
import { Spinner } from './shared.jsx';
import { DashboardTab, GestionTab, PerfilTab } from './vistas.jsx';
import { CargosTab, PersonalTab, AuditoriaTab } from './admin.jsx';

/* ═══════════════════════ LOGO ═══════════════════════ */
function Logo({ size = "lg" }) {
  const big = size === "lg";
  return (
    <div style={{ textAlign: "center", lineHeight: 1 }}>
      <div style={{
        fontFamily: "var(--font-display)", letterSpacing: big ? "6px" : "3px",
        fontSize: big ? "46px" : "20px",
        background: "linear-gradient(180deg, #F0D77A 0%, #C9A227 55%, #8a6d12 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>DORADO</div>
      <div style={{
        fontFamily: "var(--font-cond)", fontWeight: 700,
        letterSpacing: big ? "13px" : "6px", fontSize: big ? "15px" : "9px",
        color: "var(--gray2)", marginTop: big ? "4px" : "1px", paddingLeft: big ? "13px" : "6px",
      }}>CLUB</div>
    </div>
  );
}

/* ═══════════════════════ LOGIN ═══════════════════════ */
function LoginScreen({ onLogin }) {
  const [usuario,    setUsuario]    = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verPass,    setVerPass]    = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!usuario || !contrasena) { setError("Completa todos los campos."); return; }
    setLoading(true);
    try {
      const { token, user } = await api.login(usuario, contrasena);
      setToken(token);
      await onLogin(user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "8px",
    color: "var(--text)", fontSize: "15px", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,162,39,0.12) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)", opacity: 0.7 }} />

      <div style={{ width: "100%", maxWidth: "400px", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: "34px" }}>
          <Logo size="lg" />
          <p style={{ fontFamily: "var(--font-cond)", fontSize: "11px", letterSpacing: "5px", color: "var(--gray)", textTransform: "uppercase", marginTop: "16px" }}>Sistema de Gestión Empresarial</p>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "14px", padding: "34px 30px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "2px", background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "3px", marginBottom: "4px" }}>INICIAR SESIÓN</h2>
          <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "26px" }}>Acceso exclusivo para gerencias del Club</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Usuario</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>👤</span>
                <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="nombre de usuario" autoComplete="username"
                  style={{ ...inputStyle, padding: "13px 14px 13px 44px" }}
                  onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "var(--border2)"} />
              </div>
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: "relative" }}>
                <span style={iconStyle}>🔒</span>
                <input type={verPass ? "text" : "password"} value={contrasena} onChange={e => setContrasena(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{ ...inputStyle, padding: "13px 46px 13px 44px" }}
                  onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "var(--border2)"} />
                <button type="button" onClick={() => setVerPass(!verPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--gray)", fontSize: "16px", padding: "4px" }}>{verPass ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", background: loading ? "var(--border2)" : "var(--gold)", color: "#1a1505", border: "none", borderRadius: "8px", padding: "14px", fontSize: "15px", fontFamily: "var(--font-display)", letterSpacing: "3px", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontWeight: 600 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--gold-dark)"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "var(--gold)"; }}
            >{loading ? <><Spinner /> ACCEDIENDO...</> : "INGRESAR"}</button>
          </form>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px", fontFamily: "var(--font-cond)", fontSize: "13px", fontStyle: "italic", color: "var(--gold)", letterSpacing: "1px" }}>Excelencia en cada gerencia</p>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--gray2)", marginBottom: "8px", fontFamily: "var(--font-cond)", fontWeight: 600 };
const iconStyle  = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gray)", fontSize: "15px" };

/* ═══════════════════════ ADMINISTRACIÓN (sub-tabs) ═══════════════════════ */
function AdminTab({ user }) {
  const [sub, setSub] = useState("perfiles");
  const tabs = [
    { id: "perfiles",  label: "PERFILES"  },
    { id: "cargos",    label: "CARGOS"    },
    { id: "auditoria", label: "AUDITORÍA" },
  ];
  return (
    <div>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "4px", paddingTop: "10px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSub(t.id)} style={{
              background: "none", border: "none",
              borderBottom: sub === t.id ? "2px solid var(--gold)" : "2px solid transparent",
              padding: "8px 18px 10px", cursor: "pointer",
              color: sub === t.id ? "var(--gold)" : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "2px", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>
      </div>
      {sub === "perfiles"  && <PersonalTab  user={user} />}
      {sub === "cargos"    && <CargosTab />}
      {sub === "auditoria" && <AuditoriaTab />}
    </div>
  );
}

/* ═══════════════════════ HEADER ═══════════════════════ */
function Header({ user, tab, setTab, onLogout, theme, toggleTheme }) {
  const perms = resolvePerms(user);
  const tabs = [
    { id: "dashboard", label: "INICIO"   },
    { id: "gestion",   label: "GESTIÓN"  },
    ...(perms.canManageUsers ? [{ id: "admin", label: "ADMINISTRACIÓN" }] : []),
    { id: "perfil",    label: "PERFIL"   },
  ];

  return (
    <header style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ height: "3px", background: "linear-gradient(90deg, var(--gold) 0%, #8a6d12 60%, transparent 100%)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", height: "56px", maxWidth: "1400px", margin: "0 auto", gap: "10px" }}>
        <div style={{ flexShrink: 0 }}><Logo size="sm" /></div>

        <nav className="desktop-nav" style={{ display: "flex", gap: "3px", flex: 1, justifyContent: "center", flexWrap: "nowrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "var(--gold)" : "transparent",
              border: tab === t.id ? "none" : "1px solid var(--border2)",
              borderRadius: "6px", padding: "6px 14px",
              color: tab === t.id ? "#1a1505" : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "12px", letterSpacing: "1.5px",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", fontWeight: tab === t.id ? 600 : 400,
            }}
              onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--text)"; } }}
              onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--gray2)"; } }}
            >{t.label}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={toggleTheme} title="Cambiar tema"
            style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "7px", padding: "6px 8px", cursor: "pointer", fontSize: "14px", color: "var(--gray2)" }}>{theme === "dark" ? "☀️" : "🌙"}</button>

          <button onClick={() => setTab("perfil")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: tab === "perfil" ? "rgba(201,162,39,0.15)" : "var(--bg3)", border: `1px solid ${tab === "perfil" ? "var(--gold)" : "var(--border2)"}`, borderRadius: "8px", padding: "4px 8px 4px 5px", cursor: "pointer", color: "var(--text)" }}>
            <div style={{ width: "26px", height: "26px", background: perms.color || "var(--gold)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "10px", color: "#fff", letterSpacing: "1px" }}>{user.avatar}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.2 }}>{user.nombre.split(" ")[0]}</div>
              <div style={{ fontSize: "9px", color: "var(--gray2)", fontFamily: "var(--font-cond)", letterSpacing: "1px" }}>{getRoles()[user.rolKey]?.label || user.rolKey}</div>
            </div>
          </button>

          <button onClick={onLogout} title="Cerrar sesión"
            style={{ background: "rgba(211,47,47,0.1)", border: "1px solid rgba(211,47,47,0.2)", borderRadius: "7px", padding: "6px 8px", cursor: "pointer", fontSize: "14px", color: "#ef9a9a" }}>⏻</button>
        </div>
      </div>

      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: "var(--bg2)", borderTop: "1px solid var(--border)", justifyContent: "space-around", padding: "6px 0 10px" }}>
        {[
          { id: "dashboard", icon: "🏠", label: "Inicio"  },
          { id: "gestion",   icon: "📋", label: "Gestión" },
          ...(perms.canManageUsers ? [{ id: "admin", icon: "⚙️", label: "Admin" }] : []),
          { id: "perfil",    icon: "👤", label: "Perfil"  },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 6px", color: tab === t.id ? "var(--gold)" : "var(--gray)", fontFamily: "var(--font-cond)", fontSize: "9px", letterSpacing: "1px" }}>
            <span style={{ fontSize: "18px" }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

/* ═══════════════════════ APP ROOT ═══════════════════════ */
export default function App() {
  const [user,    setUser]    = useState(null);
  const [tab,     setTab]     = useState("dashboard");
  const [theme,   setTheme]   = useState(getTheme);
  const [booting, setBooting] = useState(true);

  useEffect(() => { document.body.classList.toggle("light", theme === "light"); }, [theme]);

  useEffect(() => {
    (async () => {
      try {
        if (getToken()) {
          const [me, cargos] = await Promise.all([api.me(), api.cargos()]);
          setCargos(cargos);
          setUser(me.user);
        }
      } catch { setToken(null); }
      finally { setBooting(false); }
    })();
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); saveTheme(next);
  }

  async function handleLogin(u) {
    try { setCargos(await api.cargos()); } catch { /* usa fallback local */ }
    setUser(u);
    setTab("dashboard");
  }
  function handleLogout() {
    api.logout().catch(() => {});
    setToken(null);
    setUser(null);
    setTab("dashboard");
  }

  if (booting) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}><Spinner size={26} /></div>;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const perms = resolvePerms(user);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header user={user} tab={tab} setTab={setTab} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <main style={{ minHeight: "calc(100vh - 59px)", paddingBottom: "70px", animation: "fadeUp 0.28s ease" }}>
        {tab === "dashboard" && <DashboardTab user={user} onNavigate={setTab} />}
        {tab === "gestion"   && <GestionTab   user={user} />}
        {tab === "admin"     && perms.canManageUsers && <AdminTab user={user} />}
        {tab === "perfil"    && <PerfilTab user={user} onUserUpdate={setUser} />}
      </main>
    </div>
  );
}
