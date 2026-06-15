import { useState } from 'react';
import {
  getUsers, saveUsers, resolvePerms, ROLES, getRoles, addHistorial
} from './data.js';
import {
  sharedStyles, KModal, FormGroup, KInput, Badge, ConfirmDelete
} from './shared.jsx';

export function PersonalTab({ user }) {
  const [users, setUsers]         = useState(getUsers());
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [permTarget, setPermTarget] = useState(null);

  function refresh() { setUsers(getUsers()); }

  function handleEliminar(id) {
    if (id === user.id) return;
    saveUsers(getUsers().filter(u => u.id !== id));
    refresh();
    setConfirmDel(null);
  }

  function handleToggleActivo(id) {
    if (id === user.id) return;
    saveUsers(getUsers().map(u => u.id === id ? { ...u, activo: !u.activo } : u));
    refresh();
  }

  function handleCrear(datos) {
    const all = getUsers();
    if (all.find(u => u.user === datos.user)) return "El nombre de usuario ya existe.";
    const nuevo = {
      id:     Date.now(),
      user:   datos.user,
      pass:   datos.pass,
      nombre: datos.nombre,
      rolKey: datos.rolKey,
      avatar: datos.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      activo: true,
      perms:  { ...ROLES[datos.rolKey]?.defaultPerms },
    };
    saveUsers([...all, nuevo]);
    addHistorial(`${user.nombre} creó al usuario ${nuevo.nombre}`, user.id, "usuario_nuevo");
    refresh();
    setShowForm(false);
    return null;
  }

  function handleGuardarEdicion(id, cambios) {
    const all = getUsers();
    if (cambios.user && all.find(u => u.user === cambios.user && u.id !== id)) {
      return "El nombre de usuario ya existe.";
    }
    saveUsers(all.map(u => {
      if (u.id !== id) return u;
      const updated = { ...u, ...cambios };
      if (cambios.nombre) {
        updated.avatar = cambios.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      }
      return updated;
    }));
    refresh();
    if (id === user.id) {
      const fresh = getUsers().find(u => u.id === id);
      if (fresh) sessionStorage.setItem("dc_session", JSON.stringify({ id: fresh.id }));
    }
    setEditTarget(null);
    return null;
  }

  function handleGuardarPerms(id, newPerms) {
    saveUsers(getUsers().map(u => u.id === id ? { ...u, perms: newPerms } : u));
    refresh();
    setPermTarget(null);
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: "1200px", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "2px" }}>GESTIÓN DE USUARIOS</h1>
          <p style={{ fontSize: "13px", color: "var(--gray2)", marginTop: "2px" }}>
            {users.filter(u => u.activo).length} activos · {users.length} total · Solo Gerente General y Súper Intendente pueden crear accesos
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "var(--red)", color: "#fff", border: "none",
          borderRadius: "8px", padding: "10px 20px",
          fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "2px", cursor: "pointer",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--red-dark)"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--red)"}
        >+ NUEVO USUARIO</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map(u => {
          const rColor  = getRoles()[u.rolKey]?.color || "var(--gray)";
          const esMismo = u.id === user.id;
          const perms   = resolvePerms(u);

          return (
            <div key={u.id} style={{
              background: "var(--bg2)",
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${u.activo ? rColor : "var(--border2)"}`,
              borderRadius: "8px", padding: "14px 16px",
              display: "flex", alignItems: "center", gap: "14px",
              opacity: u.activo ? 1 : 0.55,
              flexWrap: "wrap",
            }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "8px",
                background: u.activo ? rColor : "var(--border2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: "14px", color: "#fff",
                letterSpacing: "1px", flexShrink: 0,
              }}>{u.avatar}</div>

              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{u.nombre}</span>
                  {esMismo && <Badge color="var(--red)" label="TÚ" />}
                  {!u.activo && <Badge color="var(--gray)" label="INACTIVO" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "var(--gray2)", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>@{u.user}</span>
                  <Badge color={rColor} label={ROLES[u.rolKey]?.label || u.rolKey} />
                </div>
                <div style={{ display: "flex", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
                  {perms.verTodos       && <MiniChip label="Ve todo" color="#60a5fa" />}
                  {perms.crearTareas    && <MiniChip label="Crear tareas" color="#22c55e" />}
                  {perms.eliminarTareas && <MiniChip label="Eliminar tareas" color="#f59e0b" />}
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
                <ActionBtn onClick={() => setEditTarget(u)} title="Editar usuario" color="#60a5fa">✏️</ActionBtn>
                {u.rolKey !== "GG" && u.rolKey !== "SI" && (
                  <ActionBtn onClick={() => setPermTarget(u)} title="Gestionar permisos" color="#a78bfa">🔐</ActionBtn>
                )}
                {!esMismo && (
                  <ActionBtn
                    onClick={() => handleToggleActivo(u.id)}
                    title={u.activo ? "Desactivar" : "Activar"}
                    color={u.activo ? "#f59e0b" : "#22c55e"}
                  >{u.activo ? "⏸" : "▶"}</ActionBtn>
                )}
                {!esMismo && (
                  <ActionBtn onClick={() => setConfirmDel(u.id)} title="Eliminar usuario" color="#ef9a9a">🗑</ActionBtn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {confirmDel && (
        <KModal onClose={() => setConfirmDel(null)} width={400}>
          <ConfirmDelete
            mensaje={`¿Eliminar permanentemente a "${users.find(u => u.id === confirmDel)?.nombre}"? Esta acción no puede deshacerse.`}
            onConfirm={() => handleEliminar(confirmDel)}
            onCancel={() => setConfirmDel(null)}
          />
        </KModal>
      )}

      {showForm && (
        <KModal onClose={() => setShowForm(false)}>
          <NuevoUsuarioForm onCrear={handleCrear} onClose={() => setShowForm(false)} />
        </KModal>
      )}

      {editTarget && (
        <KModal onClose={() => setEditTarget(null)}>
          <EditarUsuarioForm
            target={editTarget}
            isSelf={editTarget.id === user.id}
            onGuardar={(cambios) => handleGuardarEdicion(editTarget.id, cambios)}
            onClose={() => setEditTarget(null)}
          />
        </KModal>
      )}

      {permTarget && (
        <KModal onClose={() => setPermTarget(null)} width={460}>
          <PermsForm
            target={permTarget}
            onGuardar={(perms) => handleGuardarPerms(permTarget.id, perms)}
            onClose={() => setPermTarget(null)}
          />
        </KModal>
      )}
    </div>
  );
}

function MiniChip({ label, color }) {
  return (
    <span style={{
      fontSize: "10px", color, background: `${color}18`,
      border: `1px solid ${color}33`,
      borderRadius: "8px", padding: "2px 7px",
      fontFamily: "'Barlow Condensed'", letterSpacing: "0.5px",
    }}>{label}</span>
  );
}

function ActionBtn({ onClick, title, color, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}20` : "var(--bg3)",
        border: `1px solid ${hov ? color + "55" : "var(--border2)"}`,
        borderRadius: "6px", padding: "7px 10px",
        color: hov ? color : "var(--gray2)",
        cursor: "pointer", fontSize: "14px",
        transition: "all 0.15s",
      }}
    >{children}</button>
  );
}

function EditarUsuarioForm({ target, isSelf, onGuardar, onClose }) {
  const [nombre,   setNombre]   = useState(target.nombre);
  const [usuario,  setUsuario]  = useState(target.user);
  const [pass,     setPass]     = useState("");
  const [rolKey,   setRolKey]   = useState(target.rolKey);
  const [verPass,  setVerPass]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const rolesDisponibles = Object.entries(ROLES);

  function handleGuardar() {
    if (!nombre.trim())  { setError("El nombre no puede estar vacío."); return; }
    if (!usuario.trim()) { setError("El usuario no puede estar vacío."); return; }
    if (pass && pass.length < 6) { setError("La contraseña debe tener mínimo 6 caracteres."); return; }

    const cambios = { nombre: nombre.trim(), user: usuario.trim(), rolKey };
    if (pass) cambios.pass = pass;

    const err = onGuardar(cambios);
    if (err) { setError(err); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "#22c55e", letterSpacing: "2px" }}>CAMBIOS GUARDADOS</h3>
        <p style={{ color: "var(--gray2)", marginTop: "8px", fontSize: "14px" }}>La información del usuario fue actualizada.</p>
        <button onClick={onClose} style={{ ...sharedStyles.btnPrimario, marginTop: "20px", padding: "10px 28px" }}>Cerrar</button>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "6px", paddingRight: "32px" }}>EDITAR USUARIO</h3>
      <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "20px" }}>
        Editando: <strong style={{ color: "var(--text)" }}>{target.nombre}</strong>
      </p>
      {error && (
        <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "14px" }}>
          ⚠️ {error}
        </div>
      )}
      <FormGroup label="Nombre Completo">
        <KInput value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" />
      </FormGroup>
      <FormGroup label="Nombre de Usuario" mt={14}>
        <KInput value={usuario} onChange={e => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="nombre de usuario" />
      </FormGroup>
      <FormGroup label="Nueva Contraseña" mt={14}>
        <div style={{ position: "relative" }}>
          <KInput type={verPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Dejar vacío para no cambiar" style={{ paddingRight: "44px" }} />
          <button type="button" onClick={() => setVerPass(!verPass)} style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--gray)", fontSize: "16px", padding: "4px",
          }}>{verPass ? "🙈" : "👁️"}</button>
        </div>
        <p style={{ fontSize: "11px", color: "var(--gray)", marginTop: "5px" }}>Deja vacío si no deseas cambiar la contraseña actual.</p>
      </FormGroup>
      {!isSelf && (
        <FormGroup label="Rol" mt={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {rolesDisponibles.map(([key, rol]) => {
              const c = rol.color || "#888";
              return (
                <label key={key} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "9px 12px", borderRadius: "7px", cursor: "pointer",
                  background: rolKey === key ? `${c}15` : "var(--bg3)",
                  border: `1px solid ${rolKey === key ? c : "var(--border2)"}`,
                  transition: "all 0.15s",
                }}>
                  <input type="radio" name="rol_edit" value={key} checked={rolKey === key}
                    onChange={() => setRolKey(key)} style={{ accentColor: c }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: rolKey === key ? c : "var(--text)" }}>{rol.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--gray)", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>{key}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </FormGroup>
      )}
      <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={handleGuardar} style={{ ...sharedStyles.btnPrimario, flex: 1 }}>Guardar Cambios</button>
      </div>
    </div>
  );
}

function PermsForm({ target, onGuardar, onClose }) {
  const resolved = resolvePerms(target);
  const [verTodos,       setVerTodos]       = useState(resolved.verTodos);
  const [crearTareas,    setCrearTareas]    = useState(resolved.crearTareas);
  const [eliminarTareas, setEliminarTareas] = useState(resolved.eliminarTareas);
  const [success,        setSuccess]        = useState(false);

  const roleDefaults = ROLES[target.rolKey]?.defaultPerms || {};

  function handleGuardar() {
    onGuardar({ verTodos, crearTareas, eliminarTareas });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 1800);
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "32px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔐</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "#22c55e", letterSpacing: "2px" }}>PERMISOS ACTUALIZADOS</h3>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "6px", paddingRight: "32px" }}>PERMISOS DE ACCESO</h3>
      <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "6px" }}>
        Usuario: <strong style={{ color: "var(--text)" }}>{target.nombre}</strong>
      </p>
      <p style={{ fontSize: "12px", color: "var(--gray)", marginBottom: "22px" }}>
        Rol base: <strong style={{ color: "var(--text-dim)" }}>{ROLES[target.rolKey]?.label}</strong>
        {" — "}los permisos individuales sobreescriben los del rol.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <PermToggle label="Ver tareas de todos" desc="Permite visualizar las tareas de todo el personal, no solo las propias." checked={verTodos} onChange={setVerTodos} defaultVal={roleDefaults.verTodos} color="#60a5fa" />
        <PermToggle label="Crear tareas" desc="Permite crear nuevas tareas y asignarlas a otros miembros del personal." checked={crearTareas} onChange={setCrearTareas} defaultVal={roleDefaults.crearTareas} color="#22c55e" />
        <PermToggle label="Eliminar tareas" desc="Permite eliminar permanentemente tareas del sistema." checked={eliminarTareas} onChange={setEliminarTareas} defaultVal={roleDefaults.eliminarTareas} color="#f59e0b" />
      </div>
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", marginTop: "18px", fontSize: "12px", color: "var(--gray2)", lineHeight: 1.6 }}>
        ℹ️ Los permisos de <strong style={{ color: "var(--text-dim)" }}>Gestión de Personal</strong> y <strong style={{ color: "var(--text-dim)" }}>Ver todos los reportes</strong> están ligados al rol y no pueden cambiarse individualmente.
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={handleGuardar} style={{ ...sharedStyles.btnPrimario, flex: 1 }}>Guardar Permisos</button>
      </div>
    </div>
  );
}

function PermToggle({ label, desc, checked, onChange, defaultVal, color }) {
  const isDefault = checked === defaultVal;
  return (
    <div style={{
      background: checked ? `${color}10` : "var(--bg3)",
      border: `1px solid ${checked ? color + "44" : "var(--border2)"}`,
      borderRadius: "10px", padding: "14px 16px",
      transition: "all 0.2s", cursor: "pointer",
    }} onClick={() => onChange(!checked)}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontWeight: 600, fontSize: "14px", color: checked ? color : "var(--text)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isDefault && (
            <span style={{ fontSize: "9px", color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "2px 7px", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>PERSONALIZADO</span>
          )}
          <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: checked ? color : "var(--border2)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: "3px", left: checked ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>
      </div>
      <p style={{ fontSize: "12px", color: "var(--gray2)", lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}

function NuevoUsuarioForm({ onCrear, onClose }) {
  const [nombre,  setNombre]  = useState("");
  const [usuario, setUsuario] = useState("");
  const [pass,    setPass]    = useState("");
  const [rolKey,  setRolKey]  = useState("GADM");
  const [verPass, setVerPass] = useState(false);
  const [error,   setError]   = useState("");

  const rolesDisponibles = Object.entries(ROLES);

  function handleCrear() {
    if (!nombre.trim())  { setError("El nombre completo es obligatorio."); return; }
    if (!usuario.trim()) { setError("El nombre de usuario es obligatorio."); return; }
    if (pass.length < 6) { setError("La contraseña debe tener mínimo 6 caracteres."); return; }
    const err = onCrear({ nombre: nombre.trim(), user: usuario.trim(), pass, rolKey });
    if (err) setError(err);
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "20px", paddingRight: "32px" }}>NUEVO USUARIO</h3>
      {error && (
        <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "14px" }}>⚠️ {error}</div>
      )}
      <FormGroup label="Nombre Completo">
        <KInput value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. María González" />
      </FormGroup>
      <FormGroup label="Nombre de Usuario" mt={14}>
        <KInput value={usuario} onChange={e => setUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="ej. mgonzalez" />
      </FormGroup>
      <FormGroup label="Contraseña" mt={14}>
        <div style={{ position: "relative" }}>
          <KInput type={verPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ paddingRight: "44px" }} />
          <button type="button" onClick={() => setVerPass(!verPass)} style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--gray)", fontSize: "16px", padding: "4px",
          }}>{verPass ? "🙈" : "👁️"}</button>
        </div>
      </FormGroup>
      <FormGroup label="Rol" mt={14}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {rolesDisponibles.map(([key, rol]) => {
            const c = rol.color || "#888";
            return (
              <label key={key} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "9px 12px", borderRadius: "7px", cursor: "pointer",
                background: rolKey === key ? `${c}15` : "var(--bg3)",
                border: `1px solid ${rolKey === key ? c : "var(--border2)"}`,
                transition: "all 0.15s",
              }}>
                <input type="radio" name="rol_nuevo" value={key} checked={rolKey === key} onChange={() => setRolKey(key)} style={{ accentColor: c }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: rolKey === key ? c : "var(--text)" }}>{rol.label}</div>
                  <div style={{ fontSize: "10px", color: "var(--gray)", fontFamily: "'Barlow Condensed'", letterSpacing: "1px" }}>{key}</div>
                </div>
              </label>
            );
          })}
        </div>
      </FormGroup>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={handleCrear} style={{ ...sharedStyles.btnPrimario, flex: 1 }}>Crear Usuario</button>
      </div>
    </div>
  );
}

export { ActionBtn, MiniChip };
