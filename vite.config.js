import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "src/frontend",
  server: {
    proxy: {
      "/api": "http://localhost:3005",
    },
  },
  build: {
    // place built files at project root /dist when building from src/frontend
    outDir: "../../dist",
  },
});
