#!/usr/bin/env bash
set -e

echo "=== ShooterGame setup ==="

command -v java >/dev/null || { echo "Java not found"; exit 1; }
command -v mvn >/dev/null || { echo "Maven not found"; exit 1; }
command -v npm >/dev/null || { echo "Node.js not found"; exit 1; }

git submodule update --init --recursive

echo "Building jSpace..."
cd jspace
mvn clean install
cd ..

echo "Building backend..."
cd backend
mvn clean package
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "=== Setup complete ==="
echo "Backend: cd backend && mvn exec:java"
echo "Frontend: cd frontend && npm run dev"
