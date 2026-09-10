import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
});

try {
  await server.ssrLoadModule('/scripts/run-clandestine-career-playtest-2060.ts');
} finally {
  await server.close();
}
