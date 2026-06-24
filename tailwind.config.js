/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          dark: '#1E90FF',
          mid: '#87CEEB',
          light: '#FFF8DC'
        },
        brand: {
          cyan: '#00FFFF',
          yellow: '#FFD700',
          navy: '#1A1A2E'
        }
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      screens: {
        'xs': '360px',
      },
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-left))',
      }
    },
  },
  plugins: [],
}
