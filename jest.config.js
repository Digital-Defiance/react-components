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
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
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
    // react-router v8+ (and its ESM deps @remix-run/cookie-es) ship ESM-only
    // with a dead `import.meta.hot` HMR guard that ts-jest cannot transpile to
    // CommonJS. A small custom transformer neutralizes `import.meta` and
    // downlevels the ESM for the allowlisted node_modules (the project itself
    // has no first-party .js/.jsx/.mjs files).
    '^.+\\.(jsx?|mjs)$': '<rootDir>/tests/esm-js-transformer.js',
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
    'node_modules/(?!(@noble|@scure|ethereum-cryptography|@ethereumjs|uuid|@digitaldefiance/express-suite-test-utils|paillier-bigint|bigint-crypto-utils|react-router|@remix-run|cookie-es)/)',
  ],
};
