/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rlai: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          blue: '#dc2626',
          accent: '#ef4444',
          glass: 'rgba(15, 23, 42, 0.6)',
        },
      },
      backgroundImage: {
        'glass-gradient':
          'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'glass-shine':
          'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
        'neon-blue': 'linear-gradient(to right, #dc2626, #ef4444)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neon: '0 0 10px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.3)',
      },
    },
  },
  plugins: [],
};
