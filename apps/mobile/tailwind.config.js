/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#A3FF3C',
        secondary: '#16153A',
        background: '#16153A',
        surface: '#1E1D4A',
        textPrimary: '#FFFFFF',
        textSecondary: '#9CA3AF',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
