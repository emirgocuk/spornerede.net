import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const outbox = path.join(root, "outbox", "dist");

if (!fs.existsSync(dist)) {
  console.error("HATA: dist/ yok. Once: npm run build");
  process.exit(1);
}

fs.rmSync(path.join(root, "outbox"), { recursive: true, force: true });
fs.mkdirSync(path.dirname(outbox), { recursive: true });
fs.cpSync(dist, outbox, { recursive: true });

const readme = path.join(root, "outbox", "NASIL_YUKLENIR.txt");
const text = `SporNerede.net — manuel (FileZilla) yukleme

1) FileZilla ile SUNUCUYA baglan.

2) Bu klasordeki "dist" ICERIGINI (dist klasorunun kendisini degil, icindekileri)
   sunucuda su dizine yukle:
   /opt/spornerede/incoming/dist/

   Yani sunucuda su dosya var olmali:
   /opt/spornerede/incoming/dist/server/entry.mjs

3) Sunucuda SSH ile TEK komut (root veya sudo):
   bash /opt/spornerede/apply-ftp-upload.sh

   Bu komut yeni release olusturur, "current" linkini gunceller,
   spornerede servisini yeniden baslatir.

NOT: Site SSR (Node) ile calisir; sadece eski statik index.html atmak yetmez.
NOT: apply-ftp-upload.sh dosyasini bir kez sunucuya koyman gerekir:
     Repo: deploy/apply-ftp-upload.sh -> Sunucu: /opt/spornerede/apply-ftp-upload.sh
     chmod +x /opt/spornerede/apply-ftp-upload.sh
`;

fs.writeFileSync(readme, text, "utf8");

console.log("");
console.log("==> Hazir:", outbox);
console.log("    Talimatlar:", readme);
console.log("");
