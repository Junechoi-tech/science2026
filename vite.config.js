import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'development-entry',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url?.startsWith('/?')) req.url = '/app.html' + req.url.slice(1);
        next();
      });
    },
  }],
  build: {
    rollupOptions: {
      input: 'app.html',
      output: {
        manualChunks: { three: ['three'], 'orbit-controls': ['three/addons/controls/OrbitControls.js'] },
      },
    },
  },
});
