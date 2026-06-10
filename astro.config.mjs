import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// The cloudflare adapter aliases react-dom/server → react-dom/server.browser, which crashes
// workerd at module init (`new MessageChannel()`, error 10021), so the production build must
// use server.edge instead. But server.edge calls `require`, which isn't defined in `astro dev`'s
// Node ESM SSR context — so applying the alias in dev throws "require is not defined".
// Only override for the build; let dev use react's default (Node-friendly) server.
const isBuild = process.argv.includes('build');

export default defineConfig({
  site: 'https://fullstackjam.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Array format ensures this entry is processed first (Vite picks the first match),
      // so server.edge wins over the adapter's browser alias appended afterward.
      alias: isBuild ? [{ find: 'react-dom/server', replacement: 'react-dom/server.edge' }] : [],
    },
    optimizeDeps: {
      include: isBuild ? ['react-dom/server.edge'] : [],
    },
  },
});
