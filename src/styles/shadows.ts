/**
 * Shadow Design Tokens
 * Consistent elevation and depth system
 */

// Shadow scale for different elevation levels
export const shadows = {
  // No shadow
  none: {
    light: 'none',
    dark: 'none',
  },

  // Subtle shadow for hovered elements
  xs: {
    light: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    dark: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  },

  // Small shadow for cards and buttons
  sm: {
    light: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    dark: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  },

  // Medium shadow for elevated cards
  md: {
    light: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    dark: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
  },

  // Large shadow for modals and dropdowns
  lg: {
    light: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    dark: '0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.6)',
  },

  // Extra large shadow for hero elements
  xl: {
    light: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    dark: '0 20px 25px -5px rgb(0 0 0 / 0.7), 0 8px 10px -6px rgb(0 0 0 / 0.7)',
  },

  // 2XL shadow for special emphasis
  '2xl': {
    light: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    dark: '0 25px 50px -12px rgb(0 0 0 / 0.8)',
  },

  // Inner shadow for inset elements
  inner: {
    light: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    dark: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
  },
} as const;

// Neon glow shadows for tech aesthetic
export const neonGlows = {
  // Cyan glow
  cyan: {
    light: '0 0 20px rgb(34 211 238 / 0.3)',
    dark: '0 0 30px rgb(34 211 238 / 0.5)',
  },

  // Purple glow
  purple: {
    light: '0 0 20px rgb(168 85 247 / 0.3)',
    dark: '0 0 30px rgb(168 85 247 / 0.5)',
  },

  // Blue glow
  blue: {
    light: '0 0 20px rgb(59 130 246 / 0.3)',
    dark: '0 0 30px rgb(59 130 246 / 0.5)',
  },

  // Combined cyan and purple glow
  gradient: {
    light: '0 0 20px rgb(34 211 238 / 0.2), 0 0 40px rgb(168 85 247 / 0.2)',
    dark: '0 0 30px rgb(34 211 238 / 0.4), 0 0 60px rgb(168 85 247 / 0.4)',
  },
} as const;

// Shadow usage guidelines
export const shadowUsage = {
  // Buttons and interactive elements
  interactive: 'sm', // Subtle shadow that grows on hover

  // Cards in lists/grids
  card: 'md', // Medium elevation

  // Modals and dialogs
  modal: 'xl', // High elevation

  // Dropdowns and tooltips
  dropdown: 'lg', // Medium-high elevation

  // Hero and featured elements
  hero: '2xl', // Maximum elevation

  // Form inputs
  input: 'sm', // Subtle inner shadow for depth
} as const;

// Get shadow for current theme
export const getShadow = (
  size: keyof typeof shadows,
  isDark: boolean = false
): string => {
  return shadows[size][isDark ? 'dark' : 'light'];
};

// Get neon glow for current theme
export const getNeonGlow = (
  color: keyof typeof neonGlows,
  isDark: boolean = false
): string => {
  return neonGlows[color][isDark ? 'dark' : 'light'];
};
