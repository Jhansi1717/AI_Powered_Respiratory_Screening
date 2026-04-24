/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        card: "0 20px 45px -25px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
}
