const siteUrl = process.env.SITE_URL;

if (!siteUrl || !siteUrl.trim()) {
  console.error("HATA: SITE_URL env zorunlu. Ornek: https://spornerede.net");
  process.exit(1);
}

const base = siteUrl.replace(/\/+$/, "");
const routes = ["/", "/ara", "/basvuru", "/api/health?deep=1", "/robots.txt"];

async function checkSitemapAliases() {
  const sm = `${base}/sitemap.xml`;
  const smUnderscore = `${base}/sitemap_index.xml`;
  const idx = `${base}/sitemap-index.xml`;
  const out = [];
  for (const [label, url, expectRedirect] of [
    ["sitemap.xml", sm, true],
    ["sitemap_index.xml", smUnderscore, true],
  ]) {
    const startedAt = Date.now();
    const response = await fetch(url, { redirect: "manual" });
    const elapsedMs = Date.now() - startedAt;
    const loc = response.headers.get("location");
    const ok =
      response.status === 301 &&
      Boolean(loc) &&
      loc.includes("sitemap-index.xml");
    out.push({
      route: `/${label}`,
      url,
      status: response.status,
      ok,
      elapsedMs,
      extra: loc ? `Location=${loc}` : "",
    });
  }
  const startedAt = Date.now();
  const r = await fetch(idx, { redirect: "follow" });
  const ct = r.headers.get("content-type") ?? "";
  const xmlOk =
    r.ok &&
    (ct.includes("application/xml") || ct.includes("text/xml")) &&
    (await r.text()).includes("<sitemapindex");
  out.push({
    route: "/sitemap-index.xml",
    url: idx,
    status: r.status,
    ok: xmlOk,
    elapsedMs: Date.now() - startedAt,
    extra: ct ? `Content-Type=${ct}` : "",
  });
  return out;
}

async function checkRoute(route) {
  const url = `${base}${route}`;
  const startedAt = Date.now();
  const response = await fetch(url, { redirect: "follow" });
  const elapsedMs = Date.now() - startedAt;

  if (route === "/robots.txt") {
    const ct = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const bodyOk =
      text.trimStart().startsWith("User-agent:") && text.includes("Sitemap:");
    const ok =
      response.status >= 200 &&
      response.status < 400 &&
      ct.includes("text/plain") &&
      bodyOk;
    return { route, url, status: response.status, ok, elapsedMs, response: null };
  }

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

try {
  const smResults = await checkSitemapAliases();
  for (const item of smResults) {
    results.push(item);
  }
} catch (error) {
  results.push({
    route: "/sitemap aliases",
    url: base,
    status: 0,
    ok: false,
    elapsedMs: 0,
    error: error instanceof Error ? error.message : String(error),
  });
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
  const extra = result.error ? ` error=${result.error}` : result.extra ? ` ${result.extra}` : "";
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
