/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        neutral: {
          '000': '#FFFFFF',
          100: '#ECECED',
          200: '#BFBFBF',
          300: '#737373',
          400: '#484847',
          500: '#000000',
        },
        bg: {
          light: '#F2F2F2',
          dark: '#141215',
        },
      },
    },
  },
  plugins: [],
};
