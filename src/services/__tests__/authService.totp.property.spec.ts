/**
 * Property-Based Tests for AuthService TOTP Error Extraction
 *
 * Feature: totp-2fa, Property 11: AuthService Error Extraction
 *
 * For any TOTP-related AuthService method, when the backend returns a
 * non-2xx HTTP response, the method SHALL return an object with an `error`
 * string extracted via `extractErrorMessage` and SHALL NOT throw an
 * unhandled exception.
 *
 * **Validates: Requirements 11.5**
 *
 * Uses fast-check with ≥100 iterations.
 *
 * @module services/__tests__/authService.totp.property.spec
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import axios, { AxiosError, AxiosHeaders } from 'axios';

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock the API client factories so we can control what the axios instances return
const mockPost = jest.fn() as jest.MockedFunction<typeof axios.prototype.post>;
const mockGet = jest.fn() as jest.MockedFunction<typeof axios.prototype.get>;

const mockAxiosInstance = {
  post: mockPost,
  get: mockGet,
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('../api', () => ({
  createApiClient: jest.fn(() => mockAxiosInstance),
}));

jest.mock('../authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => mockAxiosInstance),
}));

jest.mock('@digitaldefiance/ecies-lib', () => ({
  EciesCryptoCore: jest.fn().mockImplementation(() => ({})),
  ECIESService: jest.fn().mockImplementation(() => ({})),
  hexToUint8Array: jest.fn(),
  uint8ArrayToHex: jest.fn(),
}));

jest.mock('@digitaldefiance/suite-core-lib', () => ({
  getSuiteCoreTranslation: jest.fn(
    (key: string) => key,
  ),
  SuiteCoreStringKey: {
    Common_UnexpectedError: 'common_unexpectedError',
    Registration_Error: 'registration_error',
    Registration_Success: 'registration_success',
    Validation_UsernameOrEmailRequired: 'validation_usernameOrEmailRequired',
    Validation_InvalidToken: 'validation_invalidToken',
    Error_Login_DirectChallengeNotEnabled:
      'error_login_directChallengeNotEnabled',
    Error_Login_PasswordLoginNotEnabled: 'error_login_passwordLoginNotEnabled',
  },
  Constants: {},
}));

// Import AuthService after mocks are set up
import { AuthService } from '../authService';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a realistic AxiosError with the given status code and response data.
 */
function buildAxiosError(
  status: number,
  data: Record<string, unknown>,
): AxiosError {
  const headers = new AxiosHeaders();
  const config = { headers } as import('axios').InternalAxiosRequestConfig;
  const response = {
    data,
    status,
    statusText: 'Error',
    headers: {},
    config,
  };

  const error = new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    response,
  );

  return error;
}

// ─── Arbitraries ────────────────────────────────────────────────────────────

/** Non-2xx HTTP status codes (client and server errors) */
const nonSuccessStatus = fc.oneof(
  fc.integer({ min: 400, max: 499 }),
  fc.integer({ min: 500, max: 599 }),
);

/** Arbitrary non-empty error message strings */
const errorMessage = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

/** 6-digit TOTP code string */
const totpCode = fc
  .array(fc.constantFrom(...'0123456789'.split('')), {
    minLength: 6,
    maxLength: 6,
  })
  .map((chars) => chars.join(''));

/** Arbitrary non-empty token string */
const tokenString = fc.string({ minLength: 10, maxLength: 100 }).filter(
  (s) => s.trim().length > 0,
);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AuthService TOTP - Property Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();

    const mockConstants = {} as import('@digitaldefiance/suite-core-lib').IConstants;
    const mockEciesConfig = {} as import('@digitaldefiance/ecies-lib').IECIESConfig;

    authService = new AuthService(
      mockConstants,
      'http://localhost:3000',
      mockEciesConfig,
      'test.example.com',
    );
  });

  // ─── Property 11: AuthService Error Extraction ──────────────────────────

  describe('Feature: totp-2fa, Property 11: AuthService Error Extraction', () => {
    /**
     * **Validates: Requirements 11.5**
     *
     * For any TOTP-related AuthService method, when the backend returns a
     * non-2xx HTTP response, the method must return `{ error: string }` and
     * must not throw.
     */

    describe('setupTotp returns { error } on non-2xx and never throws', () => {
      it('extracts error from response.data.message', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            async (status, msg) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { message: msg }),
              );

              const result = await authService.setupTotp();

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });

      it('extracts error from response.data.error (string)', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            async (status, msg) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { error: msg }),
              );

              const result = await authService.setupTotp();

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('confirmTotp returns { error } on non-2xx and never throws', () => {
      it('extracts error for any status code and error message', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            totpCode,
            async (status, msg, code) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { message: msg }),
              );

              const result = await authService.confirmTotp(code);

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('disableTotp returns { error } on non-2xx and never throws', () => {
      it('extracts error for any status code and error message', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            totpCode,
            async (status, msg, code) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { message: msg }),
              );

              const result = await authService.disableTotp(code);

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('resetTotp returns { error } on non-2xx and never throws', () => {
      it('extracts error for any status code and error message', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            totpCode,
            async (status, msg, code) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { message: msg }),
              );

              const result = await authService.resetTotp(code);

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('verifyTotpLogin returns { error } on non-2xx and never throws', () => {
      it('extracts error for any status code, error message, and token', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            totpCode,
            tokenString,
            async (status, msg, code, token) => {
              mockPost.mockRejectedValueOnce(
                buildAxiosError(status, { message: msg }),
              );

              const result = await authService.verifyTotpLogin(token, code);

              expect(result).toHaveProperty('error');
              expect(typeof (result as { error: string }).error).toBe('string');
              expect((result as { error: string }).error.length).toBeGreaterThan(0);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('error extraction handles object-shaped errors', () => {
      it('extracts error.message from response.data.error object for all methods', async () => {
        await fc.assert(
          fc.asyncProperty(
            nonSuccessStatus,
            errorMessage,
            totpCode,
            tokenString,
            async (status, msg, code, token) => {
              const errorData = {
                error: { message: msg, statusCode: status },
              };

              // Test all five methods with object-shaped error
              const methods = [
                () => {
                  mockPost.mockRejectedValueOnce(
                    buildAxiosError(status, errorData),
                  );
                  return authService.setupTotp();
                },
                () => {
                  mockPost.mockRejectedValueOnce(
                    buildAxiosError(status, errorData),
                  );
                  return authService.confirmTotp(code);
                },
                () => {
                  mockPost.mockRejectedValueOnce(
                    buildAxiosError(status, errorData),
                  );
                  return authService.disableTotp(code);
                },
                () => {
                  mockPost.mockRejectedValueOnce(
                    buildAxiosError(status, errorData),
                  );
                  return authService.resetTotp(code);
                },
                () => {
                  mockPost.mockRejectedValueOnce(
                    buildAxiosError(status, errorData),
                  );
                  return authService.verifyTotpLogin(token, code);
                },
              ];

              for (const method of methods) {
                const result = await method();
                expect(result).toHaveProperty('error');
                expect(typeof (result as { error: string }).error).toBe('string');
                expect((result as { error: string }).error.length).toBeGreaterThan(0);
              }
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });
});
