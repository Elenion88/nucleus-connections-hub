/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nucleus brand palette — deep navy + warm copper accent + soft cream backgrounds.
        // Anchored on a deep-tech / Utah-mountain feel rather than generic SaaS purple.
        nucleus: {
          ink: '#0c1525',         // primary text / nav background
          deep: '#16213d',        // surfaces
          accent: '#c4794a',      // copper, used for CTAs and "matched" highlights
          accent2: '#5a8c84',     // sage, used for secondary accents
          cream: '#f7f3ec',       // page background
          paper: '#ffffff',
          subtle: '#5b6577',      // secondary text
          line: '#e7e0d3',        // hairlines on cream
          stripe: '#fbf6ec',      // alt rows
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12,21,37,.05), 0 4px 16px rgba(12,21,37,.06)',
        ring: '0 0 0 1px rgba(12,21,37,.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
