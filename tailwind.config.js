/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      colors: {
        primary: {
          light: '#60a5fa',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: {
          light: '#a78bfa',
          DEFAULT: '#8b5cf6',
          dark: '#7c3aed',
        },
        neutral: {
          white: '#ffffff',
          light: '#f8fafc',
          muted: '#94a3b8',
          medium: '#64748b',
          dark: '#334155',
          darker: '#1e293b',
          black: '#0f172a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        dark: {
          primary: {
            light: '#93c5fd',
            DEFAULT: '#3b82f6',
            dark: '#2563eb',
          },
          secondary: {
            light: '#c4b5fd',
            DEFAULT: '#8b5cf6',
            dark: '#7c3aed',
          },
          neutral: {
            white: '#0f172a',
            light: '#1e293b',
            muted: '#64748b',
            medium: '#94a3b8',
            dark: '#e2e8f0',
            darker: '#f1f5f9',
            black: '#ffffff',
          },
          bg: {
            primary: '#0f172a',
            secondary: '#1e293b',
          },
        },
      },
    },
  },
  plugins: [],
}; 