# Windows 11 Pro — Settings Checklist (AI Workspace Configurator)

This checklist is the “clean Windows 11 Pro” baseline that keeps the installer reliable and repeatable.

## Quick checklist (recommended)

- Windows Update fully applied (including reboots)
- PowerShell 7 installed (pwsh)
- Virtualization enabled (UEFI + Windows features)
- WSL2 enabled (for Ubuntu + Linux toolchain)
- “Sleep” disabled during long installs (or set to a large timeout)
- System Restore enabled (so restore points can be created)

## 1) Virtualization + WSL2

**UEFI/BIOS:**
- Enable Intel VT-x / AMD-V (virtualization)

**Windows optional features (Admin PowerShell):**

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
```

Confirm status:

```powershell
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform,Microsoft-Windows-Subsystem-Linux |
  Select-Object FeatureName,State
```

## 2) Power settings (avoid mid-install sleep)

Suggested minimum during setup:
- Turn off display: 30 minutes
- Put device to sleep: Never (temporarily)

## 3) System Restore (for restore points)

The bootstrap attempts `Checkpoint-Computer`. If System Protection is disabled, Windows will refuse restore point creation.

## 4) PowerShell execution policy: keep defaults (don’t “fix” by changing policy)

Windows defaults typically report as:
- `LocalMachine = RemoteSigned`
- everything else `Undefined`

The project’s durable approach is **not** to change policy, but to use the included launcher:
- `bootstrap.cmd` (auto-elevates + runs `bootstrap.ps1` with `-ExecutionPolicy Bypass`)

Verify policy and source:

```powershell
pwsh -NoProfile -Command "Get-ExecutionPolicy -List | ft -AutoSize; 'Effective:'; Get-ExecutionPolicy"
```

## 5) “Source of truth” locations for execution policy (inspection reference)

PowerShell checks execution policy in this order (highest precedence first).

### (1) Group Policy (file-backed)
- `C:\Windows\System32\GroupPolicy\gpt.ini`
- `C:\Windows\System32\GroupPolicy\User\Registry.pol`
- `C:\Windows\System32\GroupPolicy\Machine\Registry.pol` (may not exist)

### (1b) Group Policy (registry keys)
- `HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell` (`ExecutionPolicy`)
- `HKCU\SOFTWARE\Policies\Microsoft\Windows\PowerShell` (`ExecutionPolicy`)
- `HKLM\SOFTWARE\Policies\Microsoft\PowerShellCore` (`ExecutionPolicy`)
- `HKCU\SOFTWARE\Policies\Microsoft\PowerShellCore` (`ExecutionPolicy`)

### (2) Local settings (registry keys written by `Set-ExecutionPolicy -Scope ...`)
- `HKLM\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell` (`ExecutionPolicy`)
- `HKCU\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell` (`ExecutionPolicy`)
- `HKLM\SOFTWARE\Microsoft\PowerShellCore\1\ShellIds\Microsoft.PowerShell` (`ExecutionPolicy`)
- `HKCU\SOFTWARE\Microsoft\PowerShellCore\1\ShellIds\Microsoft.PowerShell` (`ExecutionPolicy`)

Backing hive files (FYI; you normally don’t edit these directly):
- `C:\Windows\System32\config\SOFTWARE` (backs `HKLM\SOFTWARE\...`)
- `%USERPROFILE%\NTUSER.DAT` (backs `HKCU\...`)

### (3) Process override (no file; environment variable)
- `PSExecutionPolicyPreference` (process environment variable)

### (4) Defaults (engine code; no policy file)
- `C:\Program Files\PowerShell\7\pwsh.exe`
- `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`

## 6) Corporate/locked-down machines (important)

If `MachinePolicy` or `UserPolicy` is set to `AllSigned` (or AppLocker/WDAC blocks scripts), users may need IT approval. This is expected in managed environments and isn’t something a bootstrapper should “fight” automatically.
