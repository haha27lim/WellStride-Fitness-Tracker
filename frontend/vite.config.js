import path from "path"
import { VitePWA } from 'vite-plugin-pwa';
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],
        manifest: {
          name: 'WellStride',
          short_name: 'WellStride',
          description: 'Your personal wellness tracker',
          theme_color: '#ffffff',
          icons: [
            {
              "src": "/icon-48x48.png",
              "sizes": "48x48",
              "type": "image/png"
            },
            {
              "src": "/icon-72x72.png",
              "sizes": "72x72",
              "type": "image/png"
            },
            {
              "src": "/icon-96x96.png",
              "sizes": "96x96",
              "type": "image/png"
            },
            {
              "src": "/icon-144x144.png",
              "sizes": "144x144",
              "type": "image/png"
            },
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["antd", "@ant-design/icons", "moment"],
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true
        },
      },
    },
  };
});