import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fixReactVirtualized from "esbuild-plugin-react-virtualized";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [fixReactVirtualized],
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("ag-grid")) {
            return "ag-grid"; // Group ag-grid related modules into a separate chunk
          }
          if (id.includes("nextui")) {
            return "nextui"; // Group NextUI components into a separate chunk
          }
          // ... your other chunking logic ...
        },
      },
    },
  },
});
