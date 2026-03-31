import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";

  return {
    base: isExtension ? "./" : "/",
    envPrefix: ["VITE_", "REACT_APP_"],
    define: {
      global: "globalThis",
    },
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      allowedHosts: [".trycloudflare.com"],
    },
    resolve: {
      alias: { "@/": path.resolve(__dirname, "src") + "/" },
    },
    build: {
      outDir: isExtension ? "dist-extension" : "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, "index.html"),
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            animations: ["framer-motion"],
          },
        },
      },
      
      sourcemap: true,
    
      chunkSizeWarningLimit: 1000,
   
      cssMinify: true,
    },
   
    optimizeDeps: {
      include: ["react", "react-dom", "framer-motion"],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
  };
});
