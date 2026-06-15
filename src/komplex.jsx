import { useState, useEffect } from 'react';
import { api } from './api.js';
import {
  METODOS_PAGO, metodoLabel, calcUSD, MESES, mesActual, resolvePerms, puedeEscribirKG,
} from './data.js';
import { sharedStyles, KModal, FormGroup, KInput, Badge, Spinner, ConfirmDelete } from './shared.jsx';

const ROJO = "#D32F2F";

/* opciones de mes: actual + 11 anteriores */
function mesesOpciones() {
  const out = []; const d = new Date();
  for (let i = 0; i < 12; i++) { out.push(`${MESES[d.getMonth()]} ${d.getFullYear()}`); d.setMonth(d.getMonth() - 1); }
  return out;
}

function MesSelector({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      ...sharedStyles.input, width: "auto", minWidth: "160px", padding: "9px 12px", cursor: "pointer",
    }}>
      {mesesOpciones().map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

function fmt(n) { return (Math.round((n || 0) * 100) / 100).toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }

/* ═══════════════════════ MÓDULO KOMPLEX GYM ═══════════════════════ */
export function KomplexModule({ user }) {
  const perms = resolvePerms(user);
  const canWrite = puedeEscribirKG(perms);
  const [config, setConfig] = useState(null);
  const [cfgTick, setCfgTick] = useState(0);
  const [sub, setSub] = useState("ingresos");
  const [err, setErr] = useState("");
  const recargarConfig = () => setCfgTick(t => t + 1);

  useEffect(() => {
    let alive = true;
    api.kgConfig().then(d => { if (alive) setConfig(d); }).catch(e => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [cfgTick]);

  const tabs = [
    { id: "ingresos",      label: "INGRESOS"      },
    { id: "entrenadores",  label: "ENTRENADORES"  },
    { id: "resumen",       label: "RESUMEN"       },
    { id: "configuracion", label: "CONFIGURACIÓN" },
  ];

  if (err) return <div style={{ padding: "40px", textAlign: "center", color: "#ef9a9a" }}>⚠️ {err}</div>;
  if (!config) return <div style={{ padding: "60px", textAlign: "center", color: "var(--gray2)" }}><Spinner size={22} /><p style={{ marginTop: "12px" }}>Cargando Komplex Gym…</p></div>;

  return (
    <div>
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "14px 20px 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "22px" }}>🏋️</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", letterSpacing: "1px" }}>KOMPLEX GYM</h1>
            {!canWrite && <Badge color="#60a5fa" label="SOLO LECTURA" />}
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setSub(t.id)} style={{
                background: "none", border: "none",
                borderBottom: sub === t.id ? `2px solid ${ROJO}` : "2px solid transparent",
                padding: "8px 16px 10px", cursor: "pointer",
                color: sub === t.id ? ROJO : "var(--gray2)",
                fontFamily: "var(--font-display)", fontSize: "13px", letterSpacing: "1.5px", whiteSpace: "nowrap",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {sub === "ingresos"      && <IngresosView      config={config} canWrite={canWrite} />}
        {sub === "entrenadores"  && <EntrenadoresView  config={config} canWrite={canWrite} />}
        {sub === "resumen"       && <ResumenView />}
        {sub === "configuracion" && <ConfigView config={config} canWrite={canWrite} onChange={recargarConfig} />}
      </div>
    </div>
  );
}

/* ───────────────────────── INGRESOS ───────────────────────── */
function IngresosView({ config, canWrite }) {
  const [mes, setMes]   = useState(mesActual());
  const [rows, setRows] = useState(null);
  const [tick, setTick] = useState(0);
  const [show, setShow] = useState(false);
  const [del, setDel]   = useState(null);
  const reload = () => setTick(t => t + 1);

  useEffect(() => { let alive = true; api.kgIngresos(mes).then(d => { if (alive) setRows(d); }); return () => { alive = false; }; }, [mes, tick]);

  const totalUSD = (rows || []).reduce((s, r) => s + r.total_usd, 0);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <MesSelector value={mes} onChange={setMes} />
          <span style={{ fontSize: "13px", color: "var(--gray2)" }}>{(rows || []).length} registros · <strong style={{ color: "#22c55e" }}>${fmt(totalUSD)}</strong> USD</span>
        </div>
        {canWrite && <button onClick={() => setShow(true)} style={{ ...sharedStyles.btnPrimario, background: ROJO, color: "#fff", padding: "10px 18px" }}>+ NUEVO INGRESO</button>}
      </div>

      {rows === null ? <Cargando /> : rows.length === 0 ? <Vacio texto="Sin ingresos en este mes." /> : (
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "860px" }}>
            <thead>
              <tr style={{ background: "var(--bg2)", textAlign: "left" }}>
                {["Fecha","Nombre","Tipo","Plan","Conv.","Método","Tasa","Monto","USD","Dif.","Notas",""].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>{r.fecha}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{r.nombre}</td>
                  <td style={td}><Badge color={r.tipo === "Nuevo" ? "#22c55e" : "#60a5fa"} label={r.tipo} /></td>
                  <td style={td}>{r.plan}</td>
                  <td style={td}>{r.convenio ? "Sí" : "—"}</td>
                  <td style={td}>{metodoLabel(r.metodo)}</td>
                  <td style={tdNum}>{fmt(r.tasa)}</td>
                  <td style={tdNum}>{fmt(r.monto)}</td>
                  <td style={{ ...tdNum, color: "#22c55e", fontWeight: 600 }}>${fmt(r.total_usd)}</td>
                  <td style={{ ...tdNum, color: r.diferencia === 0 ? "var(--gray)" : r.diferencia < 0 ? "#ef9a9a" : "#f59e0b", fontWeight: 600 }}>{r.diferencia === 0 ? "0" : fmt(r.diferencia)}</td>
                  <td style={{ ...td, color: "var(--gray2)", maxWidth: "160px" }}>{r.notas}</td>
                  <td style={td}>{canWrite && <button onClick={() => setDel(r)} title="Eliminar" style={btnDel}>🗑</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show && <KModal onClose={() => setShow(false)} width={560}><IngresoForm config={config} onSaved={() => { setShow(false); reload(); }} onClose={() => setShow(false)} /></KModal>}
      {del && <KModal onClose={() => setDel(null)} width={400}><ConfirmDelete mensaje={`¿Eliminar el ingreso de "${del.nombre}"?`} onConfirm={async () => { await api.kgEliminarIngreso(del.id); setDel(null); reload(); }} onCancel={() => setDel(null)} /></KModal>}
    </div>
  );
}

function IngresoForm({ config, onSaved, onClose }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha]     = useState(hoy);
  const [nombre, setNombre]   = useState("");
  const [tipo, setTipo]       = useState("Nuevo");
  const [plan, setPlan]       = useState(config.planes[0]?.nombre || "");
  const [convenio, setConv]   = useState(false);
  const [metodo, setMetodo]   = useState(METODOS_PAGO[0].id);
  const [tasa, setTasa]       = useState("");
  const [monto, setMonto]     = useState("");
  const [notas, setNotas]     = useState("");
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);

  const metodoObj = METODOS_PAGO.find(m => m.id === metodo);
  const esUSD = metodoObj?.esUSD;
  const tasaEf = esUSD ? 1 : (parseFloat(tasa) || 0);
  const totalUSD = calcUSD(monto, metodo, tasaEf);
  const planObj = config.planes.find(p => p.nombre === plan);
  const precio = planObj ? (convenio ? planObj.precio_convenio : planObj.precio_normal) : null;
  const diferencia = precio == null ? null : totalUSD - precio;

  async function guardar() {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!esUSD && tasaEf <= 0) { setError("Indica la tasa de cambio."); return; }
    if ((parseFloat(monto) || 0) <= 0) { setError("Indica el monto."); return; }
    setSaving(true);
    try {
      await api.kgCrearIngreso({ fecha, nombre: nombre.trim(), tipo, plan, convenio, metodo, tasa: tasaEf, monto: parseFloat(monto), notas });
      onSaved();
    } catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "16px", paddingRight: "32px" }}>NUEVO INGRESO</h3>
      {error && <ErrBox msg={error} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FormGroup label="Fecha"><KInput type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></FormGroup>
        <FormGroup label="Nombre"><KInput value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del afiliado" /></FormGroup>
      </div>
      <FormGroup label="Tipo" mt={12}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Nuevo", "Renovación"].map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)} style={segBtn(tipo === t)}>{t}</button>
          ))}
        </div>
      </FormGroup>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", marginTop: "12px", alignItems: "end" }}>
        <FormGroup label="Plan">
          <select value={plan} onChange={e => setPlan(e.target.value)} style={sharedStyles.input}>
            {config.planes.map(p => <option key={p.id} value={p.nombre}>{p.nombre} ({p.moneda})</option>)}
          </select>
        </FormGroup>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", background: convenio ? "rgba(34,197,94,0.1)" : "var(--bg3)", border: `1px solid ${convenio ? "#22c55e55" : "var(--border2)"}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
          <input type="checkbox" checked={convenio} onChange={e => setConv(e.target.checked)} style={{ accentColor: "#22c55e" }} /> Convenio
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
        <FormGroup label="Método de pago">
          <select value={metodo} onChange={e => { setMetodo(e.target.value); }} style={sharedStyles.input}>
            {METODOS_PAGO.map(m => <option key={m.id} value={m.id}>{m.label} ({m.moneda})</option>)}
          </select>
        </FormGroup>
        <FormGroup label={`Tasa ${esUSD ? "(USD = 1)" : ""}`}>
          <KInput type="number" value={esUSD ? 1 : tasa} onChange={e => setTasa(e.target.value)} placeholder="0" style={esUSD ? { opacity: 0.6 } : undefined} />
        </FormGroup>
        <FormGroup label={`Monto (${metodoObj?.moneda})`}><KInput type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" /></FormGroup>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
        <Calc label="Total USD" value={`$${fmt(totalUSD)}`} color="#22c55e" />
        {diferencia != null && <Calc label="Diferencia vs plan" value={diferencia === 0 ? "$0 ✓" : `$${fmt(diferencia)}`} color={diferencia === 0 ? "#22c55e" : diferencia < 0 ? "#ef9a9a" : "#f59e0b"} />}
      </div>

      <FormGroup label="Notas" mt={12}><KInput value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" /></FormGroup>
      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={guardar} disabled={saving} style={{ ...sharedStyles.btnPrimario, background: ROJO, color: "#fff", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>{saving ? <><Spinner /> Guardando…</> : "Guardar Ingreso"}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── ENTRENADORES ───────────────────────── */
function EntrenadoresView({ config, canWrite }) {
  const [mes, setMes]   = useState(mesActual());
  const [rows, setRows] = useState(null);
  const [tick, setTick] = useState(0);
  const [show, setShow] = useState(false);
  const [del, setDel]   = useState(null);
  const reload = () => setTick(t => t + 1);

  useEffect(() => { let alive = true; api.kgEntrenamientos(mes).then(d => { if (alive) setRows(d); }); return () => { alive = false; }; }, [mes, tick]);

  const total = (rows || []).reduce((s, r) => s + r.monto, 0);

  return (
    <div style={{ padding: "20px" }}>
      <p style={{ fontSize: "13px", color: "var(--gray2)", marginBottom: "14px" }}>Cada afiliado entrenado paga <strong style={{ color: "var(--text)" }}>${config.ajustes.tarifa_entrenador || 10}</strong> al entrenador.</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <MesSelector value={mes} onChange={setMes} />
          <span style={{ fontSize: "13px", color: "var(--gray2)" }}>{(rows || []).length} sesiones · <strong style={{ color: "#22c55e" }}>${fmt(total)}</strong> USD</span>
        </div>
        {canWrite && <button onClick={() => setShow(true)} style={{ ...sharedStyles.btnPrimario, background: ROJO, color: "#fff", padding: "10px 18px" }}>+ REGISTRAR</button>}
      </div>

      {rows === null ? <Cargando /> : rows.length === 0 ? <Vacio texto="Sin entrenamientos en este mes." /> : (
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "560px" }}>
            <thead><tr style={{ background: "var(--bg2)", textAlign: "left" }}>{["Fecha","Entrenador","Afiliado","Monto","Semana",""].map((h,i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>{r.fecha}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{r.entrenador}</td>
                  <td style={td}>{r.afiliado || "—"}</td>
                  <td style={{ ...tdNum, color: "#22c55e", fontWeight: 600 }}>${fmt(r.monto)}</td>
                  <td style={td}>{r.semana}</td>
                  <td style={td}>{canWrite && <button onClick={() => setDel(r)} title="Eliminar" style={btnDel}>🗑</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show && <KModal onClose={() => setShow(false)} width={460}><EntrenamientoForm config={config} onSaved={() => { setShow(false); reload(); }} onClose={() => setShow(false)} /></KModal>}
      {del && <KModal onClose={() => setDel(null)} width={400}><ConfirmDelete mensaje={`¿Eliminar el registro de ${del.entrenador}?`} onConfirm={async () => { await api.kgEliminarEntrenamiento(del.id); setDel(null); reload(); }} onCancel={() => setDel(null)} /></KModal>}
    </div>
  );
}

function EntrenamientoForm({ config, onSaved, onClose }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(hoy);
  const [entrenador, setEntrenador] = useState(config.entrenadores[0]?.nombre || "");
  const [afiliado, setAfiliado] = useState("");
  const [monto, setMonto] = useState(config.ajustes.tarifa_entrenador || "10");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (!entrenador) { setError("Selecciona un entrenador."); return; }
    setSaving(true);
    try { await api.kgCrearEntrenamiento({ fecha, entrenador, afiliado, monto: parseFloat(monto) || 0 }); onSaved(); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "2px", marginBottom: "16px", paddingRight: "32px" }}>REGISTRAR ENTRENAMIENTO</h3>
      {error && <ErrBox msg={error} />}
      <FormGroup label="Fecha"><KInput type="date" value={fecha} onChange={e => setFecha(e.target.value)} /></FormGroup>
      <FormGroup label="Entrenador" mt={12}>
        <select value={entrenador} onChange={e => setEntrenador(e.target.value)} style={sharedStyles.input}>
          {config.entrenadores.map(en => <option key={en.id} value={en.nombre}>{en.nombre}</option>)}
        </select>
      </FormGroup>
      <FormGroup label="Afiliado entrenado" mt={12}><KInput value={afiliado} onChange={e => setAfiliado(e.target.value)} placeholder="Nombre (opcional)" /></FormGroup>
      <FormGroup label="Monto (USD)" mt={12}><KInput type="number" value={monto} onChange={e => setMonto(e.target.value)} /></FormGroup>
      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
        <button onClick={onClose} style={{ ...sharedStyles.btnSecundario, flex: 1 }}>Cancelar</button>
        <button onClick={guardar} disabled={saving} style={{ ...sharedStyles.btnPrimario, background: ROJO, color: "#fff", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>{saving ? <><Spinner /> Guardando…</> : "Registrar"}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── RESUMEN ───────────────────────── */
function ResumenView() {
  const [mes, setMes] = useState(mesActual());
  const [r, setR] = useState(null);
  useEffect(() => { let alive = true; api.kgResumen(mes).then(d => { if (alive) setR(d); }); return () => { alive = false; }; }, [mes]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "18px" }}><MesSelector value={mes} onChange={setMes} /></div>
      {!r ? <Cargando /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "22px" }}>
            <Stat label="Total Ingresos" value={`$${fmt(r.totalIngresos)}`} color="#22c55e" />
            <Stat label="Transacciones" value={r.transacciones} />
            <Stat label="Nuevos" value={r.nuevos} color="#22c55e" />
            <Stat label="Renovaciones" value={r.renovaciones} color="#60a5fa" />
            <Stat label="Ticket Prom." value={`$${fmt(r.ticketPromedio)}`} />
            <Stat label="Ingreso Entrenadores" value={`$${fmt(r.ingresoEntrenadores)}`} color="#f59e0b" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <Desglose titulo="Ingresos por método de pago" data={r.porMetodo} fmtKey={metodoLabel} money />
            <Desglose titulo="Ingresos por plan" data={r.porPlan} money />
            <Desglose titulo="Afiliados por entrenador" data={r.porEntrenador} />
          </div>
        </>
      )}
    </div>
  );
}

function Desglose({ titulo, data, fmtKey = (x) => x, money }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v);
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
      <h3 style={{ fontFamily: "var(--font-cond)", fontSize: "12px", letterSpacing: "2px", color: "var(--gray2)", textTransform: "uppercase", marginBottom: "12px" }}>{titulo}</h3>
      {entries.length === 0 ? <p style={{ fontSize: "12px", color: "var(--gray)" }}>Sin datos.</p> : entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
          <span style={{ color: "var(--text-dim)" }}>{fmtKey(k)}</span>
          <span style={{ fontWeight: 600 }}>{money ? `$${fmt(v)}` : v}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── CONFIGURACIÓN ───────────────────────── */
function ConfigView({ config, canWrite, onChange }) {
  const [tarifa, setTarifa] = useState(config.ajustes.tarifa_entrenador || "10");
  const [descuento, setDescuento] = useState(config.ajustes.descuento_convenio || "50");
  const [nuevoPlan, setNuevoPlan] = useState({ nombre: "", moneda: "USD", precio_normal: "", precio_convenio: "" });
  const [nuevoEntr, setNuevoEntr] = useState("");
  const [msg, setMsg] = useState("");

  async function guardarAjustes() {
    await api.kgGuardarAjustes({ tarifa_entrenador: tarifa, descuento_convenio: descuento });
    setMsg("Ajustes guardados ✓"); setTimeout(() => setMsg(""), 2000); onChange();
  }
  async function addPlan() {
    if (!nuevoPlan.nombre) return;
    await api.kgCrearPlan(nuevoPlan); setNuevoPlan({ nombre: "", moneda: "USD", precio_normal: "", precio_convenio: "" }); onChange();
  }
  async function addEntr() { if (!nuevoEntr.trim()) return; await api.kgCrearEntrenador({ nombre: nuevoEntr.trim() }); setNuevoEntr(""); onChange(); }

  return (
    <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
      {/* Ajustes */}
      <div style={card}>
        <h3 style={cardTitle}>Ajustes</h3>
        <FormGroup label="Tarifa por entrenamiento (USD)"><KInput type="number" value={tarifa} onChange={e => setTarifa(e.target.value)} /></FormGroup>
        <FormGroup label="Descuento convenio (%)" mt={10}><KInput type="number" value={descuento} onChange={e => setDescuento(e.target.value)} /></FormGroup>
        {canWrite && <button onClick={guardarAjustes} style={{ ...sharedStyles.btnPrimario, background: ROJO, color: "#fff", marginTop: "14px", width: "100%" }}>Guardar ajustes</button>}
        {msg && <p style={{ color: "#22c55e", fontSize: "13px", marginTop: "8px", textAlign: "center" }}>{msg}</p>}
      </div>

      {/* Entrenadores */}
      <div style={card}>
        <h3 style={cardTitle}>Entrenadores</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
          {config.entrenadores.map(en => (
            <div key={en.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }}>
              <span style={{ fontSize: "13px" }}>{en.nombre}</span>
              {canWrite && <button onClick={async () => { await api.kgEliminarEntrenador(en.id); onChange(); }} style={btnDel}>🗑</button>}
            </div>
          ))}
        </div>
        {canWrite && (
          <div style={{ display: "flex", gap: "8px" }}>
            <KInput value={nuevoEntr} onChange={e => setNuevoEntr(e.target.value)} placeholder="Nuevo entrenador" />
            <button onClick={addEntr} style={{ ...sharedStyles.btnSecundario, whiteSpace: "nowrap" }}>+ Añadir</button>
          </div>
        )}
      </div>

      {/* Planes */}
      <div style={{ ...card, gridColumn: "1 / -1" }}>
        <h3 style={cardTitle}>Planes y precios (USD / USD equivalente)</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "520px" }}>
            <thead><tr style={{ textAlign: "left", color: "var(--gray2)" }}>{["Plan","Moneda","Normal","Convenio",""].map((h,i) => <th key={i} style={{ ...th, background: "transparent" }}>{h}</th>)}</tr></thead>
            <tbody>
              {config.planes.map(p => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{p.nombre}</td>
                  <td style={td}><Badge color={p.moneda === "USD" ? "#22c55e" : "#f59e0b"} label={p.moneda} /></td>
                  <td style={tdNum}>${fmt(p.precio_normal)}</td>
                  <td style={tdNum}>${fmt(p.precio_convenio)}</td>
                  <td style={td}>{canWrite && <button onClick={async () => { await api.kgEliminarPlan(p.id); onChange(); }} style={btnDel}>🗑</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canWrite && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", marginTop: "14px", alignItems: "end" }}>
            <FormGroup label="Nombre"><KInput value={nuevoPlan.nombre} onChange={e => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })} placeholder="Plan" /></FormGroup>
            <FormGroup label="Moneda">
              <select value={nuevoPlan.moneda} onChange={e => setNuevoPlan({ ...nuevoPlan, moneda: e.target.value })} style={sharedStyles.input}>
                <option value="USD">USD</option><option value="Bs">Bs</option>
              </select>
            </FormGroup>
            <FormGroup label="Normal"><KInput type="number" value={nuevoPlan.precio_normal} onChange={e => setNuevoPlan({ ...nuevoPlan, precio_normal: e.target.value })} /></FormGroup>
            <FormGroup label="Convenio"><KInput type="number" value={nuevoPlan.precio_convenio} onChange={e => setNuevoPlan({ ...nuevoPlan, precio_convenio: e.target.value })} /></FormGroup>
            <button onClick={addPlan} style={{ ...sharedStyles.btnSecundario, whiteSpace: "nowrap" }}>+ Añadir</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── auxiliares ───────────────────────── */
const th = { padding: "11px 12px", fontFamily: "var(--font-cond)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--gray2)", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", color: "var(--text-dim)" };
const tdNum = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const btnDel = { background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: 0.7 };
const card = { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px" };
const cardTitle = { fontFamily: "var(--font-display)", fontSize: "16px", letterSpacing: "1px", marginBottom: "14px" };

function segBtn(active) {
  return { flex: 1, padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
    background: active ? "rgba(211,47,47,0.15)" : "var(--bg3)", border: `1px solid ${active ? ROJO : "var(--border2)"}`,
    color: active ? ROJO : "var(--gray2)" };
}
function Calc({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: "140px", background: `${color}12`, border: `1px solid ${color}33`, borderRadius: "10px", padding: "10px 14px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--gray2)", fontFamily: "var(--font-cond)" }}>{label}</div>
      <div style={{ fontSize: "20px", fontFamily: "var(--font-display)", color }}>{value}</div>
    </div>
  );
}
function Stat({ label, value, color = "var(--text)" }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 18px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--gray2)", fontFamily: "var(--font-cond)" }}>{label}</div>
      <div style={{ fontSize: "26px", fontFamily: "var(--font-display)", color, marginTop: "4px" }}>{value}</div>
    </div>
  );
}
function Cargando() { return <div style={{ padding: "50px", textAlign: "center", color: "var(--gray2)" }}><Spinner size={20} /></div>; }
function Vacio({ texto }) { return <div style={{ padding: "40px", textAlign: "center", color: "var(--gray)", background: "var(--bg2)", border: "1px dashed var(--border2)", borderRadius: "10px" }}>{texto}</div>; }
function ErrBox({ msg }) { return <div style={{ background: "rgba(211,47,47,0.12)", border: "1px solid rgba(211,47,47,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#ef9a9a", marginBottom: "14px" }}>⚠️ {msg}</div>; }
