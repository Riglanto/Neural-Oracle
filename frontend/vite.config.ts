import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Neural-Oracle/app/',
  build: { outDir: '../docs/app', emptyOutDir: true },
})
