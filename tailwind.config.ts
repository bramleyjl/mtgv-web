import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MTGV brand colors (can be customized)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        // Card border colors
        card: {
          black: '#000000',
          white: '#ffffff',
        },
      },
      screens: {
        // Custom breakpoints for responsive design
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        // Custom spacing for card layouts
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        // Card dimensions
        'card': '223px',
        'card-sm': '146px',
      },
      aspectRatio: {
        // Card aspect ratio
        'card': '745 / 1040',
      },
      animation: {
        // Loading animations
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Custom utilities for card selection
    function({ addUtilities }: any) {
      const newUtilities = {
        '.card-selected': {
          'box-shadow': '0 0 0 3px rgba(14, 165, 233, 0.5)',
          'border-color': '#0ea5e9',
        },
        '.card-hover': {
          'transform': 'scale(1.02)',
          'transition': 'transform 0.2s ease-in-out',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config 