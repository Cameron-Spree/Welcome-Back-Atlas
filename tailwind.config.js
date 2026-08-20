/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          surface: '#1e293b',
          surfaceLight: '#334155',
          border: '#334155',
          text: '#f8fafc',
          textMuted: '#94a3b8',
        },
        user: {
          cam: {
            DEFAULT: '#10b981', // emerald
            light: '#34d399',
            dark: '#059669',
            bg: '#064e3b',
          },
          liam: {
            DEFAULT: '#6366f1', // indigo
            light: '#818cf8',
            dark: '#4f46e5',
            bg: '#312e81',
          },
          alex: {
            DEFAULT: '#f59e0b', // amber
            light: '#fbbf24',
            dark: '#d97706',
            bg: '#78350f',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
