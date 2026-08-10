import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: 'ChamCong Family',
        short_name: 'Chấm Công',
        description: 'Hệ thống điểm danh thông minh cho xưởng gia đình',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ bên ngoài (VPS)
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  }
})
