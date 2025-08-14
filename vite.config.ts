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
});
