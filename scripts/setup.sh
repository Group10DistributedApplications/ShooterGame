#!/usr/bin/env bash
set -e

echo "=== ShooterGame setup ==="

for tool in java mvn npm git; do
  command -v $tool >/dev/null || { echo "$tool not found"; exit 1; }
done

git submodule update --init --recursive
npm install

if [ -f backend/jspace/pom.xml ]; then
  (cd backend/jspace && mvn clean install)
fi

(cd backend && mvn clean package)
(cd frontend && npm install)

echo "=== Setup complete ==="
echo "Run: npm start"
