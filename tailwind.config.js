/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      width: {
        '88': '22rem', // w-80 is 20rem, so 22rem is 10% wider
      }
    },
  },
  plugins: [],
};
