module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontSize: {
      'xs': '.75rem',
      'sm': '.875rem',
      'tiny': '.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
      '7xl': '5rem',
    },
    extend: {
      colors: {
        'theme-yt-red': '#e63b2f',
        'theme-yt-red-1': '#e1625a',
        'theme-yt-red-2': '#BF3026',
        'theme-beige': '#fefdfb',
        'theme-beige-1': '#F2F1F0',
        'theme-beige-2': '#e3e2e0',
        'theme-beige-3': '#A6A5A4',
        'theme-yellow': '#f9eb21',
      },
    },
  },
  plugins: [],
};
