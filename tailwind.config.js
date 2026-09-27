/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  // The rest of the app is MUI plus inline styles. Preflight would reset those
  // out from under it, so Tailwind is layered on top rather than taking over.
  corePlugins: { preflight: false },
  theme: {
    // Same scale as src/lib/type.ts. Two weights: 400 and 600.
    fontSize: {
      xs: ['12px', { lineHeight: '1.33', letterSpacing: '-0.01em' }],
      sm: ['14px', { lineHeight: '1.43', letterSpacing: '-0.016em' }],
      base: ['17px', { lineHeight: '1.47', letterSpacing: '-0.022em' }],
      lg: ['19px', { lineHeight: '1.38', letterSpacing: '0.011em' }],
      xl: ['21px', { lineHeight: '1.38', letterSpacing: '0.011em' }],
      '2xl': ['clamp(21px, 2vw, 28px)', { lineHeight: '1.143', letterSpacing: '0.007em' }],
      '3xl': ['32px', { lineHeight: '1.125', letterSpacing: '0.004em' }],
      '4xl': ['clamp(32px, 3.4vw, 48px)', { lineHeight: '1.083', letterSpacing: '-0.003em' }],
      '5xl': ['64px', { lineHeight: '1.06', letterSpacing: '-0.01em' }],
      '6xl': ['clamp(48px, 5.6vw, 80px)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
    },
    fontWeight: {
      normal: '400',
      medium: '600',
      semibold: '600',
      bold: '600',
    },
    extend: {
      colors: {
        ink: '#0A0A0A',
        panel: 'rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
