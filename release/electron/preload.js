/**
 * Preload Script — Secure bridge between React UI and Electron main process
 * Exposes only the APIs the web app needs, nothing more.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── PowerShell Execution ──
  runPowerShell: (scriptName, args) =>
    ipcRenderer.invoke('powershell:run', { scriptName, args }),
  killPowerShell: () =>
    ipcRenderer.invoke('powershell:kill'),
  onPowerShellOutput: (callback) =>
    ipcRenderer.on('powershell:output', (_event, data) => callback(data)),
  removePowerShellListener: () =>
    ipcRenderer.removeAllListeners('powershell:output'),

  // ── Install Stack ──
  runInstall: (phase, distroName) =>
    ipcRenderer.invoke('install:run', { phase, distroName }),
  onInstallOutput: (callback) =>
    ipcRenderer.on('install:output', (_event, data) => callback(data)),
  removeInstallListener: () =>
    ipcRenderer.removeAllListeners('install:output'),

  // ── System Checks ──
  checkAdmin: () =>
    ipcRenderer.invoke('system:checkAdmin'),
  scanHardware: () =>
    ipcRenderer.invoke('hardware:scan'),
  checkSecurity: () =>
    ipcRenderer.invoke('security:check'),

  // ── App Info ──
  getVersion: () =>
    ipcRenderer.invoke('app:version'),
  getWorkspaceDir: () =>
    ipcRenderer.invoke('app:workspaceDir'),

  // ── Shell ──
  openExternal: (url) =>
    ipcRenderer.invoke('shell:openExternal', url),

  // ── Platform detection ──
  isElectron: true,
  platform: process.platform,
});
