import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/solve-sudoku": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/generate": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});