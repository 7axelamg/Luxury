/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#111111',
          red: '#C8102E',
          DEFAULT: '#C8102E',
        },
        neutral: {
          white: '#FFFFFF',
          bg: '#F7F7F8',
          border: '#E5E5E8',
          secondary: '#6B6B76',
        },
        semantic: {
          ok: {
            DEFAULT: '#1F7A4D',
            subtle: 'rgba(31, 122, 77, 0.10)',
          },
          attention: {
            DEFAULT: '#B7791F',
            subtle: 'rgba(183, 121, 31, 0.10)',
          },
          critical: {
            DEFAULT: '#C8102E',
            subtle: 'rgba(200, 16, 46, 0.10)',
          },
        },
        // Mapeo retrocompatible limpio
        primary: {
          DEFAULT: '#C8102E',
          hover: '#A50D26',
          muted: 'rgba(200, 16, 46, 0.10)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(17, 17, 17, 0.04)',
        floating: '0 4px 12px rgba(17, 17, 17, 0.08)',
      },
    },
  },
  plugins: [],
}
