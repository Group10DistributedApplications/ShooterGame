const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

function waitForPort(host, port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const sock = new net.Socket();
      sock.setTimeout(1000);
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 300);
      });
      sock.once('timeout', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 300);
      });
      sock.connect(port, host, () => {
        sock.end();
        resolve();
      });
    })();
  });
}

function spawnCmd(cmd, args, opts = {}) {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  p.on('error', (e) => console.error(`${cmd} error:`, e));
  return p;
}

let backend = null;
let frontend = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('Shutting down processes...');
  try {
    if (frontend) frontend.kill();
  } catch (e) {}
  try {
    if (backend) backend.kill();
  } catch (e) {}
  // give processes a moment to exit
  setTimeout(() => process.exit(code), 1000);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  try {
    console.log('Starting backend...');
    backend = spawnCmd('mvn', ['exec:java'], { cwd: path.resolve(__dirname, '..', 'backend') });

    // wait for backend to open port 3000
    await waitForPort('127.0.0.1', 3000, 30000);
    console.log('Backend listening on :3000');

    console.log('Starting frontend...');
    frontend = spawnCmd('npm', ['run', 'dev'], { cwd: path.resolve(__dirname, '..', 'frontend') });

    frontend.on('exit', (code, signal) => {
      console.log(`Frontend exited with code=${code}` + (signal ? ` signal=${signal}` : ''));
      // do not auto-shutdown backend on frontend exit; wait for user Ctrl-C
    });

    backend.on('exit', (code, signal) => {
      console.log(`Backend exited with code=${code}` + (signal ? ` signal=${signal}` : ''));
      // if backend exits unexpectedly, shut down frontend and exit
      if (!shuttingDown) shutdown(code || 1);
    });
  } catch (e) {
    console.error('Failed to start services:', e && e.message ? e.message : e);
    shutdown(1);
  }
}

main();
