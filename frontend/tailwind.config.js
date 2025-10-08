/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#f59e0b',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}