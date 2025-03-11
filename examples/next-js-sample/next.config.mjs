import path from 'path';
import { fileURLToPath } from 'url';

/** Define `__dirname` manually for ESM */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    config.module.rules.push({
      test: /selfie_segmentation\.js$/,
      use: path.resolve(__dirname, 'mediapipe-loader.js'),
    });

    return config;
  },
};

export default nextConfig;
