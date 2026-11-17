/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        card: '#202020',
        card2: '#2a2a2a',
        line: '#333333',
        pill: '#4A2A1A',
        pillText: '#F0A060',
        accent: '#E8700A',
        pos: '#2ECC8F',
        muted: '#A3A3A3',
      },
      fontFamily: { sans: ['Figtree', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '22px' },
    },
  },
  plugins: [],
}
