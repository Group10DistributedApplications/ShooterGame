Write-Host "=== ShooterGame setup ==="
$ErrorActionPreference = "Stop"

foreach ($tool in @("java", "mvn", "npm", "git")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    Write-Error "$tool not found."
    exit 1
  }
}

if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
  Write-Error "Run from repo root."
  exit 1
}

Write-Host "Initializing submodules..."
git submodule update --init --recursive

Write-Host "Installing root npm deps..."
npm install

if (Test-Path "backend/jspace/pom.xml") {
  Write-Host "Building jSpace..."
  Push-Location backend/jspace
  mvn clean install
  Pop-Location
}

Write-Host "Building backend..."
Push-Location backend
mvn clean package
Pop-Location

Write-Host "Installing frontend deps..."
Push-Location frontend
npm install
Pop-Location

Write-Host "=== Setup complete ==="
Write-Host "Run: npm start"
