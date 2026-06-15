import { useState } from 'react';
import {
  getCustomRoles, saveCustomRoles, getRoles, getUsers, SYSTEM_ROLES, ROLES
} from './data.js';
import {
  sharedStyles, KModal, FormGroup, KInput, Badge
} from './shared.jsx';
import { ActionBtn, MiniChip } from './personal.jsx';

export function RolesTab({ user }) {
  const [customRoles, setCustomRoles] = useState(getCustomRoles());
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);

  function refresh() { setCustomRoles(getCustomRoles()); }

  function handleGuardar(datos, id = null) {
    const all = getCustomRoles();
    if (id) {
      saveCustomRoles(all.map(r => r.key === id ? { ...r, ...datos } : r));
    } else {
      const allRoles = getRoles();
      if (allRoles[datos.key]) return "Ya existe un rol con esa clave.";
      saveCustomRoles([...all, { ...datos, system: false }]);
    }
    refresh();
    setShowForm(false);
    setEditTarget(null);
    return null;
  }

  function handleEliminar(key) {
    const usersWithRole = getUsers().filter(u => u.rolKey === key);
    if (usersWithRole.length > 0) {
      return `No se puede eliminar: ${usersWithRole.length} usuario(s) tienen este rol. Cambia su rol primero.`;
    }
    saveCustomRoles(getCustomRoles().filter(r => r.key !== key));
    refresh();
    setConfirmDel(null);
    return null;
  }

  const systemRoles = Object.entries(SYSTEM_ROLES);

  return (
    <div style={{ padding: "24px 20px", maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "2px" }}>GESTIÓN DE CARGOS</h1>
          <p style={{ fontSize: "13px", color: "var(--gray2)", marginTop: "2px" }}>
            {systemRoles.length} cargos del sistema · {customRoles.length} cargos personalizados
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "var(--red)", color: "#000", border: "none",
          borderRadius: "8px", padding: "10px 20px",
          fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "2px", cursor: "pointer", fontWeight: 700,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--red-dark)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--red)"}
        >+ NUEVO CARGO</button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "2px", color: "var(--gray2)" }}>CARGOS DEL SISTEMA</h2>
          <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "10px", color: "var(--gray)", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>NO EDITABLES</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {systemRoles.map(([key, rol]) => (
            <RolRow key={key} rolKey={key} rol={rol} system={true} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "2px", color: "var(--gray2)" }}>CARGOS PERSONALIZADOS</h2>
          <div style={{ height: "1px", flex: 1, background: "var(--border)" }} />
        </div>
        {customRoles.length === 0 ? (
          <div style={{
            background: "var(--bg2)", border: "1px dashed var(--border2)",
            borderRadius: "10px", padding: "40px",
            textAlign: "center", color: "var(--gray)",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏷️</div>
            <p style={{ fontFamily: "'Barlow Condensed'", fontSize: "14px", letterSpacing: "2px", marginBottom: "6px" }}>SIN CARGOS PERSONALIZADOS</p>
            <p style={{ fontSize: "12px" }}>Crea cargos adicionales con permisos específicos para tu equipo.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {customRoles.map(rol => (
              <RolRow
                key={rol.key} rolKey={rol.key} rol={rol} system={false}
                onEdit={() => setEditTarget(rol)}
                onDelete={() => setConfirmDel(rol.key)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <KModal onClose={() => setShowForm(false)}>
          <RolForm onGuardar={(datos) => handleGuardar(datos)} onClose={() => setShowForm(false)} />
        </KModal>
      )}

      {editTarget && (
        <KModal onClose={() => setEditTarget(null)}>
          <RolForm initial={editTarget} onGuardar={(datos) => handleGuardar(datos, editTarget.key)} onClose={() => setEditTarget(null)} />
        </KModal>
      )}

      {confirmDel && (
        <KModal onClose={() => setConfirmDel(null)} width={420}>
          <ConfirmDeleteRol
            rolKey={confirmDel}
            onConfirm={() => {
              const err = handleEliminar(confirmDel);
              if (err) alert(err);
            }}
            onCancel={() => setConfirmDel(null)}
          />
        </KModal>
      )}
    </div>
  );
}

function RolRow({ rolKey, rol, system, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const usersCount = getUsers().filter(u => u.rolKey === rolKey).length;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "var(--bg3)" : "var(--bg2)",
        border: `1px solid ${hov ? "var(--border2)" : "var(--border)"}`,
        borderLeft: `3px solid ${rol.color || "#555"}`,
        borderRadius: "8px", padding: "14px 16px",
        transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
      }}
    >
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        background: `${rol.color}22`, border: `1px solid ${rol.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontSize: "11px", color: rol.color,
        letterSpacing: "1px", flexShrink: 0,
      }}>{rolKey.slice(0, 3)}</div>

      <div style={{ flex: 1, minWidth: "140px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: "14px" }}>{rol.label}</span>
          {system && <Badge color="var(--gray)" label="SISTEMA" />}
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
          {rol.defaultPerms?.verTodos       && <MiniChip label="Ve todo"        color="#60a5fa" />}
          {rol.defaultPerms?.crearTareas    && <MiniChip label="Crear tareas"   color="#22c55e" />}
          {rol.defaultPerms?.eliminarTareas && <MiniChip label="Eliminar tareas" color="#f59e0b" />}
          {rol.canManageUsers               && <MiniChip label="Gestión usuarios" color="#D32F2F" />}
          {rol.canSeeAll                    && <MiniChip label="Ver reportes"   color="#a78bfa" />}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "18px", fontFamily: "var(--font-display)", color: "var(--text)" }}>{usersCount}</div>
        <div style={{ fontSize: "10px", color: "var(--gray)", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>usuario{usersCount !== 1 ? "s" : ""}</div>
      </div>

      {!system && (
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <ActionBtn onClick={onEdit}   title="Editar rol"    color="#60a5fa">✏️</ActionBtn>
          <ActionBtn onClick={onDelete} title="Eliminar rol"  color="#ef9a9a">🗑</ActionBtn>
        </div>
      )}
    </div>
  );
}

function RolForm({ initial, onGuardar, onClose }) {
  const isEdit = !!initial;
  const [label,          setLabel]          = useState(initial?.label          || "");
  const [key,            setKey]            = useState(initial?.key            || "");
  const [color,          setColor]          = useState(initial?.color          || "#60a5fa");
  const [verTodos,       setVerTodos]       = useState(initial?.defaultPerms?.verTodos       || false);
  const [crearTareas,    setCrearTareas]    = useState(initial?.defaultPerms?.crearTareas    || false);
  const [eliminarTareas, setEliminarTareas] = useState(initial?.defaultPerms?.eliminarTareas || false);
  const [canSeeAll,      setCanSeeAll]      = useState(initial?.canSeeAll      || false);
  const [canAssignTo,    setCanAssignTo]    = useState(initial?.canAssignTo    || "none");
  const [error,          setError]          = useState("");

  const PRESET_COLORS = [
    "#D32F2F","#f97316","#f59e0b","#22c55e",
    "#60a5fa","#a78bfa","#ec4899","#14b8a6",
    "#6b7280","#e2e8f0",
  ];

  function handleGuardar() {
    if (!label.trim()) { setError("El nombre del rol es obligatorio."); return; }
    if (!isEdit && !key.trim()) { setError("La clave es obligatoria."); return; }
    const clave = (isEdit ? initial.key : key.trim().toUpperCase().replace(/\s/g, "_"));
    const datos = {
      key: clave, label: label.trim(), color,
      defaultPerms: { verTodos, crearTareas, eliminarTareas },
      canManageUsers: false, canSeeAll, canAssignTo,
    };
    const err = onGuardar(datos);
    if (err) setError(err);
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "20px", paddingRight: "32px" }}>
        {isEdit ? "EDITAR CARGO" : "NUEVO CARGO"}
      </h3>
      {error && (
        <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "14px" }}>⚠️ {error}</div>
      )}
      <FormGroup label="Nombre del Cargo">
        <KInput value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej. Coordinador de Área" />
      </FormGroup>
      {!isEdit && (
        <FormGroup label="Clave interna (única, sin espacios)" mt={14}>
          <KInput value={key} onChange={e => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 8))} placeholder="Ej. COORD" />
          <p style={{ fontSize: "11px", color: "var(--gray)", marginTop: "5px" }}>Máx. 8 caracteres, solo letras y números.</p>
        </FormGroup>
      )}
      <FormGroup label="Color del Rol" mt={14}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {PRESET_COLORS.map(c => (
            <div key={c} onClick={() => setColor(c)} style={{
              width: "28px", height: "28px", borderRadius: "6px", background: c, cursor: "pointer",
              border: color === c ? "3px solid #fff" : "2px solid transparent",
              boxSizing: "border-box", transition: "transform 0.15s",
              transform: color === c ? "scale(1.15)" : "scale(1)",
            }} />
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--gray2)" }}>Custom:</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: "36px", height: "28px", border: "none", background: "none", cursor: "pointer", padding: 0 }} />
          </div>
        </div>
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "6px", padding: "4px 12px", fontSize: "12px", color, fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>{label || "NOMBRE ROL"}</div>
        </div>
      </FormGroup>
      <FormGroup label="Permisos por Defecto" mt={18}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <PermToggleSmall label="Ver tareas de todo el equipo" checked={verTodos}       onChange={setVerTodos}       color="#60a5fa" />
          <PermToggleSmall label="Crear y asignar tareas"       checked={crearTareas}    onChange={setCrearTareas}    color="#22c55e" />
          <PermToggleSmall label="Eliminar tareas"              checked={eliminarTareas} onChange={setEliminarTareas} color="#f59e0b" />
          <PermToggleSmall label="Ver todos los reportes"       checked={canSeeAll}      onChange={setCanSeeAll}      color="#a78bfa" />
        </div>
      </FormGroup>
      <FormGroup label="Capacidad de Asignación" mt={14}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { val: "none",    label: "No asignar" },
            { val: "nonAdm",  label: "A todos menos ADM" },
            { val: "all",     label: "A todos" },
          ].map(opt => (
            <button key={opt.val} type="button" onClick={() => setCanAssignTo(opt.val)} style={{
              flex: 1, padding: "8px 4px",
              background: canAssignTo === opt.val ? "rgba(211,47,47,0.15)" : "var(--bg3)",
              border: `1px solid ${canAssignTo === opt.val ? "var(--red)" : "var(--border2)"}`,
              borderRadius: "6px",
              color: canAssignTo === opt.val ? "var(--red)" : "var(--gray2)",
              cursor: "pointer", fontSize: "11px", fontFamily: "'Barlow Condensed'", letterSpacing: "0.5px",
            }}>{opt.label}</button>
          ))}
        </div>
      </FormGroup>
      <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={handleGuardar} style={{ ...sharedStyles.btnPrimario, flex: 1 }}>
          {isEdit ? "Guardar Cambios" : "Crear Cargo"}
        </button>
      </div>
    </div>
  );
}

function PermToggleSmall({ label, checked, onChange, color }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: checked ? `${color}10` : "var(--bg3)",
      border: `1px solid ${checked ? color + "44" : "var(--border2)"}`,
      borderRadius: "8px", padding: "10px 14px",
      cursor: "pointer", transition: "all 0.15s",
    }}>
      <span style={{ fontSize: "13px", color: checked ? color : "var(--text-dim)" }}>{label}</span>
      <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: checked ? color : "var(--border2)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "2px", left: checked ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </div>
    </div>
  );
}

function ConfirmDeleteRol({ rolKey, onConfirm, onCancel }) {
  const roles = getRoles();
  const rol   = roles[rolKey];
  const usersCount = getUsers().filter(u => u.rolKey === rolKey).length;

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", letterSpacing: "2px", marginBottom: "10px" }}>ELIMINAR CARGO</h3>
      <p style={{ fontSize: "14px", color: "var(--text-dim)", marginBottom: "8px" }}>
        ¿Eliminar el rol <strong style={{ color: rol?.color }}>{rol?.label}</strong>?
      </p>
      {usersCount > 0 ? (
        <div style={{ background: "rgba(211,47,47,0.1)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#ef9a9a" }}>
          ❌ Este rol tiene <strong>{usersCount}</strong> usuario(s) asignado(s).<br />
          Cambia su rol antes de eliminar este.
        </div>
      ) : (
        <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "20px" }}>Esta acción no puede deshacerse.</p>
      )}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button onClick={onCancel} style={{ ...sharedStyles.btnSecundario }}>Cancelar</button>
        {usersCount === 0 && (
          <button onClick={onConfirm} style={{ ...sharedStyles.btnDanger }}>Eliminar</button>
        )}
      </div>
    </div>
  );
}
