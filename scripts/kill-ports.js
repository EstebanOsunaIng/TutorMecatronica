const { execSync } = require('node:child_process');

const ports = process.argv
  .slice(2)
  .map((v) => Number(v))
  .filter((n) => Number.isFinite(n) && n > 0);

if (ports.length === 0) process.exit(0);

function exec(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function getListeningPidsWindows(port) {
  const out = exec('netstat -ano');
  const pids = new Set();
  for (const raw of out.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (!line.includes('LISTENING')) continue;
    if (!line.includes(`:${port}`)) continue;
    const parts = line.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) pids.add(pid);
  }
  return [...pids];
}

function killWindowsPid(pid) {
  try {
    exec(`taskkill /PID ${pid} /F`);
  } catch {
    // ignore
  }
}

function getListeningPidsUnix(port) {
  try {
    const out = exec(`lsof -ti tcp:${port} -sTCP:LISTEN`);
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killUnixPid(pid) {
  try {
    exec(`kill -9 ${pid}`);
  } catch {
    // ignore
  }
}

for (const port of ports) {
  if (process.platform === 'win32') {
    const pids = getListeningPidsWindows(port);
    for (const pid of pids) killWindowsPid(pid);
  } else {
    const pids = getListeningPidsUnix(port);
    for (const pid of pids) killUnixPid(pid);
  }
}
