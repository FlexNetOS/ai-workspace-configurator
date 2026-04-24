@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "BOOTSTRAP_PS1=%SCRIPT_DIR%bootstrap.ps1"
set "BOOTSTRAP_PS1_URL=https://flexnetos.github.io/ai-workspace-configurator/scripts/bootstrap.ps1"

if not exist "%BOOTSTRAP_PS1%" (
  echo [Info] bootstrap.ps1 not found next to bootstrap.cmd. Downloading...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%BOOTSTRAP_PS1_URL%' -OutFile '%BOOTSTRAP_PS1%' -MaximumRedirection 10"
  if not exist "%BOOTSTRAP_PS1%" (
    echo [Error] Failed to download bootstrap.ps1 to: "%BOOTSTRAP_PS1%"
    exit /b 2
  )
)

rem Check for admin rights.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [Elevate] Requesting Administrator privileges...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -Verb RunAs -ArgumentList @('/c', '\"\"%~f0\"\" %*')"
  exit /b 0
)

rem Prefer pwsh if available, otherwise fall back to Windows PowerShell.
where pwsh >nul 2>&1
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%BOOTSTRAP_PS1%" %*
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%BOOTSTRAP_PS1%" %*
)

exit /b %errorlevel%
