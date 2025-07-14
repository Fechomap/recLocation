module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.git/',
    '/dist/',
    'index.js.backup'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'index.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true
};
