import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        // The client shares the server's dropdown values and fee schedule. Only these
        // files are allowed from outside client/, because `--host` exposes the dev server.
        fs: {
            allow: [".", "../utils/constants.js", "../utils/feeSchedule.js"],
        },
        proxy: {
            // Must match PORT in the root .env
            "/api": {
                target: "http://localhost:5100",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://localhost:5100",
                changeOrigin: true,
            },
        },
    },
});
