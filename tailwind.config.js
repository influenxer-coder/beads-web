/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  // The rest of the app is MUI plus inline styles. Preflight would reset those
  // out from under it, so Tailwind is layered on top rather than taking over.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        panel: 'rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};
