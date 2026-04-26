import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const requiredFiles = [
  "deploy.sh",
  "rollback.sh",
  "deploy/remote-doctor.sh",
  "src/pages/api/health.ts",
];

const checks = [];

function pushCheck(ok, label, details = "") {
  checks.push({ ok, label, details });
}

function hasValue(name) {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

for (const relativePath of requiredFiles) {
  const fullPath = path.join(root, relativePath);
  pushCheck(fs.existsSync(fullPath), `file:${relativePath}`);
}

pushCheck(
  hasValue("DEPLOY_SSH") || hasValue("APP_REPO_DIR"),
  "env:DEPLOY_SSH veya APP_REPO_DIR",
  "lokal deploy icin DEPLOY_SSH, sunucu auto-update icin APP_REPO_DIR",
);
pushCheck(hasValue("SITE_URL"), "env:SITE_URL", "post-deploy smoke check hedefi");

const failed = checks.filter((item) => !item.ok);

console.log("Release gate sonucu");
for (const item of checks) {
  const mark = item.ok ? "OK " : "ERR";
  const suffix = item.details ? ` (${item.details})` : "";
  console.log(`- [${mark}] ${item.label}${suffix}`);
}

if (failed.length > 0) {
  console.error(`\nRelease gate basarisiz: ${failed.length} kontrol gecemedi.`);
  process.exit(1);
}

console.log("\nRelease gate basarili.");
