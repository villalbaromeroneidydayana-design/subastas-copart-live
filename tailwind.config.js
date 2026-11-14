/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        copart: {
          blue: '#002f6c',
          navy: '#0c192c',
          dark: '#070d18',
          card: '#132238',
          yellow: '#ffb81c',
          green: '#00873d',
          greenLight: '#00a84d',
          red: '#d92525',
          border: '#1f3452',
          textMuted: '#8ba2c4',
          grayBg: '#f4f6f9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-bid': 'flashBid 0.6s ease-out',
        'hammer': 'hammer 0.5s ease-in-out',
      },
      keyframes: {
        flashBid: {
          '0%': { backgroundColor: 'rgba(0, 168, 77, 0.4)', transform: 'scale(1.02)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
        hammer: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-25deg)' },
        }
      }
    },
  },
  plugins: [],
}
