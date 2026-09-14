import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        // CRÍTICO: no vigilar carpetas gigantes (detector, worktrees de Claude)
        // para evitar recompilaciones lentas y consumo alto de watcher.
        ignored: [
          '**/services/originality/**',
          '**/node_modules/**',
          '**/.git/**',
          '**/.claude/**',
        ],
      },
      middlewareMode: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'motion/react',
      ],
      // Excluir Google GenAI (muy grande) y el detector
      exclude: ['@google/genai', 'services/originality'],
    },
    cacheDir: '.vite',
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React + ReactDOM + Router juntos en un solo chunk (evita createContext undefined)
            'vendor-react': ['react', 'react-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: false,
          pure_funcs: ['console.log'],
        },
      },
    },
  };
});
