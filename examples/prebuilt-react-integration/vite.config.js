import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { basename } from 'path';
import fs from 'fs';

// Context: https://github.com/tensorflow/tfjs/issues/7165
function mediapipe_workaround() {
  return {
    name: 'mediapipe_workaround',
    load(id) {
      if (basename(id) === 'selfie_segmentation.js') {
        let code = fs.readFileSync(id, 'utf-8');
        code += 'exports.SelfieSegmentation = globalThis.SelfieSegmentation;';
        return { code };
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mediapipe_workaround()],
  define: {
    'process.env': {},
  },
  // esbuild 0.28 (pinned for GHSA-gv7w-rqvm-qjhr) refuses to downlevel some
  // destructuring in prebundled deps for the default browser target; this is a
  // demo app, so target modern browsers and skip downleveling.
  build: {
    target: 'esnext',
  },
});
