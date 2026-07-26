import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: {
    middlewareMode: true,
    hmr: { port: 25000 + (process.pid % 20000) },
  },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/run-multi-nation-century-playtest-2060.ts');
} finally {
  await server.close();
}
