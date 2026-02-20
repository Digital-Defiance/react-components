import { AxiosError, AxiosHeaders } from 'axios';
import {
  AuthService,
  extractErrorMessage,
} from '../../src/services/authService';
import {
  Constants,
  SuiteCoreStringKey,
  getSuiteCoreTranslation,
} from '@digitaldefiance/suite-core-lib';
import { IECIESConfig } from '@digitaldefiance/ecies-lib';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock the API client factories so we control what axios instance the service uses
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockAxiosInstance = {
  post: mockPost,
  get: mockGet,
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock('../../src/services/api', () => ({
  createApiClient: jest.fn(() => mockAxiosInstance),
}));

jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => mockAxiosInstance),
}));

// Mock the crypto layer — we don't need real crypto for error-handling tests
const mockSignMessage = jest.fn().mockReturnValue(new Uint8Array(64));
jest.mock('@digitaldefiance/ecies-lib', () => {
  const actual = jest.requireActual('@digitaldefiance/ecies-lib');
  return {
    ...actual,
    ECIESService: jest.fn().mockImplementation(() => ({
      signMessage: mockSignMessage,
    })),
    EciesCryptoCore: jest.fn().mockImplementation(() => ({
      walletAndSeedFromMnemonic: jest.fn().mockReturnValue({
        wallet: {
          getPrivateKey: jest.fn().mockReturnValue(new Uint8Array(32)),
          getAddressString: jest.fn().mockReturnValue('0xabc'),
        },
        seed: new Uint8Array(64),
      }),
    })),
    hexToUint8Array: jest.fn().mockReturnValue(new Uint8Array(32)),
    uint8ArrayToHex: jest.fn().mockReturnValue('aabbccdd'),
  };
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const eciesConfig: IECIESConfig = {
  curveName: 'secp256k1',
  primaryKeyDerivationPath: "m/44'/60'/0'/0/0",
  mnemonicStrength: 128,
  symmetricAlgorithm: 'aes',
  symmetricKeyBits: 256,
  symmetricKeyMode: 'gcm',
};

function createService(): AuthService {
  return new AuthService(Constants, 'http://localhost:3000/api', eciesConfig);
}

/**
 * Build an AxiosError that mirrors what axios actually throws.
 */
function makeAxiosError(
  status: number,
  data: Record<string, unknown>
): AxiosError {
  const headers = new AxiosHeaders();
  const config = { headers: new AxiosHeaders() };
  const error = new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    status,
    statusText: 'Error',
    headers,
    config,
    data,
  });
  return error;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('extractErrorMessage', () => {
  it('returns the string when error is a plain string', () => {
    expect(extractErrorMessage({ error: 'Something went wrong' })).toBe(
      'Something went wrong'
    );
  });

  it('returns error.message when error is an object with message', () => {
    expect(
      extractErrorMessage({
        error: { message: 'Detailed failure', statusCode: 401 },
      })
    ).toBe('Detailed failure');
  });

  it('returns error.message when error object also has stack', () => {
    expect(
      extractErrorMessage({
        error: {
          message: 'Server error',
          statusCode: 500,
          stack: 'Error: Server error\n    at ...',
        },
      })
    ).toBe('Server error');
  });

  it('falls back to top-level message when error is an object without message', () => {
    expect(
      extractErrorMessage({
        error: { statusCode: 500 },
        message: 'Fallback message',
      })
    ).toBe('Fallback message');
  });

  it('falls back to top-level message when error is undefined', () => {
    expect(extractErrorMessage({ message: 'Top-level message' })).toBe(
      'Top-level message'
    );
  });

  it('returns undefined when neither error nor message is present', () => {
    expect(extractErrorMessage({})).toBeUndefined();
  });

  it('returns undefined when error is null-ish object and no message', () => {
    expect(extractErrorMessage({ error: undefined })).toBeUndefined();
  });

  it('does NOT return [object Object] for an error object', () => {
    const result = extractErrorMessage({
      error: { message: 'real message', statusCode: 400 },
    });
    expect(result).not.toBe('[object Object]');
    expect(result).toBe('real message');
  });
});

describe('AuthService error handling', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createService();
  });

  // ── The core scenario: backend sends error as an object ──────────────

  describe('when backend sends error as { message, statusCode, stack }', () => {
    const objectErrorData = {
      error: { message: 'Invalid credentials', statusCode: 401, stack: 'Error: ...' },
      errorType: 'AuthenticationError',
    };

    it('register: extracts message string, not [object Object]', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));
      const result = await service.register('user', 'user@test.com', 'UTC');
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });

    it('directLogin: extracts message string, not [object Object]', async () => {
      // First call: request-direct-login returns a challenge
      mockPost.mockResolvedValueOnce({
        data: { challenge: 'aabbccdd' },
        status: 200,
      });
      // Second call: direct-challenge fails
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));

      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });

    it('requestEmailLogin: extracts message string, not [object Object]', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));
      const result = await service.requestEmailLogin('testuser');
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });

    it('emailChallengeLogin: extracts message string, not [object Object]', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));
      const result = await service.emailChallengeLogin(
        'test mnemonic phrase words here' as never,
        'aabbccdd',
        'testuser'
      );
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });

    it('changePassword: extracts message string, not [object Object]', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));
      const result = await service.changePassword('old', 'new');
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });

    it('backupCodeLogin: extracts message string, not [object Object]', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(401, objectErrorData));
      const result = await service.backupCodeLogin(
        'testuser',
        'ABCD-1234',
        false,
        false
      );
      expect(result).toHaveProperty('error', 'Invalid credentials');
    });
  });

  // ── Backend sends error as a plain string (should still work) ────────

  describe('when backend sends error as a plain string', () => {
    const stringErrorData = {
      error: 'Plain string error',
      errorType: 'ValidationError',
    };

    it('register: returns the string directly', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(400, stringErrorData));
      const result = await service.register('user', 'user@test.com', 'UTC');
      expect(result).toHaveProperty('error', 'Plain string error');
    });

    it('directLogin: returns the string directly', async () => {
      mockPost.mockResolvedValueOnce({
        data: { challenge: 'aabbccdd' },
        status: 200,
      });
      mockPost.mockRejectedValueOnce(makeAxiosError(400, stringErrorData));
      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty('error', 'Plain string error');
    });

    it('changePassword: returns the string directly', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(400, stringErrorData));
      const result = await service.changePassword('old', 'new');
      expect(result).toHaveProperty('error', 'Plain string error');
    });

    it('backupCodeLogin: returns the string directly', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(400, stringErrorData));
      const result = await service.backupCodeLogin(
        'testuser',
        'ABCD-1234',
        false,
        false
      );
      expect(result).toHaveProperty('error', 'Plain string error');
    });
  });

  // ── Fallback to message when error field is absent ───────────────────

  describe('when backend sends only message (no error field)', () => {
    const messageOnlyData = {
      message: 'Fallback message from server',
    };

    it('register: falls back to message', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500, messageOnlyData));
      const result = await service.register('user', 'user@test.com', 'UTC');
      expect(result).toHaveProperty('error', 'Fallback message from server');
    });

    it('directLogin: falls back to message', async () => {
      mockPost.mockResolvedValueOnce({
        data: { challenge: 'aabbccdd' },
        status: 200,
      });
      mockPost.mockRejectedValueOnce(makeAxiosError(500, messageOnlyData));
      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty('error', 'Fallback message from server');
    });

    it('emailChallengeLogin: falls back to message', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500, messageOnlyData));
      const result = await service.emailChallengeLogin(
        'test mnemonic phrase words here' as never,
        'aabbccdd',
        'testuser'
      );
      expect(result).toHaveProperty('error', 'Fallback message from server');
    });

    it('changePassword: falls back to message', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500, messageOnlyData));
      const result = await service.changePassword('old', 'new');
      expect(result).toHaveProperty('error', 'Fallback message from server');
    });

    it('backupCodeLogin: falls back to message', async () => {
      mockPost.mockRejectedValueOnce(makeAxiosError(500, messageOnlyData));
      const result = await service.backupCodeLogin(
        'testuser',
        'ABCD-1234',
        false,
        false
      );
      expect(result).toHaveProperty('error', 'Fallback message from server');
    });
  });

  // ── Non-axios errors fall back to generic message ────────────────────

  describe('when a non-axios error is thrown', () => {
    it('register: returns generic unexpected error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));
      const result = await service.register('user', 'user@test.com', 'UTC');
      expect(result).toHaveProperty(
        'error',
        getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError)
      );
    });

    it('directLogin: returns generic unexpected error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));
      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty(
        'error',
        getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError)
      );
    });

    it('changePassword: returns generic unexpected error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network failure'));
      const result = await service.changePassword('old', 'new');
      expect(result).toHaveProperty(
        'error',
        getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError)
      );
    });
  });

  // ── directLogin-specific error types ─────────────────────────────────

  describe('directLogin specific error types', () => {
    it('returns DirectChallengeNotEnabled for 403 with that errorType', async () => {
      mockPost.mockResolvedValueOnce({
        data: { challenge: 'aabbccdd' },
        status: 200,
      });
      mockPost.mockRejectedValueOnce(
        makeAxiosError(403, {
          errorType: 'DirectChallengeNotEnabledError',
          message: 'Direct challenge not enabled',
        })
      );
      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty('errorType', 'DirectChallengeNotEnabled');
    });

    it('returns PasswordLoginNotEnabled for 403 with that errorType', async () => {
      mockPost.mockResolvedValueOnce({
        data: { challenge: 'aabbccdd' },
        status: 200,
      });
      mockPost.mockRejectedValueOnce(
        makeAxiosError(403, {
          errorType: 'PasswordLoginNotEnabledError',
          message: 'Password login not enabled',
        })
      );
      const result = await service.directLogin(
        'test mnemonic phrase words here' as never,
        'testuser'
      );
      expect(result).toHaveProperty('errorType', 'PasswordLoginNotEnabled');
    });
  });

  // ── errorType propagation ────────────────────────────────────────────

  describe('errorType propagation', () => {
    it('register: propagates errorType from response', async () => {
      mockPost.mockRejectedValueOnce(
        makeAxiosError(400, {
          error: 'Bad request',
          errorType: 'DuplicateEmailError',
        })
      );
      const result = await service.register('user', 'user@test.com', 'UTC');
      expect(result).toHaveProperty('errorType', 'DuplicateEmailError');
    });

    it('backupCodeLogin: propagates errorType and status', async () => {
      mockPost.mockRejectedValueOnce(
        makeAxiosError(404, {
          error: 'User not found',
          errorType: 'UserNotFoundError',
        })
      );
      const result = await service.backupCodeLogin(
        'testuser',
        'ABCD-1234',
        false,
        false
      );
      expect(result).toHaveProperty('errorType', 'UserNotFoundError');
      expect(result).toHaveProperty('status', 404);
    });
  });
});
