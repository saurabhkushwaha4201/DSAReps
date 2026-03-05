import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cpSync, mkdirSync, existsSync } from 'fs';

/**
 * Chrome Extension Vite Config
 *
 * CRITICAL: Manifest V3 requires static, unhashed filenames.
 * Standard Vite adds hashes (e.g. contentScript-a8f9b.js) which breaks
 * the manifest's static entry points. We override Rollup output to
 * produce clean, predictable filenames.
 *
 * We only bundle JS entry points (content script + service worker).
 * HTML files (popup, auth-success) are copied as static assets.
 */

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');

      // Copy manifest.json
      cpSync(resolve(__dirname, 'manifest.json'), resolve(dist, 'manifest.json'));

      // Copy icons
      const iconsDir = resolve(__dirname, 'icons');
      if (existsSync(iconsDir)) {
        const destIcons = resolve(dist, 'icons');
        if (!existsSync(destIcons)) mkdirSync(destIcons, { recursive: true });
        cpSync(iconsDir, destIcons, { recursive: true });
      }

      // Copy popup HTML + JS (standalone vanilla JS, not bundled)
      cpSync(
        resolve(__dirname, 'src/popup/popup.html'),
        resolve(dist, 'popup.html')
      );
      cpSync(
        resolve(__dirname, 'src/popup/popup.js'),
        resolve(dist, 'popup.js')
      );

      // Copy auth-success HTML + JS
      cpSync(
        resolve(__dirname, 'src/background/auth-success.html'),
        resolve(dist, 'authSuccess.html')
      );
      cpSync(
        resolve(__dirname, 'src/background/auth-success.js'),
        resolve(dist, 'authSuccess.js')
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        contentScript: resolve(__dirname, 'src/content/contentScript.jsx'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.js'),
      },

      output: {
        // No hashes — Chrome Extension needs static filenames
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },

    minify: false,
    target: 'esnext',
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
