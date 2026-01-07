import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(),
    {
      name: 'copy-service-worker',
      writeBundle() {
        const srcPath = resolve(__dirname, 'public/sw.js');
        const destPath = resolve(__dirname, 'dist/sw.js');

        // Copy version.json
        const versionSrc = resolve(__dirname, 'public/version.json');
        const versionDest = resolve(__dirname, 'dist/version.json');
        
        try {
          if (existsSync(srcPath)) {
            copyFileSync(srcPath, destPath);
            console.log('\n✅ Copied sw.js to dist/\n');
          } else {
            console.error('\n❌ ERROR: public/sw.js not found!\n');
          }
          
        
          if (existsSync(versionSrc)) {
            copyFileSync(versionSrc, versionDest);
            console.log('✅ Copied version.json to dist/\n');
          }
        } catch (error) {
          console.error('\n❌ Failed to copy sw.js:', error.message, '\n');
        }
      }
    }

  ],
  
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
  },
  resolve: {
    alias: { "pouchdb": "pouchdb-browser" }
  },
  optimizeDeps: {
    include: ["pouchdb-browser", "pouchdb-find", "pouchdb-upsert"],
    esbuildOptions: { target: "esnext" },
    force: true  // ← KEY: Force rebuild
  },
  base: './', // CRITICAL for Electron
  build: {
    target: "esnext",
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/pouchdb/, /node_modules/]
    }
  },
  publicDir: 'public',
  server: {
    port: 5173,
    strictPort: true
  }
});