import { spawn } from 'child_process';

const children = [];

const start = (label, command, args) => {
  const child = spawn(command, args, {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
  });

  children.push(child);
  return child;
};

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start('api', process.execPath, ['./backend/server.js']);
start('vite', process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '3000']);
