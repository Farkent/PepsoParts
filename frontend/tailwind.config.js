/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F05A22',
          dark: '#D44A15',
          light: '#FFF0EA',
        },
        ink: {
          DEFAULT: '#111214',
          light: '#26272A',
        },
        sidebar: {
          DEFAULT: '#18191C',
          divider: '#242529',
          user: '#222327',
          active: '#2A2B30',
        },
        muted: {
          bg: '#F4F5F6',
          table: '#F7F7F7',
          text: '#656770',
        },
        status: {
          availableText: '#207F40',
          availableBg: '#E9F6EC',
          soldText: '#FFFFFF',
          soldBg: '#26272A',
          unavailableText: '#656770',
          unavailableBg: '#EFEFEF',
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        xs: '1px',
        sm: '2px',
        DEFAULT: '2px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}

