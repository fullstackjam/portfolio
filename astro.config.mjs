import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://fullstackjam.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // The @astrojs/cloudflare adapter aliases react-dom/server → react-dom/server.browser
      // in its build:setup hook. server.browser uses MessageChannel which is not defined in
      // the workerd runtime (error 10021). Using array format ensures this entry is processed
      // first (Vite picks the first match), so server.edge wins over the adapter's browser alias.
      alias: [{ find: 'react-dom/server', replacement: 'react-dom/server.edge' }],
    },
    optimizeDeps: {
      include: ['react-dom/server.edge'],
    },
  },
});
