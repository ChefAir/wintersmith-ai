/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // use with class="animate-fade-in"
        'fade-in': 'fadeInUp 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-gradient-to-b", "from-blue-300", "to-blue-50",
    "bg-blue-600", "text-gray-500"
  ],
}
