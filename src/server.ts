import { loadCatalog } from './catalog.ts';
import { createApi } from './api.ts';

const rawPort = process.env.PORT ?? '4317';
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const host = process.env.HOST ?? '127.0.0.1';
const catalog = await loadCatalog();
const server = createApi(catalog);
server.listen(Number(rawPort), host, () => {
  console.log(`Exercise Atlas ${catalog.manifest.catalogVersion}: http://${host}:${rawPort} (${catalog.exercises.length} exercises)`);
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => { process.exitCode = 0; }));
}
