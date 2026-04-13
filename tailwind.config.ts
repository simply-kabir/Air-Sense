/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      colors: {
        navy: {
          900: '#03070F', 800: '#060B1A', 700: '#0A1128',
          600: '#0F1A3A', 500: '#162050', 400: '#1E2D6B',
        },
        cobalt: { 700: '#1A3A7A', 500: '#2553B8', 300: '#3B6FE8' },
        gold:   { 400: '#F5A623', 300: '#FFB84D', 200: '#FFD080', 100: '#FFF0C4' },
        cyan:   { 400: '#00D4FF', 200: '#4DDFFF' },
        muted:  '#8899CC',
        muted2: '#556088',
        aqi: {
          good: '#00E5A0', moderate: '#FFD60A', sensitive: '#FF8C00',
          unhealthy: '#FF3B4E', very: '#9B2FFF', hazardous: '#7B0000',
        },
        kids: {
          bg: '#FFF8F0', primary: '#FF6B6B', secondary: '#4ECDC4',
          yellow: '#FFE66D', purple: '#C77DFF', blue: '#74B9FF',
        },
      },
      backgroundImage: {
        'grid-navy':   'linear-gradient(rgba(59,111,232,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,111,232,0.05) 1px,transparent 1px)',
        'radial-gold': 'radial-gradient(ellipse at center, rgba(245,166,35,0.15) 0%, transparent 70%)',
        'radial-blue': 'radial-gradient(ellipse at center, rgba(59,111,232,0.2) 0%, transparent 70%)',
      },
      backgroundSize: { grid: '48px 48px' },
      borderRadius:   { '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        gold:    '0 0 30px rgba(245,166,35,0.25),0 0 60px rgba(245,166,35,0.1)',
        blue:    '0 0 30px rgba(59,111,232,0.3),0 0 60px rgba(59,111,232,0.1)',
        card:    '0 4px 24px rgba(0,0,0,0.4)',
        'card-lg':'0 8px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
