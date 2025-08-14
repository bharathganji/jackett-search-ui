import react from "@vitejs/plugin-react";
import { URL, fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    base: "/",
    publicDir: "public",
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      // Add other variables as needed
      __API_URL__: JSON.stringify(
        env.VITE_APP_JACKETT_API_URL || process.env.VITE_APP_JACKETT_API_URL
      ),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
