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
        // Las librerías grandes en archivos propios: se cachean aparte del código de la pieza. Con la forma de
        // función (y no de objeto) solo se reparten paquetes de node_modules: el ayudante de Vite para los
        // import() dinámicos queda en la entrada y MapLibre + deck.gl se bajan recién en la carga del mapa.
        manualChunks(id) {
          // ayudantes compartidos (import() dinámico, CommonJS): chunk propio, si no Rollup los mete en el de deck.gl
          // y la entrada terminaría importando deck.gl entero
          if (id.includes('preload-helper') || id.includes('commonjsHelpers')) return 'ayudantes';
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[\\/]maplibre-gl/.test(id)) return 'maplibre';
          if (/node_modules[\\/]@(deck|luma|loaders|math|probe)\.gl/.test(id)) return 'deck';
          if (/node_modules[\\/]d3(-|[\\/])/.test(id)) return 'd3';
          return undefined;
        },
      },
    },
  },
  server: { port: 5173 },
});
