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
      // React 19's default `react-dom/server` resolves to the browser build on
      // workerd, which references `MessageChannel` and crashes the Worker at
      // startup. Force the edge build (Web Streams based), which also works in
      // Node for `astro dev`.
      alias: { 'react-dom/server': 'react-dom/server.edge' },
    },
  },
});
