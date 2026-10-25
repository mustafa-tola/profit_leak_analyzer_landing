import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // ZIP archives may be locked by Explorer or antivirus; they do not need HMR.
      ignored: ['**/*.zip'],
    },
  },
})
