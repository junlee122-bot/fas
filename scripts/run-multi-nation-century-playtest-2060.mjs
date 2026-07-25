import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/run-multi-nation-century-playtest-2060.ts');
} finally {
  await server.close();
}
