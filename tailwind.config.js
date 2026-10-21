/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B4FD8',
          hover: '#2E3FB5',
          light: '#EEF1FD',
          dark: '#2A3BB0',
        },
        surface: {
          bg: '#F2F4F8',
          card: '#FFFFFF',
          border: '#D5D9E2',
        },
        content: {
          primary: '#1B1F2A',
          muted: '#64748B',
          blue: '#2A3BB0',
        },
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
