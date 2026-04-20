const siteUrl = process.env.SITE_URL;

if (!siteUrl || !siteUrl.trim()) {
  console.error("HATA: SITE_URL env zorunlu. Ornek: https://spornerede.net");
  process.exit(1);
}

const base = siteUrl.replace(/\/+$/, "");
const routes = ["/", "/ara", "/basvuru", "/api/health?deep=1"];

async function checkRoute(route) {
  const url = `${base}${route}`;
  const startedAt = Date.now();
  const response = await fetch(url, { redirect: "follow" });
  const elapsedMs = Date.now() - startedAt;
  const ok = response.status >= 200 && response.status < 400;
  return { route, url, status: response.status, ok, elapsedMs, response };
}

const results = [];
for (const route of routes) {
  try {
    // Sequential by design to avoid aggressive burst against small VPS.
    // This mirrors realistic "after deploy" health checks.
    const result = await checkRoute(route);
    results.push(result);
  } catch (error) {
    results.push({
      route,
      url: `${base}${route}`,
      status: 0,
      ok: false,
      elapsedMs: 0,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

let deepHealthPayload = null;
const deepHealthResult = results.find((item) => item.route === "/api/health?deep=1");
if (deepHealthResult?.ok && deepHealthResult.response) {
  try {
    deepHealthPayload = await deepHealthResult.response.json();
  } catch {
    deepHealthPayload = null;
  }
}

console.log("Smoke check sonucu");
for (const result of results) {
  const mark = result.ok ? "OK " : "ERR";
  const extra = result.error ? ` error=${result.error}` : "";
  console.log(`- [${mark}] ${result.route} status=${result.status} ${result.elapsedMs}ms${extra}`);
}

if (deepHealthPayload) {
  const status = deepHealthPayload.status ?? "unknown";
  console.log(`- [INFO] /api/health deep status=${status}`);
}

const failed = results.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(`\nSmoke check basarisiz: ${failed.length} rota gecemedi.`);
  process.exit(1);
}

console.log("\nSmoke check basarili.");
