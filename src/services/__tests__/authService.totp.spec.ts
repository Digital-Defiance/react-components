/**
 * Unit Tests for AuthService TOTP Methods
 *
 * Tests each TOTP method calls the correct endpoint, returns the correct
 * shape on success, and extracts errors on failure.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 *
 * @module services/__tests__/authService.totp.spec
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios, { AxiosError, AxiosHeaders } from 'axios';

// ─── Mocks ──────────────────────────────────────────────────────────────────

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
  getSuiteCoreTranslation: jest.fn((key: string) => key),
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

  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    response,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AuthService TOTP - Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();

    const mockConstants =
      {} as import('@digitaldefiance/suite-core-lib').IConstants;
    const mockEciesConfig =
      {} as import('@digitaldefiance/ecies-lib').IECIESConfig;

    authService = new AuthService(
      mockConstants,
      'http://localhost:3000',
      mockEciesConfig,
      'test.example.com',
    );
  });

  // ─── setupTotp ──────────────────────────────────────────────────────────
  // Validates: Requirement 11.1

  describe('setupTotp', () => {
    it('calls POST /user/totp/setup and returns { provisioningUri, secret } on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          provisioningUri: 'otpauth://totp/Issuer:user@example.com?secret=ABCDEF',
          secret: 'ABCDEF',
        },
        status: 200,
      });

      const result = await authService.setupTotp();

      expect(mockPost).toHaveBeenCalledWith('/user/totp/setup');
      expect(result).toEqual({
        provisioningUri: 'otpauth://totp/Issuer:user@example.com?secret=ABCDEF',
        secret: 'ABCDEF',
      });
    });

    it('returns { error } when the backend returns a non-2xx response with message', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(409, { message: 'TOTP is already active' }),
      );

      const result = await authService.setupTotp();

      expect(result).toEqual({ error: 'TOTP is already active' });
    });

    it('returns { error } when the backend returns a non-2xx response with error string', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(500, { error: 'Internal server error' }),
      );

      const result = await authService.setupTotp();

      expect(result).toEqual({ error: 'Internal server error' });
    });

    it('returns fallback error when a non-Axios error is thrown', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));

      const result = await authService.setupTotp();

      expect(result).toHaveProperty('error');
      expect(typeof (result as { error: string }).error).toBe('string');
      expect((result as { error: string }).error.length).toBeGreaterThan(0);
    });
  });

  // ─── confirmTotp ────────────────────────────────────────────────────────
  // Validates: Requirement 11.2

  describe('confirmTotp', () => {
    it('calls POST /user/totp/confirm with { code } and returns { success: true } on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'TOTP confirmed' },
        status: 200,
      });

      const result = await authService.confirmTotp('123456');

      expect(mockPost).toHaveBeenCalledWith('/user/totp/confirm', {
        code: '123456',
      });
      expect(result).toEqual({ success: true });
    });

    it('returns { error } when the backend returns a non-2xx response', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, { message: 'Invalid TOTP code' }),
      );

      const result = await authService.confirmTotp('000000');

      expect(result).toEqual({ error: 'Invalid TOTP code' });
    });

    it('returns { error } when no pending secret exists', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, {
          message: 'TOTP setup has not been initiated',
        }),
      );

      const result = await authService.confirmTotp('123456');

      expect(result).toEqual({
        error: 'TOTP setup has not been initiated',
      });
    });

    it('returns fallback error when a non-Axios error is thrown', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));

      const result = await authService.confirmTotp('123456');

      expect(result).toHaveProperty('error');
      expect(typeof (result as { error: string }).error).toBe('string');
    });
  });

  // ─── disableTotp ────────────────────────────────────────────────────────
  // Validates: Requirement 11.3

  describe('disableTotp', () => {
    it('calls POST /user/totp/disable with { code } and returns { success: true } on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { message: 'TOTP disabled' },
        status: 200,
      });

      const result = await authService.disableTotp('654321');

      expect(mockPost).toHaveBeenCalledWith('/user/totp/disable', {
        code: '654321',
      });
      expect(result).toEqual({ success: true });
    });

    it('returns { error } when the backend returns a non-2xx response', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, { message: 'Invalid TOTP code' }),
      );

      const result = await authService.disableTotp('000000');

      expect(result).toEqual({ error: 'Invalid TOTP code' });
    });

    it('returns { error } when TOTP is not currently active', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(409, {
          message: 'TOTP is not currently active',
        }),
      );

      const result = await authService.disableTotp('123456');

      expect(result).toEqual({
        error: 'TOTP is not currently active',
      });
    });

    it('returns fallback error when a non-Axios error is thrown', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));

      const result = await authService.disableTotp('123456');

      expect(result).toHaveProperty('error');
      expect(typeof (result as { error: string }).error).toBe('string');
    });
  });

  // ─── resetTotp ──────────────────────────────────────────────────────────
  // Validates: Requirement 15.7 (resetTotp method)

  describe('resetTotp', () => {
    it('calls POST /user/totp/reset with { code } and returns { provisioningUri, secret } on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          provisioningUri: 'otpauth://totp/Issuer:user@example.com?secret=NEWKEY',
          secret: 'NEWKEY',
        },
        status: 200,
      });

      const result = await authService.resetTotp('123456');

      expect(mockPost).toHaveBeenCalledWith('/user/totp/reset', {
        code: '123456',
      });
      expect(result).toEqual({
        provisioningUri: 'otpauth://totp/Issuer:user@example.com?secret=NEWKEY',
        secret: 'NEWKEY',
      });
    });

    it('returns { error } when the backend returns a non-2xx response', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, { message: 'Invalid TOTP code' }),
      );

      const result = await authService.resetTotp('000000');

      expect(result).toEqual({ error: 'Invalid TOTP code' });
    });

    it('returns { error } when TOTP is not currently active', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(409, {
          message: 'TOTP is not currently active',
        }),
      );

      const result = await authService.resetTotp('123456');

      expect(result).toEqual({
        error: 'TOTP is not currently active',
      });
    });

    it('returns fallback error when a non-Axios error is thrown', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));

      const result = await authService.resetTotp('123456');

      expect(result).toHaveProperty('error');
      expect(typeof (result as { error: string }).error).toBe('string');
    });
  });

  // ─── verifyTotpLogin ───────────────────────────────────────────────────
  // Validates: Requirement 11.4

  describe('verifyTotpLogin', () => {
    it('calls POST /user/totp/verify with { code } and Authorization header, returns { token, user } on success', async () => {
      const mockUser = { id: 'user-123', username: 'testuser' };
      mockPost.mockResolvedValueOnce({
        data: {
          token: 'full-jwt-token',
          user: mockUser,
        },
        status: 200,
      });

      const result = await authService.verifyTotpLogin(
        'pending-totp-token',
        '123456',
      );

      expect(mockPost).toHaveBeenCalledWith(
        '/user/totp/verify',
        { code: '123456' },
        { headers: { Authorization: 'Bearer pending-totp-token' } },
      );
      expect(result).toEqual({
        token: 'full-jwt-token',
        user: mockUser,
      });
    });

    it('returns { error } when the backend returns a non-2xx response', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, { message: 'Invalid TOTP code' }),
      );

      const result = await authService.verifyTotpLogin(
        'pending-totp-token',
        '000000',
      );

      expect(result).toEqual({ error: 'Invalid TOTP code' });
    });

    it('returns { error } when the pending token is expired', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(401, { message: 'Token expired' }),
      );

      const result = await authService.verifyTotpLogin(
        'expired-token',
        '123456',
      );

      expect(result).toEqual({ error: 'Token expired' });
    });

    it('returns { error } when the pending token is invalid', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(401, { message: 'Invalid token' }),
      );

      const result = await authService.verifyTotpLogin(
        'invalid-token',
        '123456',
      );

      expect(result).toEqual({ error: 'Invalid token' });
    });

    it('returns fallback error when a non-Axios error is thrown', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));

      const result = await authService.verifyTotpLogin(
        'pending-totp-token',
        '123456',
      );

      expect(result).toHaveProperty('error');
      expect(typeof (result as { error: string }).error).toBe('string');
    });
  });

  // ─── Error extraction edge cases ─────────────────────────────────────
  // Validates: Requirement 11.5

  describe('error extraction edge cases', () => {
    it('extracts error from response.data.error when it is an object with message', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(500, {
          error: { message: 'Decryption failed', statusCode: 500 },
        }),
      );

      const result = await authService.setupTotp();

      expect(result).toEqual({ error: 'Decryption failed' });
    });

    it('prefers error string over message when both are present', async () => {
      mockPost.mockRejectedValueOnce(
        buildAxiosError(400, {
          error: 'Specific error',
          message: 'General message',
        }),
      );

      const result = await authService.confirmTotp('123456');

      // extractErrorMessage checks error (string) first, then error.message, then message
      expect(result).toEqual({ error: 'Specific error' });
    });
  });
});
