module.exports = {
  displayName: 'digitaldefiance-express-suite-react-components',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',
    runScripts: 'dangerously',
    // Enable React 19 support in jsdom
    customExportConditions: [''],
  },
  maxWorkers: 4,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory:
    '../../coverage/packages/digitaldefiance-express-suite-react-components',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
    '^.+\\.jsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@digitaldefiance/ecies-lib$':
      '<rootDir>/../digitaldefiance-ecies-lib/src/index.ts',
    '^@digitaldefiance/i18n-lib$':
      '<rootDir>/../digitaldefiance-i18n-lib/src/index.ts',
    '^@digitaldefiance/suite-core-lib$':
      '<rootDir>/../digitaldefiance-suite-core-lib/src/index.ts',
    '^bson$':
      '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^mongoose$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    // Ensure single instance of React
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble|@scure|ethereum-cryptography|@ethereumjs|uuid|@digitaldefiance/express-suite-test-utils|paillier-bigint|bigint-crypto-utils)/)',
  ],
};
