import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'], 'orbit-controls': ['three/addons/controls/OrbitControls.js'] },
      },
    },
  },
});
