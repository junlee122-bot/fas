import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: {
    middlewareMode: true,
    hmr: { port: 32000 + (process.pid % 12000) },
  },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/audit-civilization-systems.ts');
} finally {
  await server.close();
}
