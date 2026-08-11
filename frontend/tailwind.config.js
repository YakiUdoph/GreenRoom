/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-fixed': '#72ff70',
        'primary-container': '#00ff41',
        'primary-fixed-dim': '#00e639',
        'on-primary-container': '#007117',
        'background': '#131313',
        'surface-container-low': '#1c1b1b',
        'surface-container-high': '#2a2a2a',
        'surface-variant': '#353534',
        'outline-variant': '#3b4b37',
        'on-surface-variant': '#b9ccb2',
        'on-background': '#e5e2e1',
        'on-surface': '#e5e2e1',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Geist', 'monospace'],
      },
      spacing: {
        gutter: '24px',
        'margin-desktop': '48px',
        'margin-mobile': '16px',
        'container-max': '1440px',
      }
    },
  },
  plugins: [],
}
