import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: {
    middlewareMode: true,
    hmr: { port: 28000 + (process.pid % 20000) },
  },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/run-arms-diplomacy-stage-playtest.ts');
} finally {
  await server.close();
}
