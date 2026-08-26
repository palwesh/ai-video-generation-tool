[CmdletBinding()]
param(
  [int]$Port = 0,
  [string]$HostAddress = "",
  [string]$ExcelPath = "",
  [string]$DriveSyncDir = "",
  [switch]$Lan,
  [switch]$NoBrowser,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Section {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Test-CommandExists {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Update-SessionPath {
  $currentPath = $env:Path
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  $commonPaths = @()
  if ($env:ProgramFiles) {
    $commonPaths += Join-Path $env:ProgramFiles "nodejs"
    $commonPaths += Join-Path $env:ProgramFiles "Git\cmd"
    $commonPaths += Join-Path $env:ProgramFiles "Google\Chrome\Application"
  }
  if ($programFilesX86) {
    $commonPaths += Join-Path $programFilesX86 "Google\Chrome\Application"
  }
  if ($env:LOCALAPPDATA) {
    $commonPaths += Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"
    $commonPaths += Join-Path $env:LOCALAPPDATA "Google\Chrome\Application"
  }
  $env:Path = (@($currentPath, $machinePath, $userPath) + $commonPaths | Where-Object { $_ }) -join ";"
}

function Get-NpmCommand {
  Update-SessionPath
  if (Test-CommandExists "npm.cmd") {
    return "npm.cmd"
  }
  if (Test-CommandExists "npm") {
    return "npm"
  }
  return ""
}

function Invoke-Checked {
  param(
    [string]$File,
    [string[]]$CommandArgs,
    [string]$Name
  )

  Write-Host "Running: $File $($CommandArgs -join ' ')" -ForegroundColor DarkGray
  & $File @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

function ConvertTo-DotEnvValue {
  param([string]$Value)
  return (($Value -replace "`r", " ") -replace "`n", " ").Trim()
}

function Set-LocalEnvValue {
  param(
    [string]$Key,
    [string]$Value
  )

  if (-not $Key -or -not $Value) {
    return
  }

  if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
      Copy-Item ".env.example" ".env"
    } else {
      New-Item -ItemType File -Path ".env" -Force | Out-Null
    }
  }

  $lines = @(Get-Content ".env" -ErrorAction SilentlyContinue)
  $line = "$Key=$(ConvertTo-DotEnvValue -Value $Value)"
  $pattern = "^\s*$([regex]::Escape($Key))="
  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $pattern) {
      $lines[$i] = $line
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += $line
  }

  $lines | Set-Content -Path ".env" -Encoding UTF8
}

function Get-LocalEnvValue {
  param([string]$Key)
  if (-not $Key -or -not (Test-Path ".env")) {
    return ""
  }

  $pattern = "^\s*$([regex]::Escape($Key))\s*=\s*(.*)\s*$"
  foreach ($line in @(Get-Content ".env" -ErrorAction SilentlyContinue)) {
    if ($line -match $pattern) {
      return $Matches[1].Trim()
    }
  }
  return ""
}

function Resolve-OptionalPathText {
  param([string]$PathText)
  if (-not $PathText) {
    return ""
  }
  try {
    return (Resolve-Path $PathText).Path
  } catch {
    return $PathText
  }
}

function Test-AllInterfacesHost {
  param([string]$Value)
  $normalized = "$Value".Trim().ToLowerInvariant()
  return $normalized -eq "0.0.0.0" -or $normalized -eq "::" -or $normalized -eq "::0" -or $normalized -eq "[::]"
}

function Get-BrowserHost {
  param([string]$Value)
  if (Test-AllInterfacesHost -Value $Value) {
    return "127.0.0.1"
  }
  if ("$Value".Trim().ToLowerInvariant() -eq "localhost") {
    return "127.0.0.1"
  }
  if (-not "$Value".Trim()) {
    return "127.0.0.1"
  }
  return "$Value".Trim()
}

function Get-LanUrls {
  param([int]$PortValue)
  $ips = @()
  try {
    $ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -and $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
      Select-Object -ExpandProperty IPAddress -Unique)
  } catch {
    $ips = @()
  }
  return @($ips | ForEach-Object { "http://$($_):$PortValue" })
}

function Write-DashboardLinks {
  param(
    [int]$PortValue,
    [string]$HostValue
  )
  $localUrl = "http://$(Get-BrowserHost -Value $HostValue):$PortValue"
  Write-Host "Local URL: $localUrl" -ForegroundColor Green
  if (Test-AllInterfacesHost -Value $HostValue) {
    $lanUrls = @(Get-LanUrls -PortValue $PortValue)
    if ($lanUrls.Count -gt 0) {
      Write-Host "Same Wi-Fi URLs:" -ForegroundColor Green
      foreach ($url in $lanUrls) {
        Write-Host "  $url" -ForegroundColor Green
      }
    } else {
      Write-Host "Same Wi-Fi URL not found. Check Wi-Fi/Ethernet connection." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Same Wi-Fi: run .\run-windows.bat -Lan to show team URLs." -ForegroundColor Yellow
  }
  Write-Host "Docs: $localUrl/docs.html" -ForegroundColor Cyan
  Write-Host "Vids Flow: $localUrl/vids-flow.html" -ForegroundColor Cyan
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

$savedPort = 0
if ($Port -le 0) {
  $savedPortText = Get-LocalEnvValue -Key "TRF_UI_PORT"
  if (-not [int]::TryParse($savedPortText, [ref]$savedPort)) {
    $savedPort = 4317
  }
  $Port = $savedPort
}

if (-not $HostAddress) {
  if ($Lan) {
    $HostAddress = "0.0.0.0"
  } else {
    $savedHost = Get-LocalEnvValue -Key "TRF_UI_HOST"
    if ($savedHost) {
      $HostAddress = $savedHost
    } else {
      $HostAddress = "127.0.0.1"
    }
  }
}

Write-Section "Tool Reel Factory Windows Runner"
Write-Host "Project: $projectRoot"

$npmCommand = Get-NpmCommand

$needsSetup = -not (Test-Path "node_modules")
if ($needsSetup) {
  Write-Section "First-time setup check"
  $setupArgs = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    (Join-Path $PSScriptRoot "setup-windows.ps1"),
    "-Port",
    "$Port",
    "-HostAddress",
    "$HostAddress",
    "-SkipStart"
  )
  if ($Lan) {
    $setupArgs += "-Lan"
  }
  if ($ExcelPath) {
    $setupArgs += @("-ExcelPath", $ExcelPath)
  }
  if ($DriveSyncDir) {
    $setupArgs += @("-DriveSyncDir", $DriveSyncDir)
  }
  if ($SkipInstall) {
    $setupArgs += "-SkipInstall"
  }
  Invoke-Checked -File "powershell.exe" -CommandArgs $setupArgs -Name "Windows setup"
  $npmCommand = Get-NpmCommand
}

if (-not $npmCommand) {
  throw "npm was not found. Run .\setup-windows.bat first, then open a new PowerShell window and try .\run-windows.bat again."
}

$resolvedExcelPath = Resolve-OptionalPathText -PathText $ExcelPath
$resolvedDriveSyncDir = Resolve-OptionalPathText -PathText $DriveSyncDir

$env:TRF_UI_PORT = "$Port"
$env:TRF_UI_HOST = "$HostAddress"
Set-LocalEnvValue -Key "TRF_UI_PORT" -Value "$Port"
Set-LocalEnvValue -Key "TRF_UI_HOST" -Value "$HostAddress"

if ($resolvedExcelPath) {
  $env:TRF_DEFAULT_INPUT = $resolvedExcelPath
  Set-LocalEnvValue -Key "TRF_DEFAULT_INPUT" -Value $resolvedExcelPath
}
if ($resolvedDriveSyncDir) {
  $env:TRF_DRIVE_SYNC_DIR = $resolvedDriveSyncDir
  Set-LocalEnvValue -Key "TRF_DRIVE_SYNC_DIR" -Value $resolvedDriveSyncDir
}

New-Item -ItemType Directory -Force -Path `
  "inputs", `
  "outputs", `
  "outputs\runs", `
  "outputs\final-reels", `
  "outputs\work-tracker", `
  "work", `
  "work\google-vids-profile", `
  "work\google-vids-profile-2", `
  "public", `
  "public\tool-reel-assets" | Out-Null

Write-Section "Starting dashboard"
Write-DashboardLinks -PortValue $Port -HostValue $HostAddress
Write-Host "Stop with Ctrl+C." -ForegroundColor DarkGray

if (-not $NoBrowser) {
  $openUrl = "http://$(Get-BrowserHost -Value $HostAddress):$Port"
  Start-Job -ScriptBlock {
    param($Url)
    Start-Sleep -Seconds 3
    Start-Process $Url
  } -ArgumentList $openUrl | Out-Null
}

Invoke-Checked -File $npmCommand -CommandArgs @("run", "ui", "--", "--port", "$Port", "--host", "$HostAddress") -Name "dashboard"
