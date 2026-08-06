/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070A12',
          900: '#0B0F19',
          800: '#111827',
          700: '#141B2D',
          600: '#1B2438',
          500: '#26314A',
        },
        signal: {
          DEFAULT: '#5EEAD4',
          dim: '#2DD4BF',
        },
        pulse: {
          DEFAULT: '#FB923C',
          dim: '#EA580C',
        },
        vector: {
          DEFAULT: '#C084FC',
          dim: '#A855F7',
        },
        mist: {
          100: '#E7ECF6',
          300: '#AAB4CC',
          500: '#7C8AA8',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(94,234,212,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(94,234,212,0.35)',
        'glow-pulse': '0 0 24px rgba(251,146,60,0.4)',
        'glow-vector': '0 0 24px rgba(192,132,252,0.35)',
      },
      keyframes: {
        flowdash: {
          to: { strokeDashoffset: -40 },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        flowdash: 'flowdash 1.2s linear infinite',
        pop: 'pop 0.25s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
