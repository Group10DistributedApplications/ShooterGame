Write-Host "=== ShooterGame setup ==="

# Stop on first error
$ErrorActionPreference = "Stop"

# Tool checks
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Write-Error "Java not found. Please install Java 21."
  exit 1
}

if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
  Write-Error "Maven not found. Please install Maven."
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js / npm not found. Please install Node.js."
  exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git not found."
  exit 1
}

# Ensure correct folders
if (-not (Test-Path "backend")) {
  Write-Error "backend/ folder not found. Run this from repo root."
  exit 1
}

if (-not (Test-Path "frontend")) {
  Write-Error "frontend/ folder not found. Run this from repo root."
  exit 1
}

# Submodules
Write-Host "Initializing submodules..."
git submodule update --init --recursive

# jSpace (backend dependency)
if (Test-Path "backend/jspace/pom.xml") {
  Write-Host "Building jSpace..."
  Push-Location backend/jspace
  mvn clean install
  Pop-Location
} else {
  Write-Warning "backend/jspace not found. Did you init submodules?"
}

# Backend
Write-Host "Building backend..."
Push-Location backend
mvn clean package
Pop-Location

# Frontend
Write-Host "Installing frontend dependencies..."
Push-Location frontend
npm install
Pop-Location

Write-Host "=== Setup complete ==="
Write-Host "Backend:  cd backend  && mvn exec:java"
Write-Host "Frontend: cd frontend && npm run dev"
