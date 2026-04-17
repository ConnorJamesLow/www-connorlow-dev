// @ts-check
import { defineConfig } from 'astro/config';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.connorlow.dev', // Replace with your actual GitHub Pages URL
    base: '/',
    vite: {
        worker: {
            format: 'es',
        },
        plugins: [
            wasm(),
            topLevelAwait()
        ],
        esbuild: {
            jsx: 'automatic',
            jsxImportSource: 'texsaur',
            jsxDev: false
        }
    }
});
