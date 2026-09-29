import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Cifras en index.html (la descripción para buscadores y redes): se reemplazan al compilar con los
// valores de public/data/resumen.json, así ninguna queda tipeada a mano (regla 1 de CLAUDE.md).
function cifrasEnHtml() {
  return {
    name: 'cifras-en-html',
    transformIndexHtml(html) {
      const R = JSON.parse(readFileSync(new URL('./public/data/resumen.json', import.meta.url), 'utf8'));
      const fmt = (n) => Math.round(n).toLocaleString('es-AR');
      return html.replaceAll('%TOTAL_POZOS%', fmt(R.cuenca.total));
    },
  };
}

// base './' para que funcione en GitHub Pages bajo /<repo>/ sin configurar nada más.
export default defineConfig({
  base: './',
  plugins: [cifrasEnHtml()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // las librerías grandes en archivos propios: se cachean aparte del código de la pieza
        manualChunks: {
          maplibre: ['maplibre-gl'],
          deck: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/extensions', '@deck.gl/mapbox'],
          d3: ['d3'],
        },
      },
    },
  },
  server: { port: 5173 },
});
