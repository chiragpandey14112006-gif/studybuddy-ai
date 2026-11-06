/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFCFB',
          100: '#FAF8F5',
          200: '#F4EFEB',
          300: '#EAE2D9',
          border: '#E8E3DD',
        },
        academic: {
          ink: '#1E293B',
          muted: '#64748B',
          soft: '#94A3B8',
          accent: '#4F46E5', // Indigo ink
          study: '#0D9488',  // Sage teal
          highlight: '#FEF08A', // Highlighter yellow
          coral: '#F43F5E',
          amber: '#D97706'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif']
      },
      boxShadow: {
        'notebook': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px -2px rgba(0,0,0,0.03)',
        'notebook-hover': '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 24px -3px rgba(0,0,0,0.06)',
        'polaroid': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
      }
    },
  },
  plugins: [],
}
