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
        sans: ['Space Grotesk', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(255, 77, 0, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(255, 77, 0, 0.6)' },
        },
        'reveal-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        float: 'float 6s ease-in-out infinite',
        'scan-line': 'scan-line 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'reveal-up': 'reveal-up 0.6s ease-out',
      },
      colors: {
        // Industrial Futurism Color Palette
        'neon-orange': {
          DEFAULT: '#FF4D00',
          light: '#FF6A1A',
          dark: '#CC3D00',
        },
        'electric-blue': {
          DEFAULT: '#00D9FF',
          light: '#33E5FF',
          dark: '#00ADC5',
        },
        'acid-green': {
          DEFAULT: '#39FF14',
          light: '#66FF47',
          dark: '#2ECC0F',
        },
        'deep-charcoal': {
          DEFAULT: '#0A0A0A',
          light: '#1A1A1A',
          dark: '#000000',
        },
        'industrial-gray': {
          DEFAULT: '#1E1E1E',
          light: '#2A2A2A',
          dark: '#121212',
        },
        'metallic': {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
          dark: '#C0C0C0',
        },
        // Light mode colors
        'surface': {
          DEFAULT: '#FFFFFF',
          light: '#F9FAFB',
          dark: '#1E1E1E',
        },
        'surface-alt': {
          DEFAULT: '#F9FAFB',
          light: '#F3F4F6',
          dark: '#252525',
        },
        // Legacy colors (for compatibility)
        primary: {
          light: '#FF6A1A',
          DEFAULT: '#FF4D00',
          dark: '#CC3D00',
        },
        secondary: {
          light: '#33E5FF',
          DEFAULT: '#00D9FF',
          dark: '#00ADC5',
        },
        neutral: {
          white: '#FFFFFF',
          light: '#F5F5F5',
          muted: '#9CA3AF',
          medium: '#6B7280',
          dark: '#374151',
          darker: '#1F2937',
          black: '#0A0A0A',
        },
        success: '#39FF14',
        warning: '#FFB800',
        error: '#FF0040',
        info: '#00D9FF',
        dark: {
          primary: {
            light: '#FF6A1A',
            DEFAULT: '#FF4D00',
            dark: '#CC3D00',
          },
          secondary: {
            light: '#33E5FF',
            DEFAULT: '#00D9FF',
            dark: '#00ADC5',
          },
          neutral: {
            white: '#0A0A0A',
            light: '#1E1E1E',
            muted: '#6B7280',
            medium: '#9CA3AF',
            dark: '#D4D4D4',
            darker: '#F5F5F5',
            black: '#FFFFFF',
          },
          bg: {
            primary: '#0A0A0A',
            secondary: '#1E1E1E',
          },
        },
      },
      backgroundImage: {
        'tech-grid': 'linear-gradient(to right, rgba(255, 77, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 77, 0, 0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'tech-grid': '50px 50px',
      },
    },
  },
  plugins: [],
}; 