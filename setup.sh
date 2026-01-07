#!/usr/bin/env bash
set -e

echo "=== ShooterGame setup ==="

# Tool checks
command -v java >/dev/null || { echo "Java not found. Install Java 21."; exit 1; }
command -v mvn  >/dev/null || { echo "Maven not found."; exit 1; }
command -v npm  >/dev/null || { echo "Node.js / npm not found."; exit 1; }
command -v git  >/dev/null || { echo "Git not found."; exit 1; }

# Ensure correct folders
if [ ! -d "backend" ]; then
  echo "backend/ folder not found. Run this from repo root."
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo "frontend/ folder not found. Run this from repo root."
  exit 1
fi

# Submodules
echo "Initializing submodules..."
git submodule update --init --recursive

# jSpace
if [ -f "backend/jspace/pom.xml" ]; then
  echo "Building jSpace..."
  cd backend/jspace
  mvn clean install
  cd ../../
else
  echo "Warning: backend/jspace not found. Did you init submodules?"
fi

# Backend
echo "Building backend..."
cd backend
mvn clean package
cd ..

# Frontend
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "=== Setup complete ==="
echo "Backend:  cd backend  && mvn exec:java"
echo "Frontend: cd frontend && npm run dev"
