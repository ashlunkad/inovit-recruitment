/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#EBF5FB', 100: '#D6EAF8', 200: '#AED6F1', 300: '#85C1E9', 400: '#5DADE2', 500: '#2E86C1', 600: '#2874A6', 700: '#21618C', 800: '#1B4F72', 900: '#154360' },
        accent: { 50: '#FEF5E7', 100: '#FDEBD0', 400: '#F0B27A', 500: '#E67E22', 600: '#CA6F1E' },
        success: { 50: '#E8F8F5', 500: '#27AE60', 600: '#229954' },
        danger: { 50: '#FDEDEC', 500: '#E74C3C', 600: '#CB4335' },
      },
    },
  },
  plugins: [],
};
