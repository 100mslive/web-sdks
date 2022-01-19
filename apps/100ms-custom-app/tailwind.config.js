module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    maxHeight: {
      '50vh': '50vh',
    },
    minHeight: {
      '50vh': '50vh',
      '720px': '720px'
    },
    extend: {
      colors: {
        gray: {
          3: '#5E5E5E',
          cool1: '#1D232B',
          cool2: '#303740',
          cool3: '#657080',
          cool4: '#3B3B3B',
          cool5: '#B0C3DB',
          cool6: '#1E232C',
          cool7: '#282D37'
        },
        blue: {
          standard: '#2F80FF',
          tint: '#74AAFF'
        },
        red: {
          standard: '#ED4C5A'
        },
        green: {
          3: '#6FCF97'
        },
        transparent: {
          backdrop: 'rgba(0, 0, 0, 0.5)'
        }
      },
      zIndex: {
        '9999': '9999',
        '-10': '-10'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
