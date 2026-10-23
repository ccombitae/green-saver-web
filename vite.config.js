import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Las librerías de gráficas en un archivo aparte: la página de inicio carga más rápido
        manualChunks: { charts: ["recharts"], react: ["react", "react-dom", "react-router-dom"] },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.js",
  },
});
