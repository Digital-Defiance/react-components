import { jest } from '@jest/globals';

export const mockAuthService = {
  verifyToken: jest.fn(),
  directLogin: jest.fn(),
  emailChallengeLogin: jest.fn(),
  refreshToken: jest.fn(),
  register: jest.fn(),
  requestEmailLogin: jest.fn(),
  backupCodeLogin: jest.fn(),
  changePassword: jest.fn(),
};

export const createAuthService = jest.fn(() => mockAuthService);
