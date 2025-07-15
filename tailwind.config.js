/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: [
    "./Components/**/*.html",
    "./Pages/**/*.html",
    "./Emails/**/*.html",
    "./Snippets/**/*.html",
    "./Assets/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#F0BEFC',
          200: '#E79CF9',
          300: '#DD77F5',
          400: '#D24FF1',
          500: '#C40EEF',
          600: '#9407B5',
          700: '#6B0483',
          800: '#510164',
          900: '#3D004C',       
        },
        secondary: colors.gray,
        mainBg: '#FFFFFF',
        lightBg: '#FFFFFF',
        lightBlue: '#00B0FF',
        ligthGreen: '#81C784',
        facebook: '#1877F2',
        gray: {
          1000: '#1E1E1E'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
  safelist: [
    {
      pattern: /^wake-.*/,
    }
  ]
}
