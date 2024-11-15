/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F6FF',
          100: '#BAE3FF',
          200: '#7CC4FA',
          300: '#47A3F3',
          400: '#2186EB',
          500: '#0967D2',
          600: '#0552B5',
          700: '#03449E',
          800: '#01337D',
          900: '#002159',
        },
        neutral: {
          50: '#F5F7FA',
          100: '#E4E7EB',
          200: '#CBD2D9',
          300: '#9AA5B1',
          400: '#7B8794',
          500: '#616E7C',
          600: '#52606D',
          700: '#3E4C59',
          800: '#323F4B',
          900: '#1F2933',
        },
        success: {
          50: '#E3F9E5',
          100: '#C1F2C7',
          200: '#91E697',
          300: '#51CA58',
          400: '#31B237',
          500: '#18981D',
          600: '#0F8613',
          700: '#0A6F0D',
          800: '#035F07',
          900: '#014807',
        },
        warning: {
          50: '#FFF9E6',
          100: '#FFEDB3',
          200: '#FFE083',
          300: '#FFD24D',
          400: '#FFC726',
          500: '#FFBB00',
          600: '#E6A800',
          700: '#CC9600',
          800: '#B38300',
          900: '#996F00',
        },
        error: {
          50: '#FFE3E3',
          100: '#FFBDBD',
          200: '#FF9B9B',
          300: '#F86A6A',
          400: '#EF4E4E',
          500: '#E12D39',
          600: '#CF1124',
          700: '#AB091E',
          800: '#8A041A',
          900: '#610316',
        },
      },
    },
  },
  plugins: [],
}
