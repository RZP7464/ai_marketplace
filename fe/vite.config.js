import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Handle SPA routing - redirect all routes to index.html
    historyApiFallback: true
  },
  // Ensure all routes fall back to index.html for SPA
  appType: 'spa'
})

