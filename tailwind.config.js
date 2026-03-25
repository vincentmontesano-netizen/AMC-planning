/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'tv': '1920px', // TV display mode
        '4k': '2560px', // 4K TV support
      },
      fontSize: {
        'tv-xs': ['1rem', { lineHeight: '1.5' }],
        'tv-sm': ['1.125rem', { lineHeight: '1.5' }],
        'tv-base': ['1.25rem', { lineHeight: '1.5' }],
        'tv-lg': ['1.5rem', { lineHeight: '1.4' }],
        'tv-xl': ['2rem', { lineHeight: '1.3' }],
        'tv-2xl': ['2.5rem', { lineHeight: '1.2' }],
        'tv-3xl': ['3.5rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'tv-1': '0.5rem',
        'tv-2': '1rem',
        'tv-3': '1.5rem',
        'tv-4': '2rem',
        'tv-6': '3rem',
        'tv-8': '4rem',
      }
    },
  },
  plugins: [],
};
