// Base de datos Dorado Club — SQLite nativo (node:sqlite).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../data/dorado.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// ─────────────────────────── Esquema ───────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS cargos (
  key                TEXT PRIMARY KEY,
  label              TEXT NOT NULL,
  color              TEXT,
  departamento       TEXT,
  nivel              TEXT,
  can_manage_users   INTEGER DEFAULT 0,
  can_see_consolidado INTEGER DEFAULT 0,
  can_reg_ingresos   INTEGER DEFAULT 0,
  can_reg_egresos    INTEGER DEFAULT 0,
  sistema            INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS usuarios (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario   TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  rol_key   TEXT NOT NULL,
  avatar    TEXT,
  activo    INTEGER DEFAULT 1,
  perms     TEXT DEFAULT '{}',
  creado    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token   TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expira  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo    TEXT,
  msg     TEXT,
  user_id INTEGER,
  fecha   TEXT,
  hora    TEXT
);

-- ───────── Komplex Gym ─────────
CREATE TABLE IF NOT EXISTS kg_planes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT NOT NULL,
  moneda         TEXT NOT NULL,           -- 'USD' | 'Bs'
  precio_normal  REAL NOT NULL,
  precio_convenio REAL NOT NULL,
  activo         INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kg_entrenadores (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kg_ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

CREATE TABLE IF NOT EXISTS kg_ingresos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha     TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  tipo      TEXT,                          -- 'Nuevo' | 'Renovación'
  plan      TEXT,
  convenio  INTEGER DEFAULT 0,
  metodo    TEXT,
  tasa      REAL DEFAULT 1,
  monto     REAL DEFAULT 0,
  total_usd REAL DEFAULT 0,
  diferencia REAL DEFAULT 0,
  mes       TEXT,
  semana    TEXT,
  notas     TEXT,
  creado_por INTEGER,
  creado    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kg_entrenamientos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha     TEXT NOT NULL,
  entrenador TEXT NOT NULL,
  afiliado  TEXT,
  monto     REAL DEFAULT 10,
  mes       TEXT,
  semana    TEXT,
  creado_por INTEGER,
  creado    TEXT DEFAULT (datetime('now'))
);
`);

// ─────────────────────────── Semilla ───────────────────────────
const CARGOS_SEED = [
  ['GG',   'Gerente General',        '#C9A227', 'ejecutivo',      'Ejecutivo',      1, 1, 1, 1, 1],
  ['SI',   'Súper Intendente',       '#E0C24A', 'ejecutivo',      'Ejecutivo',      1, 1, 1, 1, 1],
  ['ADM',  'Gerente Administrativo', '#60a5fa', 'administracion', 'Administración', 0, 1, 0, 1, 1],
  ['MKT',  'Gerente de Mercadeo',    '#a78bfa', 'mercadeo',       'Gerencia',       0, 0, 0, 1, 1],
  ['RRHH', 'Gerente de RRHH',        '#ec4899', 'rrhh',           'Gerencia',       0, 0, 0, 1, 1],
  ['INM',  'Gerente Inmobiliaria',   '#14b8a6', 'inmobiliaria',   'Gerencia',       0, 0, 1, 1, 1],
  ['CON',  'Gerente de Condominio',  '#f97316', 'condominio',     'Gerencia',       0, 0, 1, 1, 1],
  ['KGYM', 'Gerente de Komplex Gym', '#D32F2F', 'komplex_gym',    'Gerencia',       0, 0, 1, 1, 1],
  ['DFC',  'Gerente de DFC',         '#22c55e', 'dfc',            'Gerencia',       0, 0, 1, 1, 1],
  ['SB',   'Gerente de Sport Bar',   '#f59e0b', 'sport_bar',      'Gerencia',       0, 0, 1, 1, 1],
];

const USERS_SEED = [
  ['gerencia.general', 'Roberto Salazar', 'GG',   'RS'],
  ['superintendente',  'Patricia Oviedo', 'SI',   'PO'],
  ['administracion',   'Luis Camacho',    'ADM',  'LC'],
  ['mercadeo',         'Valeria Torres',  'MKT',  'VT'],
  ['rrhh',             'Daniela Pérez',   'RRHH', 'DP'],
  ['inmobiliaria',     'Andrés Quintero', 'INM',  'AQ'],
  ['condominio',       'Marta Rondón',    'CON',  'MR'],
  ['komplexgym',       'Carlos Herrera',  'KGYM', 'CH'],
  ['dfc',              'José Ríos',       'DFC',  'JR'],
  ['sportbar',         'Gabriel Méndez',  'SB',   'GM'],
];

// Planes Komplex Gym (precio en USD / USD equivalente)
const PLANES_SEED = [
  ['Diurno',               'USD', 40, 20],
  ['Tarde',                'USD', 40, 20],
  ['Ilimitado',            'USD', 50, 25],
  ['Turista',              'USD', 25, 13],
  ['Día de Entrenamiento', 'USD', 5,  3 ],
  ['Diurno Bs',            'Bs',  55, 28],
  ['Tarde Bs',             'Bs',  55, 28],
  ['Ilimitado Bs',         'Bs',  65, 33],
  ['Turista Bs',           'Bs',  33, 17],
  ['Día Bs',               'Bs',  7,  4 ],
];

const ENTRENADORES_SEED = ['Raul', 'Maria', 'Deivys', 'Anderson', 'Luis'];

export function seed() {
  const count = db.prepare('SELECT COUNT(*) c FROM cargos').get().c;
  if (count > 0) return;

  const insCargo = db.prepare(`INSERT INTO cargos
    (key,label,color,departamento,nivel,can_manage_users,can_see_consolidado,can_reg_ingresos,can_reg_egresos,sistema)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  for (const c of CARGOS_SEED) insCargo.run(...c);

  const insUser = db.prepare(`INSERT INTO usuarios (usuario,pass_hash,nombre,rol_key,avatar)
    VALUES (?,?,?,?,?)`);
  for (const [usuario, nombre, rol, avatar] of USERS_SEED) {
    insUser.run(usuario, hashPassword('dorado2026'), nombre, rol, avatar);
  }

  const insPlan = db.prepare('INSERT INTO kg_planes (nombre,moneda,precio_normal,precio_convenio) VALUES (?,?,?,?)');
  for (const p of PLANES_SEED) insPlan.run(...p);

  const insEntr = db.prepare('INSERT INTO kg_entrenadores (nombre) VALUES (?)');
  for (const e of ENTRENADORES_SEED) insEntr.run(e);

  const insAjuste = db.prepare('INSERT INTO kg_ajustes (clave,valor) VALUES (?,?)');
  insAjuste.run('tarifa_entrenador', '10');     // USD por afiliado entrenado
  insAjuste.run('descuento_convenio', '50');    // % (referencia)

  db.prepare(`INSERT INTO historial (tipo,msg,fecha,hora) VALUES ('sistema','Base de datos Dorado Club inicializada',date('now'),strftime('%H:%M','now'))`).run();
  console.log('  ✓ Base de datos sembrada (10 cargos, 10 usuarios, planes y entrenadores Komplex).');
}
