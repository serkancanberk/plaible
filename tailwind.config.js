/** @type {import('tailwindcss').Config} */
import aspectRatio from '@tailwindcss/aspect-ratio'

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
        'text-primary': '#192233',
        'text-secondary': '#6E7794',
        'text-tertiary': '#F4F0EC',
        success: '#D3FF34',
        alert: '#D23001',
        'ui-muted': '#9A9FBF',
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
        body: ['16px', { lineHeight: '150%' }],
        label: ['14px', { lineHeight: '130%' }],
        caption: ['13px', { lineHeight: '130%' }],
      },
      spacing: {
        section: '2rem',
        card: '1.5rem',
        'spacing-xs': '0.5rem',   // 8px
        'spacing-sm': '0.75rem',  // 12px
        'spacing-md': '1rem',     // 16px
        'spacing-lg': '1.5rem',   // 24px
        'spacing-xl': '2rem',     // 32px
        'spacing-2xl': '3rem',    // 48px
        'spacing-3xl': '5rem',    // 80px
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        // Subtle, reusable card elevation consistent with our surfaces
        card: '0 8px 24px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [
    aspectRatio,
  ],
};


