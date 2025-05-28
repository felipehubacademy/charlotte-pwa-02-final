/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A3FF3C',
        'primary-dark': '#8FE61A',
        secondary: '#16153A',
        'secondary-light': '#1E1D42',
        charcoal: '#212121',
        'charcoal-light': '#2A2A2A',
        white: '#FFFFFF',
        'white-dim': '#F5F5F5',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B0B0',
        'text-muted': '#808080',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'typing-bounce': 'typing-bounce 1.4s infinite ease-in-out',
        'audio-wave': 'audio-wave 1.2s infinite ease-in-out',
        'mic-pulse': 'mic-pulse 1.8s infinite ease-in-out',
        'glow-pulse': 'glow-pulse 2s infinite',
      },
    },
  },
  plugins: [],
}