import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: {
    middlewareMode: true,
    hmr: { port: 26000 + (process.pid % 20000) },
  },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/run-possibility-matrix-3000-2060.ts');
} finally {
  await server.close();
}
