// Arranca el backend (API) y el frontend (Vite) a la vez.
import { spawn } from 'node:child_process';

const procs = [
  { name: 'API ', cmd: 'node', args: ['server/server.js'],          color: '\x1b[33m' }, // amarillo
  { name: 'WEB ', cmd: 'npx',  args: ['vite', '--host'],            color: '\x1b[36m' }, // cian
];

const children = procs.map((p) => {
  const child = spawn(p.cmd, p.args, { shell: process.platform === 'win32', env: process.env });
  const tag = `${p.color}[${p.name}]\x1b[0m`;
  child.stdout.on('data', (d) => process.stdout.write(d.toString().split('\n').filter(Boolean).map((l) => `${tag} ${l}`).join('\n') + '\n'));
  child.stderr.on('data', (d) => process.stderr.write(d.toString().split('\n').filter(Boolean).map((l) => `${tag} ${l}`).join('\n') + '\n'));
  child.on('exit', (code) => { console.log(`${tag} terminó (código ${code})`); shutdown(); });
  return child;
});

function shutdown() { for (const c of children) { try { c.kill(); } catch { /* noop */ } } process.exit(); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
