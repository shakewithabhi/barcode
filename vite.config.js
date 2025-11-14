import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/gsheet': {
        target: 'https://script.google.com/macros/s/AKfycbzsbJybSrD6XsoNIu85wY_Q0NMhFqWCNaA3myTSKA9xQDsZAFXMIGeGd5BqiIazVBiZdA/exec',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gsheet/, ''),
      },
    },
  },
});
