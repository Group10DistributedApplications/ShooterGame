const { execSync } = require("child_process");
const path = require("path");

const isWindows = process.platform === "win32";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true });
}

console.log("=== ShooterGame setup ===");

// ensure repo root
process.chdir(path.resolve(__dirname, ".."));

if (isWindows) {
  run('powershell -ExecutionPolicy Bypass -File scripts/setup.ps1');
} else {
  run('bash scripts/setup.sh');
}
