// @version vite ^4.3.0
// @version @vitejs/plugin-react ^4.0.0
// @version vite-plugin-pwa ^0.16.0
// @version vite-tsconfig-paths ^4.2.0
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import { API_CONFIG } from './src/config/api.config';

/**
 * Human Tasks:
 * 1. Set up SSL certificates for HTTPS development
 * 2. Configure environment variables in .env file:
 *    - VITE_API_BASE_URL
 *    - VITE_APP_VERSION
 * 3. Review and adjust CSP headers for production
 * 4. Configure CDN settings if using one
 * 5. Set up monitoring for build performance
 */

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    // Implements Technical Specification/5.3.1 Frontend Technologies
    plugins: [
      react({
        // Fast Refresh configuration for optimal development experience
        fastRefresh: true,
        // Use automatic JSX runtime for better performance
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
          ]
        }
      }),
      
      // Progressive Web App configuration
      VitePWA({
        manifest: {
          name: 'Mint Replica Lite',
          short_name: 'MintLite',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            }
          ],
          start_url: '.',
          display: 'standalone',
          background_color: '#ffffff'
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: '/api/*',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 3600
                }
              }
            }
          ]
        }
      }),
      
      // TypeScript path aliases support
      tsconfigPaths()
    ],

    // Implements Technical Specification/A.1.1 Development Environment Setup
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: API_CONFIG.BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            'X-Forwarded-Proto': 'https'
          }
        }
      },
      // Implements Technical Specification/9.3.1 API Security
      headers: {
        'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://*.plaid.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    },

    // Build configuration
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDevelopment,
          drop_debugger: !isDevelopment
        },
        format: {
          comments: false
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['chart.js', 'react-chartjs-2']
          }
        }
      }
    },

    // Path aliases configuration
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@services': '/src/services',
        '@utils': '/src/utils',
        '@hooks': '/src/hooks',
        '@types': '/src/types',
        '@contexts': '/src/contexts',
        '@assets': '/src/assets',
        '@styles': '/src/styles'
      }
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
        scopeBehaviour: 'local',
        generateScopedName: '[name]__[local]___[hash:base64:5]'
      },
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@styles/variables.css";'
        }
      }
    },

    // Environment variables configuration
    envPrefix: 'VITE_',
    
    // Global constants
    define: {
      __APP_VERSION__: 'JSON.stringify(process.env.npm_package_version)'
    }
  };
});