import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Set GITHUB_PAGES=true in CI to deploy under /SwissSafeDrive/
  base: process.env.GITHUB_PAGES ? "/demoSuite/" : "/",
  build: {
    target: "es2020",
    outDir: "dist",
  },
  optimizeDeps: {
    include: ["@tensorflow/tfjs", "@tensorflow-models/coco-ssd"],
  },
});
