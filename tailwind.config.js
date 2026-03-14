/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glico-dark': '#020617',     // Fondo profundo
        'glico-blue': '#38bdf8',     // Azul interactivo (Sync)
        'glico-green': '#22c55e',    // Rango ideal
        'glico-red': '#ef4444',      // Alerta alta / Corazones
        'glico-indigo': '#6366f1',   // Alerta baja
      }
    },
  },
  plugins: [],
}