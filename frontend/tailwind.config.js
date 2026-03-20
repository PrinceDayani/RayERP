/** @type {import('tailwindcss').Config} */
const path = require('path');

module.exports = {
	darkMode: "class",
	content: [
	  path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}')
	],
	theme: {
	  extend: {
		screens: {
		  'xs': '300px',
		  'sm': '640px',
		  'md': '768px',
		  'lg': '1024px',
		  'xl': '1280px',
		  '2xl': '1536px',
		  '3xl': '1920px',
		  '4k': '2560px',
		},
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)'
		},
		colors: {
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
		  card: {
			DEFAULT: 'hsl(var(--card))',
			foreground: 'hsl(var(--card-foreground))'
		  },
		  popover: {
			DEFAULT: 'hsl(var(--popover))',
			foreground: 'hsl(var(--popover-foreground))'
		  },
		  primary: {
			DEFAULT: 'hsl(var(--primary))',
			foreground: 'hsl(var(--primary-foreground))'
		  },
		  secondary: {
			DEFAULT: 'hsl(var(--secondary))',
			foreground: 'hsl(var(--secondary-foreground))'
		  },
		  muted: {
			DEFAULT: 'hsl(var(--muted))',
			foreground: 'hsl(var(--muted-foreground))'
		  },
		  accent: {
			DEFAULT: 'hsl(var(--accent))',
			foreground: 'hsl(var(--accent-foreground))'
		  },
		  destructive: {
			DEFAULT: 'hsl(var(--destructive))',
			foreground: 'hsl(var(--destructive-foreground))'
		  },
		  success: {
			DEFAULT: 'hsl(var(--success))',
			foreground: 'hsl(var(--success-foreground))'
		  },
		  warning: {
			DEFAULT: 'hsl(var(--warning))',
			foreground: 'hsl(var(--warning-foreground))'
		  },
		  info: {
			DEFAULT: 'hsl(var(--info))',
			foreground: 'hsl(var(--info-foreground))'
		  },
		  burgundy: {
			50: 'hsl(var(--burgundy-50))',
			100: 'hsl(var(--burgundy-100))',
			200: 'hsl(var(--burgundy-200))',
			300: 'hsl(var(--burgundy-300))',
			400: 'hsl(var(--burgundy-400))',
			500: 'hsl(var(--burgundy-500))',
			600: 'hsl(var(--burgundy-600))',
			700: 'hsl(var(--burgundy-700))',
			800: 'hsl(var(--burgundy-800))',
			900: 'hsl(var(--burgundy-900))',
		  },
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  ring: 'hsl(var(--ring))',
		  chart: {
			'1': 'hsl(var(--chart-1))',
			'2': 'hsl(var(--chart-2))',
			'3': 'hsl(var(--chart-3))',
			'4': 'hsl(var(--chart-4))',
			'5': 'hsl(var(--chart-5))'
		  }
		},
		animation: {
		  'accordion-down': 'accordion-down 0.2s ease-out',
		  'accordion-up': 'accordion-up 0.2s ease-out'
		},
		keyframes: {
		  'accordion-down': {
			from: { height: 0 },
			to: { height: 'var(--radix-accordion-content-height)' }
		  },
		  'accordion-up': {
			from: { height: 'var(--radix-accordion-content-height)' },
			to: { height: 0 }
		  }
		}
	  }
	},
	plugins: [require("tailwindcss-animate")],
  }