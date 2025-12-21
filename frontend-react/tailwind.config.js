/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary: Deep Green (Trustworthy, Professional)
        primary: {
          50: '#f2fcf5',
          100: '#e1f8e8',
          200: '#c3ecd0',
          300: '#94dab0',
          400: '#5abf8e',
          500: '#34a374',
          600: '#23825b', // Main Brand Color
          700: '#1d684a',
          800: '#19533d',
          900: '#154434', // Deep Backgrounds
          950: '#0b261d',
        },
        // Accent: Muted Gold/Bronze (Premium feel)
        accent: {
          50: '#fbf9f1',
          100: '#f5f0db',
          200: '#ebe0b5',
          300: '#dec783',
          400: '#d0ad56',
          500: '#b6923b',
          600: '#9a762f',
          700: '#7b5a28',
          800: '#654826',
          900: '#533b24',
        },
        // Secondary: Slate/Gray (Neutrals)
        slate: {
          850: '#172033', // Custom dark for sidebar
        },
        emerald: { // Keep for backward compatibility if needed, but alias to primary mostly
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'], // For headers
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right bottom, #154434, #1d684a)',
        'gradient-subtle': 'linear-gradient(to right bottom, #f2fcf5, #ffffff)',
      },
    },
  },
  plugins: [],
}