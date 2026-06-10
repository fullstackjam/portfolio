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
  },
});
