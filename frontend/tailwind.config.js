/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
	extend: {
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
		colors: {
			// 🏛️ OBSIDIAN & EMBER - Empire Color System
			obsidian: {
				DEFAULT: '#000000',  // Pure black background
				light: '#0a0a0a',     // Slightly lighter black
			},
			olive: {
				DEFAULT: '#2a2a1f',   // Warm olive card background
				light: '#35342a',     // Lighter olive for hover
				dark: '#1f1f1a',      // Darker olive
			},
			ember: {
				DEFAULT: '#C74E1E',   // Burnt orange primary
				light: '#D45B1F',     // Lighter orange for hover
				dark: '#A63F18',      // Darker orange for pressed
				glow: 'rgba(199, 78, 30, 0.3)',  // Orange glow effect
			},
			// Keep existing shadcn colors
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
		keyframes: {
			'accordion-down': {
				from: {
					height: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			'pulse-glow': {
				'0%, 100%': {
					boxShadow: '0 0 20px rgba(199, 78, 30, 0.5)'
				},
				'50%': {
					boxShadow: '0 0 40px rgba(199, 78, 30, 0.8)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
		}
	}
  },
  plugins: [require("tailwindcss-animate")],
};
