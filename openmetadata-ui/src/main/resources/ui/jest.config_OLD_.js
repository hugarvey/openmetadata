/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

module.exports = {
  // Project name
  displayName: '@openmetadata',

  // Working directory
  roots: ['<rootDir>/src'],

  // Test files
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx,js,jsx}'], // All test files in subdirectories under /src

  // Test coverage
  coverageDirectory: '<rootDir>/src/test/unit/coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx,js,jsx}', // All files in subdirectories under src/app
    '!<rootDir>/src/*', // Exclude files directly under src/app
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/@types/*',
    '<rootDir>/src/interface/*',
    '<rootDir>/src/generated/*',
    '<rootDir>/src/enums/*',
  ],

  // Transforms
  transform: {
    '^.+\\.ts|tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  setupFilesAfterEnv: ['./src/setupTests.ts'],
  clearMocks: true,
  moduleNameMapper: {
    '\\.svg': '<rootDir>/src/test/unit/mocks/svg.mock.js', // Mock SVG imports
    '\\.(scss)$': 'identity-obj-proxy', // Mock style imports
    '\\.(jpg|JPG|gif|GIF|png|PNG|less|LESS|css|CSS)$':
      '<rootDir>/src/test/unit/mocks/file.mock.js',
    '\\.json': '<rootDir>/src/test/unit/mocks/json.mock.js',
    '@github/g-emoji-element': '<rootDir>/src/test/unit/mocks/gemoji.mock.js',
    'quilljs-markdown': '<rootDir>/src/test/unit/mocks/gemoji.mock.js',
    '@azure/msal-browser':
      '<rootDir>/node_modules/@azure/msal-browser/lib/msal-browser.cjs',
    '@azure/msal-react':
      '<rootDir>/node_modules/@azure/msal-react/dist/index.js',
  },
  transformIgnorePatterns: ['node_modules/(?!@azure/msal-react)'],

  // TypeScript
  preset: 'ts-jest',

  // Test Environment
  testEnvironment: 'jsdom',

  // Sonar Cloud Configuration
  testResultsProcessor: 'jest-sonar-reporter',

  // use fake timers
  fakeTimers: {
    doNotFake: ['nextTick'],
    timerLimit: 1000,
  },

  moduleDirectories: ['node_modules', 'src'],
};
