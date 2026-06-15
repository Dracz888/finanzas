import { useState } from 'react';
import { api } from './api.js';
import {
  resolvePerms, DEPARTAMENTOS, MODULOS, METODOS_PAGO, getRoles, puedeLeerKG,
} from './data.js';
import { sharedStyles, KModal, FormGroup, KInput, Badge } from './shared.jsx';
import { KomplexModule } from './komplex.jsx';

/* ═══════════════════════ INICIO ═══════════════════════ */
export function DashboardTab({ user, onNavigate }) {
  const perms = resolvePerms(user);
  const depto = DEPARTAMENTOS[perms.departamento] || {};
  const modulos = depto.modulos || [];

  return (
    <div style={{ padding: "26px 20px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${depto.color || "#C9A227"}`, borderRadius: "12px",
        padding: "22px 24px", marginBottom: "22px",
      }}>
        <p style={{ fontFamily: "var(--font-cond)", fontSize: "12px", letterSpacing: "3px", color: "var(--gray2)", textTransform: "uppercase" }}>Bienvenido</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", letterSpacing: "1px", marginTop: "2px" }}>{user.nombre}</h1>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <Badge color={depto.color || "#C9A227"} label={`${depto.icon || ""} ${getRoles()[user.rolKey]?.label || user.rolKey}`} />
          <Badge color="var(--gray2)" label={perms.nivel || "Gerencia"} />
        </div>
      </div>

      <SectionTitle title="TU PAPEL DE ACCESO" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "26px" }}>
        <PermCard ok={perms.canManageUsers}       label="Gestionar usuarios y cargos" icon="👤" />
        <PermCard ok={perms.canSeeConsolidado}    label="Ver consolidado general"     icon="📈" />
        <PermCard ok={perms.canRegistrarIngresos} label="Registrar ingresos"          icon="💰" />
        <PermCard ok={perms.canRegistrarEgresos}  label="Registrar egresos / gastos"  icon="💸" />
      </div>

      <SectionTitle title="MÓDULOS DE TU GERENCIA" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {modulos.map(mid => {
          const m = MODULOS[mid];
          if (!m) return null;
          const disponible = perms.departamento === "komplex_gym" && (mid === "afiliaciones" || mid === "entrenadores");
          return (
            <div key={mid} onClick={() => onNavigate("gestion")} style={{
              background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px",
              padding: "18px", cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = depto.color || "#C9A227"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ fontSize: "26px", marginBottom: "8px" }}>{m.icon}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: "15px" }}>{m.label}</span>
                {disponible
                  ? <Badge color="#22c55e" label="ACTIVO" />
                  : <Badge color="var(--gray)" label="PRÓXIMO" />}
              </div>
              <p style={{ fontSize: "12px", color: "var(--gray2)", marginTop: "5px", lineHeight: 1.5 }}>{m.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermCard({ ok, label, icon }) {
  return (
    <div style={{
      background: "var(--bg2)", border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
      borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "10px", opacity: ok ? 1 : 0.5,
    }}>
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: "11px", color: ok ? "#22c55e" : "var(--gray)", fontFamily: "var(--font-cond)", letterSpacing: "1px" }}>{ok ? "PERMITIDO" : "SIN ACCESO"}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════ GESTIÓN ═══════════════════════ */
export function GestionTab({ user }) {
  const perms = resolvePerms(user);

  // Komplex Gym ya está construido; el resto de gerencias se muestran como "Próximamente".
  if (puedeLeerKG(perms)) return <KomplexModule user={user} />;

  return <PlaceholderGestion user={user} />;
}

function PlaceholderGestion({ user }) {
  const perms = resolvePerms(user);
  const depto = DEPARTAMENTOS[perms.departamento] || {};
  const modulos = depto.modulos || [];
  const [activo, setActivo] = useState(modulos[0] || null);

  return (
    <div>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "4px", paddingTop: "10px", flexWrap: "wrap" }}>
          {modulos.map(mid => (
            <button key={mid} onClick={() => setActivo(mid)} style={{
              background: "none", border: "none",
              borderBottom: activo === mid ? `2px solid ${depto.color}` : "2px solid transparent",
              padding: "8px 16px 10px", cursor: "pointer",
              color: activo === mid ? depto.color : "var(--gray2)",
              fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "1.5px", whiteSpace: "nowrap",
            }}>{MODULOS[mid]?.label?.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "40px 20px", maxWidth: "760px", margin: "0 auto" }}>
        {activo && MODULOS[activo] && (
          <div style={{ background: "var(--bg2)", border: "1px dashed var(--border2)", borderRadius: "14px", padding: "44px 32px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>{MODULOS[activo].icon}</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", letterSpacing: "2px", marginBottom: "8px" }}>{MODULOS[activo].label}</h2>
            <p style={{ fontSize: "14px", color: "var(--gray2)", lineHeight: 1.6, maxWidth: "440px", margin: "0 auto 18px" }}>{MODULOS[activo].desc}</p>
            <Badge color={depto.color} label="EN CONSTRUCCIÓN — PRÓXIMA FASE" />
            <div style={{ marginTop: "28px", textAlign: "left", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 18px" }}>
              <p style={{ fontFamily: "var(--font-cond)", fontSize: "12px", letterSpacing: "2px", color: "var(--gray2)", textTransform: "uppercase", marginBottom: "10px" }}>Métodos de pago disponibles</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {METODOS_PAGO.map(m => (
                  <span key={m.id} style={{ fontSize: "12px", color: "var(--text-dim)", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "8px", padding: "6px 11px" }}>
                    {m.label} <span style={{ color: "var(--gray)" }}>({m.moneda}{m.esUSD ? " · tasa 1" : ""})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ PERFIL ═══════════════════════ */
export function PerfilTab({ user }) {
  const perms = resolvePerms(user);
  const depto = DEPARTAMENTOS[perms.departamento] || {};
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={{ padding: "26px 20px", maxWidth: "640px", margin: "0 auto" }}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "14px", padding: "28px", textAlign: "center", marginBottom: "16px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "16px", background: depto.color || "#C9A227",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
          fontFamily: "var(--font-display)", fontSize: "26px", color: "#fff", letterSpacing: "1px",
        }}>{user.avatar}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", letterSpacing: "1px" }}>{user.nombre}</h1>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
          <Badge color={depto.color || "#C9A227"} label={getRoles()[user.rolKey]?.label || user.rolKey} />
          {depto.label && <Badge color="var(--gray2)" label={`${depto.icon} ${depto.label}`} />}
        </div>
      </div>

      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px 22px" }}>
        <InfoRow label="Usuario" value={`@${user.user}`} />
        <InfoRow label="Cargo" value={getRoles()[user.rolKey]?.label || user.rolKey} />
        <InfoRow label="Departamento" value={depto.label || "—"} />
        <InfoRow label="Nivel" value={perms.nivel || "—"} />
        <button onClick={() => setShowPass(true)} style={{ ...sharedStyles.btnSecundario, width: "100%", marginTop: "16px" }}>🔒 Cambiar mi contraseña</button>
      </div>

      {showPass && (
        <KModal onClose={() => setShowPass(false)} width={420}>
          <CambiarPassForm user={user} onClose={() => setShowPass(false)} />
        </KModal>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "11px", color: "var(--gray)", fontFamily: "var(--font-cond)", letterSpacing: "2px", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-dim)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function CambiarPassForm({ user, onClose }) {
  const [actual,  setActual]  = useState("");
  const [nueva,   setNueva]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [ok,      setOk]      = useState(false);
  const [saving,  setSaving]  = useState(false);

  async function handleGuardar() {
    if (nueva.length < 6) { setError("La nueva contraseña debe tener mínimo 6 caracteres."); return; }
    if (nueva !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    try {
      // verifica la contraseña actual intentando autenticarse
      await api.login(user.user, actual);
      await api.editarUsuario(user.id, { pass: nueva });
      setOk(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("La contraseña actual es incorrecta.");
      setSaving(false);
    }
  }

  if (ok) {
    return (
      <div style={{ textAlign: "center", padding: "28px 16px" }}>
        <div style={{ fontSize: "44px", marginBottom: "10px" }}>✅</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "#22c55e", letterSpacing: "2px" }}>CONTRASEÑA ACTUALIZADA</h3>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", letterSpacing: "2px", marginBottom: "18px", paddingRight: "32px" }}>CAMBIAR CONTRASEÑA</h3>
      {error && <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "14px" }}>⚠️ {error}</div>}
      <FormGroup label="Contraseña Actual"><KInput type="password" value={actual} onChange={e => setActual(e.target.value)} placeholder="••••••••" /></FormGroup>
      <FormGroup label="Nueva Contraseña" mt={14}><KInput type="password" value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Mínimo 6 caracteres" /></FormGroup>
      <FormGroup label="Confirmar Nueva Contraseña" mt={14}><KInput type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la contraseña" /></FormGroup>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={handleGuardar} disabled={saving} style={{ ...sharedStyles.btnPrimario, flex: 1 }}>{saving ? "Guardando…" : "Guardar"}</button>
      </div>
    </div>
  );
}

/* ── compartidos locales ── */
function SectionTitle({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "15px", letterSpacing: "2px", color: "var(--gray2)" }}>{title}</h2>
      <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
      {right && <span style={{ fontSize: "10px", color: "var(--gray)", fontFamily: "var(--font-cond)", letterSpacing: "1px" }}>{right}</span>}
    </div>
  );
}
