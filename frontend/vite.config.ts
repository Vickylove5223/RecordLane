import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '~backend/client': path.resolve(__dirname, './client'),
      '~backend': path.resolve(__dirname, '../backend'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  mode: "development",
  build: {
    minify: false,
  },
  server: {
    port: 8089,
    host: true,
  },
  publicDir: 'public',
  define: {
    'import.meta.env.VITE_CLIENT_TARGET': JSON.stringify(process.env.VITE_CLIENT_TARGET || 'http://localhost:4000'),
  },
})
