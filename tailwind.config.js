/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C8102E',
          hover:   '#A50D26',
          light:   '#E8112E',
          muted:   'rgba(200,16,46,0.08)',
        },
        charcoal: {
          DEFAULT: '#0A0A0A',
          mid:     '#1A1A1A',
          soft:    '#2C2C2C',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'red': '0 4px 14px rgba(200,16,46,0.25)',
      },
    },
  },
  plugins: [],
}
