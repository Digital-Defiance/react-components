import { TextDecoder, TextEncoder } from 'util';

// Set polyfills BEFORE any other imports that might use them
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Import React first to ensure it's properly initialized
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ReactDOM from 'react-dom/client';

import { I18nEngine, createDefaultLanguages } from '@digitaldefiance/i18n-lib';
import {
  Constants,
  createSuiteCoreComponentConfig,
} from '@digitaldefiance/suite-core-lib';
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ reactStrictMode: true });

beforeAll(() => {
  const languages = createDefaultLanguages();
  const engine = I18nEngine.registerIfNotExists('default', languages, {
    constants: Constants,
  });
  const coreConfig = createSuiteCoreComponentConfig();
  engine.registerIfNotExists(coreConfig);
});

afterAll(() => {
  I18nEngine.resetAll();
});

// Mock localStorage
export const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window object with all necessary properties
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Ensure window has localStorage for React Testing Library
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(window, 'APP_CONFIG', {
    value: undefined,
    writable: true,
  });
}
