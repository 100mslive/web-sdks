// Setup for Jest tests

// Mock Performance API properly for Jest 29
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(() => ({ duration: 0 } as PerformanceMeasure)),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now()),
} as any;

export {};
