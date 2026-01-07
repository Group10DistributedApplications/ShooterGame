Write-Host "=== ShooterGame setup ==="

# Check tools
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

# Submodules
Write-Host "Initializing submodules..."
git submodule update --init --recursive

# jSpace
Write-Host "Building jSpace..."
cd jspace
mvn clean install
cd ..

# Backend
Write-Host "Building backend..."
cd backend
mvn clean package
cd ..

# Frontend
Write-Host "Installing frontend dependencies..."
cd frontend
npm install
cd ..

Write-Host "=== Setup complete ==="
Write-Host "Backend: cd backend && mvn exec:java"
Write-Host "Frontend: cd frontend && npm run dev"
