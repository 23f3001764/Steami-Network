import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // Raise the warning threshold slightly — chunking will keep real sizes down
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React stack — cached across all page visits
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // Animation — framer-motion is large; isolate it so it caches well
          "vendor-motion": ["framer-motion"],

          // Three.js / 3D — only loaded on pages that use the black hole model
          "vendor-three": ["three"],

          // Radix UI primitives — shared by all shadcn components
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
          ],

          // Data / state
          "vendor-query": ["@tanstack/react-query"],
          "vendor-zustand": ["zustand"],
        },
      },
    },
  },
}));
