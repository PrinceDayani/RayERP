// Brand Theme Configuration
export const brandTheme = {
  colors: {
    primary: '#970E2C',
    primaryHover: '#CD2E4F',
    primaryLight: '#E04D68',
    primaryDark: '#7D1129',
    
    // Light theme variants
    light: {
      primary: '#970E2C',
      primaryForeground: '#FFFFFF',
      background: '#FFFFFF',
      foreground: '#1A1A1A',
      card: '#FFFFFF',
      cardForeground: '#1A1A1A',
      muted: '#F8F9FA',
      mutedForeground: '#6B7280',
      border: '#E5E7EB',
      accent: '#F3F4F6',
      accentForeground: '#1A1A1A',
    },
    
    // Dark theme variants
    dark: {
      primary: '#CD2E4F',
      primaryForeground: '#FFFFFF',
      background: '#0A0A0A',
      foreground: '#FAFAFA',
      card: '#111111',
      cardForeground: '#FAFAFA',
      muted: '#1A1A1A',
      mutedForeground: '#9CA3AF',
      border: '#2A2A2A',
      accent: '#1F1F1F',
      accentForeground: '#FAFAFA',
    }
  },
  
  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Common component styles
  components: {
    button: {
      base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
      sizes: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      variants: {
        primary: 'bg-[#970E2C] text-white hover:bg-[#CD2E4F] focus:ring-[#970E2C] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        outline: 'border-2 border-[#970E2C] text-[#970E2C] hover:bg-[#970E2C] hover:text-white',
        ghost: 'text-[#970E2C] hover:bg-[#970E2C]/10',
      }
    },
    
    card: {
      base: 'rounded-xl border bg-card text-card-foreground shadow transition-all duration-300',
      variants: {
        default: 'hover:shadow-lg',
        interactive: 'hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer',
        brand: 'border-[#970E2C]/20 bg-gradient-to-br from-[#970E2C]/5 to-white dark:to-card',
      }
    },
    
    input: {
      base: 'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:border-[#970E2C] focus:ring-2 focus:ring-[#970E2C]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    },
    
    badge: {
      base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300',
      variants: {
        primary: 'bg-[#970E2C] text-white',
        secondary: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        outline: 'border border-[#970E2C] text-[#970E2C]',
        soft: 'bg-[#970E2C]/10 text-[#970E2C]',
      }
    }
  },
  
  // Animation presets
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    scaleIn: 'animate-scale-in',
    bounceIn: 'animate-bounce-in',
    glow: 'animate-glow',
  },
  
  // Shadow presets
  shadows: {
    brand: '0 4px 14px 0 rgba(151, 14, 44, 0.15)',
    brandLg: '0 10px 25px -3px rgba(151, 14, 44, 0.2), 0 4px 6px -2px rgba(151, 14, 44, 0.1)',
    glow: '0 0 20px rgba(151, 14, 44, 0.3)',
  }
};

// Utility function to get theme-aware colors
export const getThemeColor = (colorPath: string, isDark: boolean = false) => {
  const theme = isDark ? brandTheme.colors.dark : brandTheme.colors.light;
  return colorPath.split('.').reduce((obj: any, key: string) => obj?.[key], theme as any);
};

// CSS-in-JS helper for brand colors
export const brandColors = {
  primary: 'var(--brand-primary, #970E2C)',
  primaryHover: 'var(--brand-primary-hover, #CD2E4F)',
  primaryLight: 'var(--brand-primary-light, #E04D68)',
  primaryDark: 'var(--brand-primary-dark, #7D1129)',
};

export default brandTheme;