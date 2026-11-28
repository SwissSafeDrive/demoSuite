import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode, isPreview }) => ({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? "/demoSuite/" : "/",
  build: {
    target: "es2020",
    outDir: "dist",
  },
  optimizeDeps: {
    include: ["@tensorflow/tfjs", "@tensorflow-models/coco-ssd"],
  },
  ...(command === "serve" && !isPreview
    ? {
        server: {
          proxy: {
            "/api": `http://127.0.0.1:${loadEnv(mode, process.cwd(), "SSD_PORT").SSD_PORT || "8765"}`,
          },
        },
      }
    : {}),
}));
