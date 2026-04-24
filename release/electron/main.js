/**
 * AI Workspace Configurator — Electron Main Process
 * Bridges the React web UI to native Windows system APIs
 */

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// ─── Browser Launcher ───
const browserPaths = {
  chrome: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
  edge: [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  firefox: [
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
  ],
  chromium: [
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
  ],
};

function findBrowserExe(browserId) {
  const paths = browserPaths[browserId];
  if (!paths) return null;
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ─── Config ───
const isDev = process.env.NODE_ENV === 'development';
const APP_NAME = 'AI Workspace Configurator';
// Read version from release/package.json (one level up from electron/)
let APP_VERSION = '0.0.0';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  APP_VERSION = pkg.version || APP_VERSION;
} catch { /* fallback to default */ }

// ─── Single Instance Lock ───
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('Another instance is already running.');
  app.quit();
  process.exit(0);
}

// ─── Global State ───
let mainWindow = null;
let activeProcess = null;
const workspaceDir = path.join(os.homedir(), '.ai-workspace');
const scriptsDir = path.join(workspaceDir, 'scripts');
const logsDir = path.join(workspaceDir, 'logs');
const artifactsDir = path.join(workspaceDir, 'artifacts');

// ─── Ensure workspace dirs ───
function ensureWorkspace() {
  [workspaceDir, scriptsDir, logsDir, artifactsDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

// ─── Extract bundled scripts ───
function extractScripts() {
  const bundledScripts = path.join(__dirname, '..', 'scripts');
  if (fs.existsSync(bundledScripts)) {
    const files = fs.readdirSync(bundledScripts);
    files.forEach((f) => {
      const src = path.join(bundledScripts, f);
      const dst = path.join(scriptsDir, f);
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    });
  }
}

// ─── Create Main Window ───
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: `${APP_NAME} v${APP_VERSION}`,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the built app
  const indexPath = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
  mainWindow.loadURL(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (activeProcess) {
      activeProcess.kill();
      activeProcess = null;
    }
  });
}

// ─── IPC Handlers ───

// 1. Run PowerShell script (the core native bridge)
ipcMain.handle('powershell:run', async (_event, { scriptName, args = [] }) => {
  const scriptPath = path.join(scriptsDir, scriptName);
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: `Script not found: ${scriptName}` };
  }

  return new Promise((resolve) => {
    const output = [];
    const pwsh = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      ...args,
    ], {
      windowsHide: true,
    });

    activeProcess = pwsh;

    pwsh.stdout.on('data', (data) => {
      const line = data.toString();
      output.push({ type: 'stdout', line });
      mainWindow?.webContents.send('powershell:output', { type: 'stdout', line });
    });

    pwsh.stderr.on('data', (data) => {
      const line = data.toString();
      output.push({ type: 'stderr', line });
      mainWindow?.webContents.send('powershell:output', { type: 'stderr', line });
    });

    pwsh.on('close', (code) => {
      activeProcess = null;
      resolve({ success: code === 0, exitCode: code, output });
    });

    pwsh.on('error', (err) => {
      activeProcess = null;
      resolve({ success: false, error: err.message });
    });
  });
});

// 2. Kill running process
ipcMain.handle('powershell:kill', () => {
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = null;
    return { success: true };
  }
  return { success: false, error: 'No process running' };
});

// 3. Check if running as admin
ipcMain.handle('system:checkAdmin', async () => {
  return new Promise((resolve) => {
    const check = spawn('powershell.exe', [
      '-Command',
      '([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    ], { windowsHide: true });
    let result = '';
    check.stdout.on('data', (d) => { result += d.toString().trim(); });
    check.on('close', () => resolve({ isAdmin: result === 'True' }));
  });
});

// 4. Hardware scan (run and return JSON)
ipcMain.handle('hardware:scan', async () => {
  const scriptPath = path.join(scriptsDir, 'HardwareScan.ps1');
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: 'HardwareScan.ps1 not found' };
  }
  return new Promise((resolve) => {
    const outputPath = path.join(artifactsDir, 'hardware-inventory.json');
    const hw = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      '-OutputPath', outputPath,
      '-Silent',
    ], { windowsHide: true });
    hw.on('close', () => {
      try {
        const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        resolve({ success: true, data });
      } catch {
        resolve({ success: false, error: 'Failed to parse hardware scan output' });
      }
    });
  });
});

// 5. Security check
ipcMain.handle('security:check', async () => {
  const scriptPath = path.join(scriptsDir, 'SecurityCheck.ps1');
  const outputPath = path.join(artifactsDir, 'security-report.json');
  return new Promise((resolve) => {
    const sec = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      '-OutputPath', outputPath,
    ], { windowsHide: true });
    sec.on('close', () => {
      try {
        const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        resolve({ success: true, data });
      } catch {
        resolve({ success: false, error: 'Failed to parse security check' });
      }
    });
  });
});

// 6. Open external URL
ipcMain.handle('shell:openExternal', async (_event, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// 7. Get app version
ipcMain.handle('app:version', () => ({ version: APP_VERSION, name: APP_NAME }));

// 8. Get workspace directory
ipcMain.handle('app:workspaceDir', () => workspaceDir);

// 9. Install stack (phase-based)
ipcMain.handle('install:run', async (_event, { phase, distroName }) => {
  const scriptPath = path.join(scriptsDir, 'InstallStack.ps1');
  return new Promise((resolve) => {
    const output = [];
    const install = spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      '-Phase', phase || 'All',
      '-DistroName', distroName || 'Ubuntu',
      '-Verbose',
    ], { windowsHide: true });

    activeProcess = install;

    install.stdout.on('data', (data) => {
      const line = data.toString();
      output.push({ type: 'stdout', line });
      mainWindow?.webContents.send('install:output', { type: 'stdout', line });
    });

    install.stderr.on('data', (data) => {
      const line = data.toString();
      output.push({ type: 'stderr', line });
      mainWindow?.webContents.send('install:output', { type: 'stderr', line });
    });

    install.on('close', (code) => {
      activeProcess = null;
      resolve({ success: code === 0, exitCode: code, output });
    });
  });
});

// ─── App Lifecycle ───
app.whenReady().then(() => {
  ensureWorkspace();
  extractScripts();
  createWindow();

  // Remove default menu in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
