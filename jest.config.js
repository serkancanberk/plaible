export default {
  // ESM support - no transform needed for pure ESM
  transform: {},
  
  // Test environment
  testEnvironment: 'node',
  
  // File patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Module resolution
  extensionsToTreatAsEsm: [],
  moduleFileExtensions: ['js', 'mjs'],
  
  // Coverage (optional)
  collectCoverageFrom: [
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Timeout for tests
  testTimeout: 5000,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true
};
