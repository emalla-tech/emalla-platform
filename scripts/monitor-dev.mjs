import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspace = path.resolve(__dirname, '..');
const runtimeDir = path.join(workspace, '.runtime');

const services = [
  {
    name: 'API',
    key: 'api',
    command: process.execPath,
    args: ['./backend/server.js']
  },
  {
    name: 'Web',
    key: 'web',
    command: process.execPath,
    args: ['./node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '3000']
  }
];

fs.mkdirSync(runtimeDir, { recursive: true });

const children = new Map();

const pidPathFor = (key) => path.join(runtimeDir, `${key}.pid`);
const logPathFor = (key) => path.join(runtimeDir, `${key}.log`);
const errLogPathFor = (key) => path.join(runtimeDir, `${key}-error.log`);

const writeWatcherLog = (message) => {
  const logLine = `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] ${message}\n`;
  fs.appendFileSync(path.join(runtimeDir, 'watcher.log'), logLine);
};

const removeFile = (targetPath) => {
  try {
    fs.rmSync(targetPath, { force: true });
  } catch {
  }
};

const startService = (service) => {
  removeFile(logPathFor(service.key));
  removeFile(errLogPathFor(service.key));

  const child = spawn(service.command, service.args, {
    cwd: workspace,
    detached: false,
    stdio: [
      'ignore',
      fs.openSync(logPathFor(service.key), 'a'),
      fs.openSync(errLogPathFor(service.key), 'a')
    ]
  });

  fs.writeFileSync(pidPathFor(service.key), String(child.pid));
  children.set(service.key, child);
  writeWatcherLog(`${service.name} started with PID ${child.pid}`);

  child.on('exit', () => {
    children.delete(service.key);
    removeFile(pidPathFor(service.key));
    writeWatcherLog(`${service.name} exited and will be restarted`);
  });
};

const ensureRunning = () => {
  for (const service of services) {
    const child = children.get(service.key);
    if (child && !child.killed) {
      continue;
    }
    startService(service);
  }
};

const shutdown = () => {
  for (const service of services) {
    const child = children.get(service.key);
    if (child && !child.killed) {
      try {
        process.kill(child.pid, 'SIGTERM');
      } catch {
      }
    }
    removeFile(pidPathFor(service.key));
  }
  process.exit(0);
};

writeWatcherLog('Supervisor loop started');
ensureRunning();
setInterval(ensureRunning, 3000);

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
