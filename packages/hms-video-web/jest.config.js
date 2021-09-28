module.exports = {
  transform: {
    '.(ts|tsx)$': './node_modules/tsdx/node_modules/ts-jest/dist/index.js',
    '.(js|jsx)$': './node_modules/babel-jest/build/index.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}'],
  testMatch: ['<rootDir>/**/*.(spec|test).{ts,tsx,js,jsx}'],
};
