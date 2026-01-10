/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ADICIONE ESTAS CORES:
      colors: {
        'atk-dark': '#121212',    // Fundo principal
        'atk-card': '#1E1E1E',    // Fundo dos cards
        'atk-neon': '#00FFC2',    // Verde/Ciano Neon de destaque
        'atk-hover': '#00E0A8',   // Neon um pouco mais escuro para hover
      },
      fontFamily: {
        // Vamos usar uma fonte padrão mais moderna se possível,
        // mas por enquanto vamos forçar um estilo sans-serif forte.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}