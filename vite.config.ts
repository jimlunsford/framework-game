import { defineConfig } from 'vite';

// base './' keeps every asset path relative, so the static build in dist/
// runs unchanged from any folder: itch.io, a subdomain, or a local file server.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    target: 'es2020',
  },
});
