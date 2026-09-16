import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Las dependencias van en su propio chunk. Cambian mucho menos que el
         * código propio, así que un despliegue que solo toca la aplicación deja
         * intacta la caché del navegador para los ~96 kB de React y Motion.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Motion se deja al reparto automático a propósito: agruparlo entero
          // metía la proyección de layout (domMax) en un chunk que la entrada
          // carga siempre, y esa parte solo hace falta en el mapa y al
          // reordenar un flujo. Sin agrupar, queda en su propio chunk diferido.
          if (id.includes('motion') || id.includes('framer')) return
          if (id.includes('react')) return 'vendor-react'
        },
      },
    },
  },
})
