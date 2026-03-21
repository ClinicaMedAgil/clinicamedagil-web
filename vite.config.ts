import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    passWithNoTests: true,
  },
  server: {
    proxy: {
      '/clinicamedagil-service': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
