@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "BOOTSTRAP_PS1=%SCRIPT_DIR%bootstrap.ps1"
set "BOOTSTRAP_PS1_URL=https://raw.githubusercontent.com/FlexNetOS/ai-workspace-configurator/master/public/scripts/bootstrap.ps1"
set "AIWS_BOOTSTRAP_REV=77af65c"

echo [AIWS] bootstrap.cmd rev: %AIWS_BOOTSTRAP_REV%

echo [AIWS] Fetching latest bootstrap.ps1...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$tmp='%BOOTSTRAP_PS1%.tmp'; $u='%BOOTSTRAP_PS1_URL%?v=%RANDOM%'; Invoke-WebRequest -Headers @{ 'Cache-Control'='no-cache'; 'Pragma'='no-cache' } -Uri $u -OutFile $tmp -MaximumRedirection 10; if((Test-Path $tmp) -and ((Get-Item $tmp).Length -gt 0)){ Move-Item -Force $tmp '%BOOTSTRAP_PS1%' } else { if(Test-Path $tmp){ Remove-Item -Force $tmp }; exit 2 }"
if not exist "%BOOTSTRAP_PS1%" (
  echo [Error] Failed to fetch bootstrap.ps1 to: "%BOOTSTRAP_PS1%"
  exit /b 2
)

rem Check for admin rights.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [Elevate] Requesting Administrator privileges...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -Verb RunAs -ArgumentList @('/c', '\"\"%~f0\"\" %*')"
  exit /b 0
)

rem Prefer pwsh if available, otherwise fall back to Windows PowerShell.
set "DEFAULT_ARGS="
if "%~1"=="" (
  rem Safe default: run preflight only unless the user explicitly chooses Full/InstallOnly.
  set "DEFAULT_ARGS=-Mode CheckOnly"
)

where pwsh >nul 2>&1
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%BOOTSTRAP_PS1%" %DEFAULT_ARGS% %*
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%BOOTSTRAP_PS1%" %DEFAULT_ARGS% %*
)

exit /b %errorlevel%
