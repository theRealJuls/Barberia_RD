import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El plugin de React habilita el runtime JSX automatico y Fast Refresh.
// Sin esta configuracion, Vite compila el JSX en modo clasico y exige
// importar React en cada archivo (provocaba "React is not defined" en App.jsx).
export default defineConfig({
  plugins: [react()],
});
