import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://techniques.horarytalk.com', output: 'static', trailingSlash: 'always', build: { format: 'directory', inlineStylesheets: 'never' }, vite: { build: { assetsInlineLimit: 0 } } });
