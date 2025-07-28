/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: { 'inter': ['Inter', 'sans-serif'] },
      colors: { 'minecraft-green': '#00ff00', 'minecraft-brown': '#8B4513', 'minecraft-blue': '#1e40af', 'minecraft-gray': '#4a5568' }
    }
  },
  plugins: [],
}