module.exports = {
  displayName: 'digitaldefiance-express-suite-react-components',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',
    runScripts: 'dangerously',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/packages/digitaldefiance-express-suite-react-components',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@digitaldefiance/ecies-lib$': '<rootDir>/../digitaldefiance-ecies-lib/src/index.ts',
    '^@digitaldefiance/i18n-lib$': '<rootDir>/../digitaldefiance-i18n-lib/src/index.ts',
    '^@digitaldefiance/suite-core-lib$': '<rootDir>/../digitaldefiance-suite-core-lib/src/index.ts',
    '^bson$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^@scure/bip32$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^@noble/curves/(.*)$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^@noble/hashes/(.*)$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^ethereum-cryptography/(.*)$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^@ethereumjs/util$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
    '^@ethereumjs/wallet$': '<rootDir>/../digitaldefiance-express-suite-test-utils/src/lib/bson-mock.ts',
  },
};
