import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { basename } from 'path';
import fs from 'fs';

function mediapipe_workaround() {
  return {
    name: 'mediapipe_workaround',
    load(id) {
      if (basename(id) === 'selfie_segmentation.js') {
        let code = fs.readFileSync(id, 'utf-8');
        code += 'exports.SelfieSegmentation = SelfieSegmentation;';
        return { code };
      } else {
        return null;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mediapipe_workaround()],
  define: {
    'process.env': {},
  },
});
