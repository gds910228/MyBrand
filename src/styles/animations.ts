/**
 * Animation Design Tokens
 * Consistent animation timing and easing functions across the application
 */

// Duration tokens (in milliseconds)
export const duration = {
  instant: 100,
  fast: 150,
  normal: 200,
  gentle: 300,
  slow: 400,
  slower: 500,
} as const;

// Easing functions
export const easing = {
  // Linear
  linear: [0, 0, 1, 1] as const,

  // Standard (Framer Motion format: [x1, y1, x2, y2])
  ease: [0.25, 0.1, 0.25, 1] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  easeOut: [0, 0, 0.58, 1] as const,
  easeInOut: [0.42, 0, 0.58, 1] as const,

  // Custom (matches cubic-bezier values)
  DEFAULT: [0.4, 0, 0.2, 1] as const, // Material Design standard
  enter: [0, 0, 0.2, 1] as const, // Smooth entry
  exit: [0.4, 0, 1, 1] as const, // Smooth exit
  bounce: [0.68, -0.55, 0.265, 1.55] as const, // Bouncy effect
  sharp: [0.4, 0, 0.6, 1] as const, // Sharp transitions
} as const;

// Animation delay presets
export const delay = {
  none: 0,
  short: 100,
  normal: 200,
  medium: 300,
  long: 500,
} as const;

// Transition presets
export const transitions = {
  // Fast transitions for small elements
  fast: {
    duration: duration.fast,
    easing: easing.DEFAULT,
  },

  // Default transitions
  default: {
    duration: duration.normal,
    easing: easing.DEFAULT,
  },

  // Smooth transitions for larger elements
  smooth: {
    duration: duration.gentle,
    easing: easing.easeOut,
  },

  // Slow transitions for dramatic effects
  slow: {
    duration: duration.slow,
    easing: easing.easeInOut,
  },
} as const;

// CSS transition string generators
export const transition = (
  properties: string | string[],
  preset: keyof typeof transitions = 'default'
): string => {
  const { duration, easing } = transitions[preset];
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  return `${props} ${duration}ms ${easing}`;
};

// Framer Motion presets
export const motion = {
  // Fade variants
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.gentle / 1000 },
  },

  // Slide up with fade
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: duration.gentle / 1000, ease: easing.easeOut },
  },

  // Slide down with fade
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: duration.gentle / 1000, ease: easing.easeOut },
  },

  // Scale with fade
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: duration.normal / 1000, ease: easing.easeOut },
  },

  // Stagger children animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: duration.normal / 1000,
      },
    },
  },

  // Hover scale for cards
  cardHover: {
    scale: 1.02,
    transition: {
      duration: duration.fast / 1000,
      ease: easing.easeOut,
    },
  },

  // Button press effect
  buttonPress: {
    scale: 0.97,
    transition: {
      duration: duration.instant / 1000,
      ease: easing.easeInOut,
    },
  },
} as const;

// Stagger delay generator
export const staggerDelay = (index: number, baseDelay: number = 100): number =>
  index * baseDelay;

// Scroll animation trigger offset (in pixels)
export const scrollOffset = {
  early: 200,  // Trigger animation early (element enters viewport)
  normal: 100, // Trigger when element is near center
  late: 50,    // Trigger when element is mostly in viewport
} as const;
