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
          if (id.includes('motion') || id.includes('framer')) return 'vendor-motion'
          if (id.includes('react')) return 'vendor-react'
        },
      },
    },
  },
})
