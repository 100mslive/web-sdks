const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}'],
  testMatch: ['<rootDir>/src/**/*.(test).{ts,tsx,js,jsx}'],
  setupFiles: ['jest-canvas-mock', 'jsdom-worker', '<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
};

module.exports = config;
