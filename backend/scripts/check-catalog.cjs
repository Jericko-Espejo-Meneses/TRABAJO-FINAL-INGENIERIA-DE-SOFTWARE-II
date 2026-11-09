// Ejecutar con catalog-preview.ts activo. Solo consulta endpoints locales.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const base = 'http://127.0.0.1:3000/api/restaurantes';
  const coords = 'lat=-12.1211&lng=-77.0297';
  const cases = [
    ['Sin límite', coords, 200, ['rest-1', 'rest-2', 'rest-3', 'rest-4']],
    ['Radio 1 km', `${coords}&distanciaMax=1`, 200, ['rest-1', 'rest-4']],
    ['Cerca de mí + radio 3 km', `${coords}&distanciaMax=3&tags=nearby`, 200, ['rest-1', 'rest-2', 'rest-4']],
    ['Vegano + económico + proteína + ensaladas + 1 km', `${coords}&distanciaMax=1&tags=vegan&tags=cheap&tags=high-protein&tipoComida=Ensaladas`, 200, ['rest-1']],
    ['Bajo en calorías + vegano, separados por coma', `${coords}&tags=low-calorie,vegan`, 200, ['rest-1', 'rest-4']],
    ['Vegana + cerca de mí sin coincidencias', `${coords}&tags=nearby&tipoComida=Vegana`, 200, []],
    ['Distancia sin coordenadas', 'distanciaMax=1', 400],
    ['Latitud inválida', 'lat=91&lng=0', 400],
    ['Distancia negativa', `${coords}&distanciaMax=-1`, 400],
    ['Solo una coordenada', 'lat=0', 400],
  ];
  const results = [];
  for (const [name, query, status, ids] of cases) {
    const response = await fetch(`${base}?${query}`, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    assert.equal(response.status, status, name);
    if (ids) assert.deepEqual(data.map((r) => r.id).sort(), ids, name);
    results.push({ name, query, status: response.status, results: Array.isArray(data)
      ? data.map(({ id, name, distanceKm }) => ({ id, name, distanceKm })) : data });
  }
  const config = await (await fetch('http://127.0.0.1:5173/src/core/config.js')).text();
  assert.match(config, /"VITE_USE_MOCK"\s*:\s*"false"/);
  const evidence = { mode: 'Frontend VITE_USE_MOCK=false, backend HTTP real, datos QA en memoria; sin Supabase', results };
  await fs.writeFile(path.join(__dirname, '../docs/evidence/catalog-filters/http-results.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(`${cases.length} comprobaciones HTTP correctas; VITE_USE_MOCK=false verificado.`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
