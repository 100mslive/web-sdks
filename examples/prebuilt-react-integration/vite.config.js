import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 200,
      },
    },
  },
  define: {
    'process.env': {},
  },
});
