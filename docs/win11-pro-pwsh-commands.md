# Windows 11 Pro — PowerShell (pwsh) Commands

This doc explains how to **inspect** execution policy + Mark-of-the-Web (MOTW), and how to **run the configurator scripts indefinitely** without asking users to change system-wide policy.

## 0) Fastest “always works” bootstrap (recommended)

This project ships a `bootstrap.cmd` launcher that:
- self-elevates to Admin
- runs `bootstrap.ps1` with `-ExecutionPolicy Bypass`
- avoids MOTW/RemoteSigned friction for downloaded scripts

By default, `bootstrap.cmd` runs **Preflight** (`-Mode CheckOnly`). To install, pass `-Mode Full` explicitly.

From an elevated PowerShell:

```powershell
.\bootstrap.cmd
```

Or from a one-liner (downloads the launcher, then runs it):

```powershell
$cmd = Join-Path $env:TEMP 'aiws-bootstrap.cmd'
iwr 'https://flexnetos.github.io/ai-workspace-configurator/scripts/bootstrap.cmd' -OutFile $cmd
& $cmd -Mode CheckOnly
```

## 1) Inspect execution policy (and which scope “wins”)

```powershell
pwsh -NoProfile -Command "Get-ExecutionPolicy -List | Format-Table -AutoSize; 'Effective:'; Get-ExecutionPolicy"
```

Interpretation:
- If `MachinePolicy` or `UserPolicy` is **not** `Undefined`, a Group Policy is enforcing it.
- If all scopes are `Undefined` except `LocalMachine=RemoteSigned`, that’s the Windows default (not a stored registry value).

Also check for a per-process override (rare, but it happens):

```powershell
pwsh -NoProfile -Command "[Environment]::GetEnvironmentVariable('PSExecutionPolicyPreference','Process')"
```

## 2) Confirm whether a registry value is actually set

These will error if the *value* doesn’t exist (that’s expected and useful):

```powershell
pwsh -NoProfile -Command "reg.exe query \"HKLM\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell\" /v ExecutionPolicy"
pwsh -NoProfile -Command "reg.exe query \"HKCU\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell\" /v ExecutionPolicy"
pwsh -NoProfile -Command "reg.exe query \"HKLM\SOFTWARE\Microsoft\PowerShellCore\1\ShellIds\Microsoft.PowerShell\" /v ExecutionPolicy"
pwsh -NoProfile -Command "reg.exe query \"HKCU\SOFTWARE\Microsoft\PowerShellCore\1\ShellIds\Microsoft.PowerShell\" /v ExecutionPolicy"
```

If you want to prove the key exists even when the value doesn’t:

```powershell
pwsh -NoProfile -Command "reg.exe query \"HKLM\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell\""
```

## 3) Inspect Mark-of-the-Web (why “not digitally signed” happens)

When a `.ps1` arrives via ZIP/download, Windows often adds a `Zone.Identifier` alternate data stream (MOTW). With the default `RemoteSigned` policy, PowerShell treats that script as “remote” and blocks it unless unblocked/signed.

Check MOTW on a specific script:

```powershell
Get-Item .\bootstrap.ps1 -Stream Zone.Identifier -ErrorAction SilentlyContinue
Get-Content .\bootstrap.ps1 -Stream Zone.Identifier -ErrorAction SilentlyContinue
```

Remove MOTW (file-by-file):

```powershell
Unblock-File .\bootstrap.ps1
```

Remove MOTW for all scripts in a folder (safe when you trust the source):

```powershell
Get-ChildItem -Recurse -Filter *.ps1 -File | Unblock-File
```

## 4) Why the project uses `bootstrap.cmd` (the durable fix)

Goal: **never require** a user to run `Set-ExecutionPolicy`.

Instead, the launcher runs a controlled, one-time process with:
- `-ExecutionPolicy Bypass` (affects only that process)
- explicit file execution (`-File .\bootstrap.ps1`) instead of pipe-to-`iex`

If you’re troubleshooting a user machine:
- If `Get-ExecutionPolicy -List` shows `AllSigned` under `MachinePolicy`/`UserPolicy`, they are in a locked-down environment: the launcher may still fail due to policy or AppLocker/WDAC rules.
- If the error is specifically *“not digitally signed”* and MOTW is present, `bootstrap.cmd` avoids it without changing system settings.

## 5) Useful “what shell am I in?” checks

```powershell
$PSVersionTable.PSVersion
$PSHOME
Get-Command pwsh,powershell -ErrorAction SilentlyContinue | Format-Table -AutoSize
```

