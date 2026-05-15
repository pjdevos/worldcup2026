import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // host: '127.0.0.1' forceert IPv4-bind — anders bindt Node 17+ op ::1
  // (IPv6) en geeft Chrome op Windows ERR_CONNECTION_TIMED_OUT.
  server: { host: "127.0.0.1", port: 5173, open: false },
});
