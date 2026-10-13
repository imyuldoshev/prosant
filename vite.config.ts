import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Custom Vite plugin to generate version metadata at build time
 * and serve /version.json with strict no-cache headers in dev and preview.
 */
function versionPlugin(): Plugin {
  const version = process.env.VITE_APP_VERSION || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const buildTime = new Date().toISOString();
  const versionPayload = JSON.stringify({ version, buildTime }, null, 2);

  return {
    name: 'santexpro-version-plugin',
    config() {
      return {
        define: {
          __APP_VERSION__: JSON.stringify(version),
          __APP_BUILD_TIME__: JSON.stringify(buildTime),
        },
      };
    },
    // Generate version.json asset inside dist/ during build
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionPayload,
      });
    },
    // Serve /version.json with explicit no-cache headers in development mode
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/version.json' || req.url?.startsWith('/version.json?')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.end(versionPayload);
          return;
        }
        next();
      });
    },
    // Serve /version.json with explicit no-cache headers in preview mode
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/version.json' || req.url?.startsWith('/version.json?')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.end(versionPayload);
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    versionPlugin(),
    tailwindcss(),
    react(),
  ],
})
