/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    "bg-gradient-to-b", "from-blue-300", "to-blue-50",
    "bg-blue-600", "text-gray-500"
  ],
}
