import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import MillionLint from "@million/lint";

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [react(),
    MillionLint.vite()
  ],
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
