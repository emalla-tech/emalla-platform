const appUrl = String(process.env.SMOKE_APP_URL || 'https://www.emallarwanda.com').replace(/\/$/, '');
const apiUrl = String(process.env.SMOKE_API_URL || 'https://emalla-platform.onrender.com/api').replace(/\/$/, '');

const checks = [
  { name: 'Homepage', url: `${appUrl}/`, expect: 200, includes: 'E-Malla' },
  { name: 'Robots', url: `${appUrl}/robots.txt`, expect: 200, includes: 'Sitemap:' },
  { name: 'Sitemap', url: `${appUrl}/sitemap.xml`, expect: 200, includes: '<urlset' },
  { name: 'Manifest', url: `${appUrl}/manifest.webmanifest`, expect: 200, includes: 'E-Malla Rwanda' },
  { name: 'Service worker', url: `${appUrl}/sw.js`, expect: 200, includes: 'CACHE_VERSION' },
  { name: 'API health', url: `${apiUrl}/health?warm=1`, expect: 200, includes: '"status":"ok"' },
  { name: 'Products API', url: `${apiUrl}/products`, expect: 200, includes: '"products"' },
  { name: 'Protected orders API', url: `${apiUrl}/orders`, expect: 401, includes: 'Unauthorized' },
  {
    name: 'CORS rejects unknown origin',
    url: `${apiUrl}/health`,
    expect: 403,
    includes: 'CORS origin not allowed',
    headers: { Origin: 'https://not-emalla.example' }
  }
];

let failed = 0;

for (const check of checks) {
  const startedAt = Date.now();
  try {
    const response = await fetch(check.url, {
      headers: check.headers,
      signal: AbortSignal.timeout(45_000)
    });
    const text = await response.text();
    const passed = response.status === check.expect && (!check.includes || text.includes(check.includes));
    const marker = passed ? 'PASS' : 'FAIL';
    console.log(`${marker} ${check.name} (${response.status}, ${Date.now() - startedAt}ms)`);
    if (!passed) failed += 1;
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed > 0) {
  console.error(`Production smoke test failed: ${failed} check(s).`);
  process.exit(1);
}

console.log('Production smoke test passed.');
