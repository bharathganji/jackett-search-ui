import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", // Ensure proper base path for deployment
  publicDir: "public", // Explicit public directory
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,

    // Configure chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          vendor: ["react", "react-dom"],
          // Separate UI library chunks
          ui: ["@radix-ui/react-slot", "@radix-ui/react-progress"],
          // Separate utility chunks
          utils: ["clsx", "tailwind-merge", "class-variance-authority"],
        },
      },
    },

    // Enable minification
    minify: "terser",

    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.info", "console.debug"],
      },
    },

    // Enable reporting of compressed sizes
    reportCompressedSize: true,

    // Reduce chunk size warnings limit
    chunkSizeWarningLimit: 1000,
  },
});
