[CmdletBinding()]
param(
  [int]$Port = 4317,
  [string]$ExcelPath = "",
  [string]$DriveSyncDir = "",
  [switch]$SkipInstall,
  [switch]$SkipBrowserInstall,
  [switch]$SkipStart,
  [switch]$NoOpenBrowser,
  [switch]$LocalOnlySmokeTest
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

function Invoke-Step {
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

function Install-WingetPackage {
  param(
    [string]$PackageId,
    [string]$FriendlyName
  )

  if ($SkipInstall) {
    throw "$FriendlyName is missing. Re-run without -SkipInstall, or install it manually."
  }
  if (-not (Test-CommandExists "winget")) {
    throw "winget is not available. Install '$FriendlyName' manually, then run this script again."
  }

  Write-Host "Installing/updating $FriendlyName with winget..." -ForegroundColor Yellow
  & winget install --id $PackageId -e --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    Write-Host "winget install returned $LASTEXITCODE; trying winget upgrade for $FriendlyName..." -ForegroundColor Yellow
    & winget upgrade --id $PackageId -e --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
      throw "Could not install or upgrade $FriendlyName with winget."
    }
  }
  Update-SessionPath
}

function Test-Node20 {
  if (-not (Test-CommandExists "node")) {
    return $false
  }

  $rawVersion = (& node --version 2>$null)
  if (-not $rawVersion) {
    return $false
  }

  $major = 0
  [void][int]::TryParse(($rawVersion.TrimStart("v").Split(".")[0]), [ref]$major)
  return $major -ge 20
}

function Ensure-EnvFile {
  if (Test-Path ".env") {
    Write-Host ".env already exists." -ForegroundColor Green
    return
  }

  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example." -ForegroundColor Green
    return
  }

  @"
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
PLAYWRIGHT_CHANNEL=chrome
GOOGLE_ACCESS_TOKEN=
GOOGLE_VIDS_FILE_ID=
"@ | Set-Content -Path ".env" -Encoding UTF8
  Write-Host "Created default .env." -ForegroundColor Green
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

  Ensure-EnvFile
  $lines = @()
  if (Test-Path ".env") {
    $lines = @(Get-Content ".env" -ErrorAction SilentlyContinue)
  }

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

function Find-Ffmpeg {
  return Test-CommandExists "ffmpeg"
}

function Test-ChromeInstalled {
  if (Test-CommandExists "chrome") {
    return $true
  }

  $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  $candidates = @()
  if ($env:ProgramFiles) {
    $candidates += Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"
  }
  if ($programFilesX86) {
    $candidates += Join-Path $programFilesX86 "Google\Chrome\Application\chrome.exe"
  }
  if ($env:LOCALAPPDATA) {
    $candidates += Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $true
    }
  }

  return $false
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

$isWindowsPlatform = [System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT
if (-not $isWindowsPlatform) {
  Write-Host "This script is for Windows. Current platform does not report Windows." -ForegroundColor Yellow
}
$npmCommand = if ($isWindowsPlatform) { "npm.cmd" } else { "npm" }

Write-Section "Tool Reel Factory Windows Setup"
Write-Host "Project: $projectRoot"

Write-Section "Checking required apps"
Update-SessionPath

if (-not (Test-Node20)) {
  Install-WingetPackage -PackageId "OpenJS.NodeJS.LTS" -FriendlyName "Node.js LTS"
}
if (-not (Test-Node20)) {
  throw "Node.js 20+ is still not available. Close this terminal, open a new PowerShell window, and run again."
}
Write-Host "Node: $(& node --version)" -ForegroundColor Green

if (-not (Test-CommandExists "npm")) {
  throw "npm was not found even though Node is installed. Reinstall Node.js LTS and run again."
}
Write-Host "npm: $(& $npmCommand --version)" -ForegroundColor Green

if (-not (Test-CommandExists "git")) {
  Install-WingetPackage -PackageId "Git.Git" -FriendlyName "Git"
}
if (Test-CommandExists "git") {
  Write-Host "Git: $(& git --version)" -ForegroundColor Green
}

if (-not (Test-ChromeInstalled)) {
  Install-WingetPackage -PackageId "Google.Chrome" -FriendlyName "Google Chrome"
}
Write-Host "Chrome check complete. Playwright can also use bundled Chromium." -ForegroundColor Green

if (-not (Find-Ffmpeg)) {
  try {
    Install-WingetPackage -PackageId "Gyan.FFmpeg" -FriendlyName "FFmpeg"
  } catch {
    Write-Host "FFmpeg install skipped/failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Local rendering can still run; some advanced video checks may be limited." -ForegroundColor Yellow
  }
}

Write-Section "Installing project dependencies"
Invoke-Step -File $npmCommand -CommandArgs @("install") -Name "npm install"

if (-not $SkipBrowserInstall) {
  Write-Section "Installing Playwright Chromium"
  Invoke-Step -File $npmCommand -CommandArgs @("run", "browser:install") -Name "Playwright browser install"
}

Write-Section "Creating local files"
Ensure-EnvFile
$resolvedExcelPath = Resolve-OptionalPathText -PathText $ExcelPath
$resolvedDriveSyncDir = Resolve-OptionalPathText -PathText $DriveSyncDir
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

Set-LocalEnvValue -Key "TRF_UI_PORT" -Value "$Port"
Set-LocalEnvValue -Key "PLAYWRIGHT_CHANNEL" -Value "chrome"

if ($resolvedExcelPath) {
  $env:TRF_DEFAULT_INPUT = $resolvedExcelPath
  Set-LocalEnvValue -Key "TRF_DEFAULT_INPUT" -Value $resolvedExcelPath
  Write-Host "Dashboard Excel default saved: $resolvedExcelPath" -ForegroundColor Green
}
if ($resolvedDriveSyncDir) {
  $env:TRF_DRIVE_SYNC_DIR = $resolvedDriveSyncDir
  Set-LocalEnvValue -Key "TRF_DRIVE_SYNC_DIR" -Value $resolvedDriveSyncDir
  Write-Host "Drive sync folder saved: $resolvedDriveSyncDir" -ForegroundColor Green
}
$env:TRF_UI_PORT = "$Port"

if ($LocalOnlySmokeTest) {
  Write-Section "Running local smoke test"
  Invoke-Step -File $npmCommand -CommandArgs @("run", "sample") -Name "sample run"
}

Write-Section "Ready"
Write-Host "Dashboard URL: http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host "Daily run command: .\run-windows.bat" -ForegroundColor Green
Write-Host "Google Vids login command: npm run vids:login -- --profile work/google-vids-profile" -ForegroundColor Green
Write-Host "Stop dashboard with Ctrl+C." -ForegroundColor DarkGray

if (-not $SkipStart) {
  if (-not $NoOpenBrowser) {
    Start-Job -ScriptBlock {
      param($Url)
      Start-Sleep -Seconds 4
      Start-Process $Url
    } -ArgumentList "http://127.0.0.1:$Port" | Out-Null
  }

  Invoke-Step -File $npmCommand -CommandArgs @("run", "ui", "--", "--port", "$Port") -Name "dashboard"
}
