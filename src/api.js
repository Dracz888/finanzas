// Cliente de API Dorado Club — habla con el backend (/api).
const BASE = '/api';
let token = localStorage.getItem('dc_token') || null;

export function getToken() { return token; }
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('dc_token', t);
  else localStorage.removeItem('dc_token');
}

async function req(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }
  if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);
  return data;
}

const qs = (mes) => (mes ? `?mes=${encodeURIComponent(mes)}` : '');

export const api = {
  // auth
  login:  (user, pass) => req('POST', '/login', { user, pass }),
  me:     () => req('GET', '/me'),
  logout: () => req('POST', '/logout'),
  // cargos
  cargos:        () => req('GET', '/cargos'),
  crearCargo:    (d) => req('POST', '/cargos', d),
  editarCargo:   (k, d) => req('PUT', '/cargos/' + k, d),
  eliminarCargo: (k) => req('DELETE', '/cargos/' + k),
  // usuarios
  usuarios:        () => req('GET', '/usuarios'),
  crearUsuario:    (d) => req('POST', '/usuarios', d),
  editarUsuario:   (id, d) => req('PUT', '/usuarios/' + id, d),
  eliminarUsuario: (id) => req('DELETE', '/usuarios/' + id),
  toggleUsuario:   (id) => req('POST', `/usuarios/${id}/activo`),
  historial:       () => req('GET', '/historial'),
  // Komplex Gym
  kgConfig:            () => req('GET', '/kg/config'),
  kgCrearPlan:         (d) => req('POST', '/kg/planes', d),
  kgEditarPlan:        (id, d) => req('PUT', '/kg/planes/' + id, d),
  kgEliminarPlan:      (id) => req('DELETE', '/kg/planes/' + id),
  kgCrearEntrenador:   (d) => req('POST', '/kg/entrenadores', d),
  kgEliminarEntrenador:(id) => req('DELETE', '/kg/entrenadores/' + id),
  kgGuardarAjustes:    (d) => req('PUT', '/kg/ajustes', d),
  kgIngresos:          (mes) => req('GET', '/kg/ingresos' + qs(mes)),
  kgCrearIngreso:      (d) => req('POST', '/kg/ingresos', d),
  kgEditarIngreso:     (id, d) => req('PUT', '/kg/ingresos/' + id, d),
  kgEliminarIngreso:   (id) => req('DELETE', '/kg/ingresos/' + id),
  kgEntrenamientos:    (mes) => req('GET', '/kg/entrenamientos' + qs(mes)),
  kgCrearEntrenamiento:(d) => req('POST', '/kg/entrenamientos', d),
  kgEliminarEntrenamiento:(id) => req('DELETE', '/kg/entrenamientos/' + id),
  kgResumen:           (mes) => req('GET', '/kg/resumen' + qs(mes)),
};
