/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['InterVariable', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      width: {
        '88': '22rem', // Legacy: 352px for side panels (now handled by component CSS)
      },
      // Custom responsive breakpoints for chess board sizing
      screens: {
        'xs': '480px',      // Extra small devices
        'tablet': '768px',  // Tablets
        'laptop': '1024px', // Laptops
        'desktop': '1600px',// Desktop displays
        'xl-desktop': '2560px', // Large desktop displays
      },
    },
  },
  plugins: [],
};
