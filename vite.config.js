import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Serves the Vercel functions in /api during `npm run dev`, so the whole app
// (including AI detection) runs locally without the Vercel CLI.
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const route = { '/api/detect': './api/detect.js' }[url.pathname];
        if (!route) return next();
        let raw = '';
        for await (const chunk of req) raw += chunk;
        req.body = raw ? JSON.parse(raw) : {};
        req.query = Object.fromEntries(url.searchParams);
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
        try {
          const mod = await server.ssrLoadModule(route);
          await mod.default(req, res);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(loadEnv(mode, process.cwd(), ''))],
  server: { port: 5173 },
}));
