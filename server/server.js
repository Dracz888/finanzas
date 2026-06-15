// Servidor Dorado Club — node:http + node:sqlite (sin dependencias externas).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, seed } from './db.js';
import { hashPassword, verifyPassword, newToken } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const DIST = resolve(__dirname, '../dist');
seed();

// ── Métodos de pago (deben coincidir con el frontend) ──
const METODOS = {
  pago_movil:  { esUSD: false }, zelle: { esUSD: true }, dolares: { esUSD: true },
  bancolombia: { esUSD: false }, cop:   { esUSD: false },
};
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function calcUSD(monto, metodoId, tasa) {
  const m = METODOS[metodoId]; const n = parseFloat(monto) || 0;
  if (!m) return 0;
  if (m.esUSD) return n;
  const t = parseFloat(tasa) || 0;
  return t > 0 ? n / t : 0;
}
function mesDe(fecha) { const d = new Date(fecha + 'T00:00:00'); return `${MESES[d.getMonth()]} ${d.getFullYear()}`; }
function semanaDe(fecha) { const d = new Date(fecha + 'T00:00:00'); return `Semana ${Math.floor((d.getDate() - 1) / 7) + 1}`; }

// ─────────────────────────── helpers HTTP ───────────────────────────
function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req) {
  return new Promise((res) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { try { res(data ? JSON.parse(data) : {}); } catch { res({}); } });
  });
}

// ── auth / permisos ──
function cargoRow(key) { return db.prepare('SELECT * FROM cargos WHERE key = ?').get(key); }
function resolvePerms(user) {
  const c = cargoRow(user.rol_key) || {};
  const ind = JSON.parse(user.perms || '{}');
  const pick = (k, col) => (ind[k] !== undefined ? !!ind[k] : !!c[col]);
  return {
    canManageUsers:    !!c.can_manage_users,
    canSeeConsolidado: pick('canSeeConsolidado', 'can_see_consolidado'),
    canRegIngresos:    pick('canRegistrarIngresos', 'can_reg_ingresos'),
    canRegEgresos:     pick('canRegistrarEgresos', 'can_reg_egresos'),
    departamento:      c.departamento, nivel: c.nivel, color: c.color,
  };
}
function userPublic(u) {
  return { id: u.id, user: u.usuario, nombre: u.nombre, rolKey: u.rol_key, avatar: u.avatar, activo: !!u.activo, perms: JSON.parse(u.perms || '{}') };
}
function authUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sesiones WHERE token = ?').get(token);
  if (!s || new Date(s.expira) < new Date()) return null;
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(s.user_id);
  return u && u.activo ? u : null;
}
function addHist(tipo, msg, userId) {
  db.prepare(`INSERT INTO historial (tipo,msg,user_id,fecha,hora) VALUES (?,?,?,date('now'),strftime('%H:%M','now'))`).run(tipo, msg, userId);
}
function canReadKG(p)  { return p.departamento === 'komplex_gym' || p.canSeeConsolidado || p.canManageUsers; }
function canWriteKG(p) { return (p.departamento === 'komplex_gym' && p.canRegIngresos) || p.departamento === 'ejecutivo' || p.canManageUsers; }

// ─────────────────────────── rutas ───────────────────────────
const routes = [];
const R = (method, pattern, handler) => routes.push({ method, parts: pattern.split('/').filter(Boolean), handler });

function match(routeParts, urlParts) {
  if (routeParts.length !== urlParts.length) return null;
  const params = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) params[routeParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    else if (routeParts[i] !== urlParts[i]) return null;
  }
  return params;
}

// ── AUTH ──
R('POST', '/api/login', async (req, res) => {
  const { user, pass } = await readBody(req);
  const u = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(String(user || ''));
  if (!u || !u.activo || !verifyPassword(pass, u.pass_hash)) return send(res, 401, { error: 'Usuario o contraseña incorrectos, o cuenta inactiva.' });
  const token = newToken();
  const expira = new Date(Date.now() + 30 * 864e5).toISOString();
  db.prepare('INSERT INTO sesiones (token,user_id,expira) VALUES (?,?,?)').run(token, u.id, expira);
  addHist('login', `${u.nombre} inició sesión`, u.id);
  send(res, 200, { token, user: userPublic(u), perms: resolvePerms(u) });
});

R('POST', '/api/logout', (req, res) => {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) db.prepare('DELETE FROM sesiones WHERE token = ?').run(h.slice(7));
  send(res, 200, { ok: true });
});

R('GET', '/api/me', (req, res, _p, u) => send(res, 200, { user: userPublic(u), perms: resolvePerms(u) }));

// ── CARGOS ──
function cargoPublic(c) {
  return { key: c.key, label: c.label, color: c.color, departamento: c.departamento, nivel: c.nivel,
    canManageUsers: !!c.can_manage_users, canSeeConsolidado: !!c.can_see_consolidado,
    canRegistrarIngresos: !!c.can_reg_ingresos, canRegistrarEgresos: !!c.can_reg_egresos, system: !!c.sistema };
}
R('GET', '/api/cargos', (req, res) => send(res, 200, db.prepare('SELECT * FROM cargos ORDER BY sistema DESC, key').all().map(cargoPublic)));

R('POST', '/api/cargos', async (req, res, _p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  const key = String(b.key || '').toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 8);
  if (!key || !b.label) return send(res, 400, { error: 'Clave y nombre son obligatorios.' });
  if (cargoRow(key)) return send(res, 409, { error: 'Ya existe un cargo con esa clave.' });
  db.prepare(`INSERT INTO cargos (key,label,color,departamento,nivel,can_manage_users,can_see_consolidado,can_reg_ingresos,can_reg_egresos,sistema)
    VALUES (?,?,?,?,?,0,?,?,?,0)`).run(key, b.label, b.color || '#888', b.departamento || null, 'Gerencia',
    b.canSeeConsolidado ? 1 : 0, b.canRegistrarIngresos ? 1 : 0, b.canRegistrarEgresos ? 1 : 0);
  addHist('cargo_nuevo', `${u.nombre} creó el cargo ${b.label}`, u.id);
  send(res, 201, cargoPublic(cargoRow(key)));
});

R('PUT', '/api/cargos/:key', async (req, res, p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const c = cargoRow(p.key);
  if (!c) return send(res, 404, { error: 'Cargo no encontrado.' });
  if (c.sistema) return send(res, 400, { error: 'Los cargos del sistema no se pueden editar.' });
  const b = await readBody(req);
  db.prepare(`UPDATE cargos SET label=?,color=?,departamento=?,can_see_consolidado=?,can_reg_ingresos=?,can_reg_egresos=? WHERE key=?`)
    .run(b.label ?? c.label, b.color ?? c.color, b.departamento ?? c.departamento,
      b.canSeeConsolidado ? 1 : 0, b.canRegistrarIngresos ? 1 : 0, b.canRegistrarEgresos ? 1 : 0, p.key);
  send(res, 200, cargoPublic(cargoRow(p.key)));
});

R('DELETE', '/api/cargos/:key', (req, res, p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const c = cargoRow(p.key);
  if (!c) return send(res, 404, { error: 'Cargo no encontrado.' });
  if (c.sistema) return send(res, 400, { error: 'Los cargos del sistema no se pueden eliminar.' });
  const n = db.prepare('SELECT COUNT(*) c FROM usuarios WHERE rol_key = ?').get(p.key).c;
  if (n > 0) return send(res, 409, { error: `No se puede eliminar: ${n} perfil(es) usan este cargo.` });
  db.prepare('DELETE FROM cargos WHERE key = ?').run(p.key);
  send(res, 200, { ok: true });
});

// ── USUARIOS / PERFILES ──
R('GET', '/api/usuarios', (req, res, _p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  send(res, 200, db.prepare('SELECT * FROM usuarios ORDER BY id').all().map(userPublic));
});

R('POST', '/api/usuarios', async (req, res, _p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  if (!b.nombre || !b.user || !b.pass) return send(res, 400, { error: 'Nombre, usuario y contraseña son obligatorios.' });
  if (String(b.pass).length < 6) return send(res, 400, { error: 'La contraseña debe tener mínimo 6 caracteres.' });
  if (db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').get(b.user)) return send(res, 409, { error: 'El nombre de usuario ya existe.' });
  if (!cargoRow(b.rolKey)) return send(res, 400, { error: 'Cargo inválido.' });
  const avatar = b.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const info = db.prepare('INSERT INTO usuarios (usuario,pass_hash,nombre,rol_key,avatar) VALUES (?,?,?,?,?)')
    .run(b.user, hashPassword(b.pass), b.nombre, b.rolKey, avatar);
  addHist('usuario_nuevo', `${u.nombre} creó el perfil de ${b.nombre}`, u.id);
  send(res, 201, userPublic(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid)));
});

R('PUT', '/api/usuarios/:id', async (req, res, p, u) => {
  const perms = resolvePerms(u);
  const id = Number(p.id);
  const isSelf = id === u.id;
  if (!perms.canManageUsers && !isSelf) return send(res, 403, { error: 'Sin permiso.' });
  const target = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!target) return send(res, 404, { error: 'Perfil no encontrado.' });
  const b = await readBody(req);
  if (b.user && b.user !== target.usuario && db.prepare('SELECT 1 FROM usuarios WHERE usuario = ? AND id <> ?').get(b.user, id))
    return send(res, 409, { error: 'El nombre de usuario ya existe.' });
  const nombre = b.nombre ?? target.nombre;
  const usuario = b.user ?? target.usuario;
  const avatar = nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rolKey = (perms.canManageUsers && b.rolKey && cargoRow(b.rolKey)) ? b.rolKey : target.rol_key;
  const passHash = b.pass ? hashPassword(b.pass) : target.pass_hash;
  if (b.pass && String(b.pass).length < 6) return send(res, 400, { error: 'La contraseña debe tener mínimo 6 caracteres.' });
  db.prepare('UPDATE usuarios SET nombre=?,usuario=?,avatar=?,rol_key=?,pass_hash=? WHERE id=?')
    .run(nombre, usuario, avatar, rolKey, passHash, id);
  addHist('usuario_edit', `${u.nombre} editó el perfil de ${nombre}`, u.id);
  send(res, 200, userPublic(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)));
});

R('DELETE', '/api/usuarios/:id', (req, res, p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const id = Number(p.id);
  if (id === u.id) return send(res, 400, { error: 'No puedes eliminar tu propio perfil.' });
  const target = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!target) return send(res, 404, { error: 'Perfil no encontrado.' });
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
  addHist('usuario_del', `${u.nombre} eliminó el perfil de ${target.nombre}`, u.id);
  send(res, 200, { ok: true });
});

R('POST', '/api/usuarios/:id/activo', (req, res, p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  const id = Number(p.id);
  if (id === u.id) return send(res, 400, { error: 'No puedes desactivar tu propio perfil.' });
  const t = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  if (!t) return send(res, 404, { error: 'Perfil no encontrado.' });
  db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').run(t.activo ? 0 : 1, id);
  send(res, 200, userPublic(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)));
});

// ── HISTORIAL ──
R('GET', '/api/historial', (req, res, _p, u) => {
  if (!resolvePerms(u).canManageUsers) return send(res, 403, { error: 'Sin permiso.' });
  send(res, 200, db.prepare('SELECT * FROM historial ORDER BY id DESC LIMIT 200').all());
});

// ───────────────────── KOMPLEX GYM ─────────────────────
R('GET', '/api/kg/config', (req, res, _p, u) => {
  if (!canReadKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const planes = db.prepare('SELECT * FROM kg_planes ORDER BY id').all();
  const entrenadores = db.prepare('SELECT * FROM kg_entrenadores ORDER BY id').all();
  const ajustes = {}; for (const a of db.prepare('SELECT * FROM kg_ajustes').all()) ajustes[a.clave] = a.valor;
  send(res, 200, { planes, entrenadores, ajustes });
});

R('POST', '/api/kg/planes', async (req, res, _p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  if (!b.nombre) return send(res, 400, { error: 'El nombre del plan es obligatorio.' });
  const info = db.prepare('INSERT INTO kg_planes (nombre,moneda,precio_normal,precio_convenio) VALUES (?,?,?,?)')
    .run(b.nombre, b.moneda || 'USD', parseFloat(b.precio_normal) || 0, parseFloat(b.precio_convenio) || 0);
  send(res, 201, db.prepare('SELECT * FROM kg_planes WHERE id = ?').get(info.lastInsertRowid));
});
R('PUT', '/api/kg/planes/:id', async (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  db.prepare('UPDATE kg_planes SET nombre=?,moneda=?,precio_normal=?,precio_convenio=? WHERE id=?')
    .run(b.nombre, b.moneda, parseFloat(b.precio_normal) || 0, parseFloat(b.precio_convenio) || 0, Number(p.id));
  send(res, 200, db.prepare('SELECT * FROM kg_planes WHERE id = ?').get(Number(p.id)));
});
R('DELETE', '/api/kg/planes/:id', (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  db.prepare('DELETE FROM kg_planes WHERE id = ?').run(Number(p.id));
  send(res, 200, { ok: true });
});

R('POST', '/api/kg/entrenadores', async (req, res, _p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  if (!b.nombre) return send(res, 400, { error: 'El nombre es obligatorio.' });
  const info = db.prepare('INSERT INTO kg_entrenadores (nombre) VALUES (?)').run(b.nombre);
  send(res, 201, db.prepare('SELECT * FROM kg_entrenadores WHERE id = ?').get(info.lastInsertRowid));
});
R('DELETE', '/api/kg/entrenadores/:id', (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  db.prepare('DELETE FROM kg_entrenadores WHERE id = ?').run(Number(p.id));
  send(res, 200, { ok: true });
});

R('PUT', '/api/kg/ajustes', async (req, res, _p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  const up = db.prepare('INSERT INTO kg_ajustes (clave,valor) VALUES (?,?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor');
  for (const [k, v] of Object.entries(b)) up.run(k, String(v));
  const ajustes = {}; for (const a of db.prepare('SELECT * FROM kg_ajustes').all()) ajustes[a.clave] = a.valor;
  send(res, 200, ajustes);
});

// ── Ingresos por afiliación ──
function precioPlan(planNombre, convenio) {
  const pl = db.prepare('SELECT * FROM kg_planes WHERE nombre = ?').get(planNombre);
  if (!pl) return null;
  return convenio ? pl.precio_convenio : pl.precio_normal;
}
R('GET', '/api/kg/ingresos', (req, res, _p, u, q) => {
  if (!canReadKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const mes = q.get('mes');
  const rows = mes
    ? db.prepare('SELECT * FROM kg_ingresos WHERE mes = ? ORDER BY fecha DESC, id DESC').all(mes)
    : db.prepare('SELECT * FROM kg_ingresos ORDER BY fecha DESC, id DESC').all();
  send(res, 200, rows);
});
R('POST', '/api/kg/ingresos', async (req, res, _p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  if (!b.fecha || !b.nombre) return send(res, 400, { error: 'Fecha y nombre son obligatorios.' });
  const convenio = b.convenio ? 1 : 0;
  const total = calcUSD(b.monto, b.metodo, b.tasa);
  const precio = precioPlan(b.plan, convenio);
  const diferencia = precio == null ? 0 : +(total - precio).toFixed(2);
  const info = db.prepare(`INSERT INTO kg_ingresos
    (fecha,nombre,tipo,plan,convenio,metodo,tasa,monto,total_usd,diferencia,mes,semana,notas,creado_por)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.fecha, b.nombre, b.tipo || 'Nuevo', b.plan || '', convenio, b.metodo || '',
    parseFloat(b.tasa) || 1, parseFloat(b.monto) || 0, +total.toFixed(2), diferencia,
    mesDe(b.fecha), semanaDe(b.fecha), b.notas || '', u.id);
  send(res, 201, db.prepare('SELECT * FROM kg_ingresos WHERE id = ?').get(info.lastInsertRowid));
});
R('PUT', '/api/kg/ingresos/:id', async (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const row = db.prepare('SELECT * FROM kg_ingresos WHERE id = ?').get(Number(p.id));
  if (!row) return send(res, 404, { error: 'Registro no encontrado.' });
  const b = await readBody(req);
  const fecha = b.fecha ?? row.fecha;
  const convenio = (b.convenio ?? row.convenio) ? 1 : 0;
  const monto = b.monto ?? row.monto, metodo = b.metodo ?? row.metodo, tasa = b.tasa ?? row.tasa, plan = b.plan ?? row.plan;
  const total = calcUSD(monto, metodo, tasa);
  const precio = precioPlan(plan, convenio);
  const diferencia = precio == null ? 0 : +(total - precio).toFixed(2);
  db.prepare(`UPDATE kg_ingresos SET fecha=?,nombre=?,tipo=?,plan=?,convenio=?,metodo=?,tasa=?,monto=?,total_usd=?,diferencia=?,mes=?,semana=?,notas=? WHERE id=?`)
    .run(fecha, b.nombre ?? row.nombre, b.tipo ?? row.tipo, plan, convenio, metodo,
      parseFloat(tasa) || 1, parseFloat(monto) || 0, +total.toFixed(2), diferencia,
      mesDe(fecha), semanaDe(fecha), b.notas ?? row.notas, Number(p.id));
  send(res, 200, db.prepare('SELECT * FROM kg_ingresos WHERE id = ?').get(Number(p.id)));
});
R('DELETE', '/api/kg/ingresos/:id', (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  db.prepare('DELETE FROM kg_ingresos WHERE id = ?').run(Number(p.id));
  send(res, 200, { ok: true });
});

// ── Entrenadores personalizados ($10 por afiliado) ──
R('GET', '/api/kg/entrenamientos', (req, res, _p, u, q) => {
  if (!canReadKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const mes = q.get('mes');
  const rows = mes
    ? db.prepare('SELECT * FROM kg_entrenamientos WHERE mes = ? ORDER BY fecha DESC, id DESC').all(mes)
    : db.prepare('SELECT * FROM kg_entrenamientos ORDER BY fecha DESC, id DESC').all();
  send(res, 200, rows);
});
R('POST', '/api/kg/entrenamientos', async (req, res, _p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const b = await readBody(req);
  if (!b.fecha || !b.entrenador) return send(res, 400, { error: 'Fecha y entrenador son obligatorios.' });
  const tarifa = parseFloat((db.prepare("SELECT valor FROM kg_ajustes WHERE clave='tarifa_entrenador'").get() || {}).valor) || 10;
  const monto = b.monto != null ? parseFloat(b.monto) : tarifa;
  const info = db.prepare(`INSERT INTO kg_entrenamientos (fecha,entrenador,afiliado,monto,mes,semana,creado_por)
    VALUES (?,?,?,?,?,?,?)`).run(b.fecha, b.entrenador, b.afiliado || '', monto, mesDe(b.fecha), semanaDe(b.fecha), u.id);
  send(res, 201, db.prepare('SELECT * FROM kg_entrenamientos WHERE id = ?').get(info.lastInsertRowid));
});
R('DELETE', '/api/kg/entrenamientos/:id', (req, res, p, u) => {
  if (!canWriteKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  db.prepare('DELETE FROM kg_entrenamientos WHERE id = ?').run(Number(p.id));
  send(res, 200, { ok: true });
});

// ── Resumen (semanal/mensual) ──
R('GET', '/api/kg/resumen', (req, res, _p, u, q) => {
  if (!canReadKG(resolvePerms(u))) return send(res, 403, { error: 'Sin permiso.' });
  const mes = q.get('mes');
  const ing = mes ? db.prepare('SELECT * FROM kg_ingresos WHERE mes = ?').all(mes) : db.prepare('SELECT * FROM kg_ingresos').all();
  const entr = mes ? db.prepare('SELECT * FROM kg_entrenamientos WHERE mes = ?').all(mes) : db.prepare('SELECT * FROM kg_entrenamientos').all();
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const totalIngresos = +sum(ing.map(r => r.total_usd)).toFixed(2);
  const porMetodo = {}, porPlan = {};
  for (const r of ing) { porMetodo[r.metodo] = +( (porMetodo[r.metodo] || 0) + r.total_usd ).toFixed(2);
                          porPlan[r.plan] = +( (porPlan[r.plan] || 0) + r.total_usd ).toFixed(2); }
  const nuevos = ing.filter(r => r.tipo === 'Nuevo');
  const renovaciones = ing.filter(r => r.tipo === 'Renovación');
  const porEntrenador = {};
  for (const e of entr) porEntrenador[e.entrenador] = (porEntrenador[e.entrenador] || 0) + 1;
  send(res, 200, {
    mes: mes || 'todos',
    totalIngresos, transacciones: ing.length,
    nuevos: nuevos.length, renovaciones: renovaciones.length,
    ticketPromedio: ing.length ? +(totalIngresos / ing.length).toFixed(2) : 0,
    conConvenio: ing.filter(r => r.convenio).length, sinConvenio: ing.filter(r => !r.convenio).length,
    porMetodo, porPlan,
    ingresoEntrenadores: +sum(entr.map(r => r.monto)).toFixed(2),
    afiliadosEntrenados: entr.length, porEntrenador,
  });
});

// ─────────────────────── servidor ───────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

async function serveStatic(req, res, pathname) {
  let fp = normalize(resolve(DIST, '.' + pathname));
  if (!fp.startsWith(DIST)) return send(res, 403, { error: 'forbidden' });
  try {
    let st = await stat(fp).catch(() => null);
    if (!st || st.isDirectory()) { fp = resolve(DIST, 'index.html'); st = await stat(fp).catch(() => null); }
    if (!st) return send(res, 404, { error: 'No encontrado. ¿Ejecutaste "npm run build"?' });
    const data = await readFile(fp);
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(data);
  } catch { send(res, 500, { error: 'server error' }); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    const urlParts = pathname.split('/').filter(Boolean);
    for (const route of routes) {
      if (route.method !== req.method) continue;
      const params = match(route.parts, urlParts);
      if (!params) continue;
      // rutas públicas: solo /api/login
      const isPublic = pathname === '/api/login';
      let user = null;
      if (!isPublic) { user = authUser(req); if (!user) return send(res, 401, { error: 'No autenticado.' }); }
      try { return await route.handler(req, res, params, user, url.searchParams); }
      catch (e) { console.error(e); return send(res, 500, { error: 'Error interno del servidor.' }); }
    }
    return send(res, 404, { error: 'Ruta no encontrada.' });
  }
  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => console.log(`\n  🟡 Dorado Club API → http://localhost:${PORT}\n`));
