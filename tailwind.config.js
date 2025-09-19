/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './admin.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#192233',
        secondary: '#141416',
        accent: '#FFCC00',
        'text-primary': '#595E6F',
        'text-secondary': '#6E7794',
        'text-tertiary': '#F4F0EC',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['Cormorant Garamond', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        hero: ['40px', { lineHeight: '120%' }],
        heading: ['32px', { lineHeight: '120%' }],
        subheading: ['24px', { lineHeight: '130%' }],
        label: ['14px', { lineHeight: '130%' }],
        body: ['16px', { lineHeight: '150%' }],
        caption: ['13px', { lineHeight: '130%' }],
      },
      spacing: {
        section: '2rem',
        card: '1.5rem',
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};


