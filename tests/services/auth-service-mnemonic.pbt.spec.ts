/**
 * Property-based tests for mnemonic inclusion in POST request body.
 *
 * Feature: user-provided-mnemonic, Property 9: Mnemonic included in POST request body
 *
 * AuthService.register makes a POST request to `/user/register`. When a non-empty
 * mnemonic string is passed, the POST body must contain a `mnemonic` field equal to
 * that string. When no mnemonic is provided, the POST body must not contain a
 * `mnemonic` field.
 *
 * **Validates: Requirements 6.2**
 */

import * as fc from 'fast-check';
import { AuthService } from '../../src/services/authService';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { IECIESConfig } from '@digitaldefiance/ecies-lib';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPost = jest.fn();
const mockAxiosInstance = {
  post: mockPost,
  get: jest.fn(),
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

jest.mock('@digitaldefiance/ecies-lib', () => {
  const actual = jest.requireActual('@digitaldefiance/ecies-lib');
  return {
    ...actual,
    ECIESService: jest.fn().mockImplementation(() => ({
      signMessage: jest.fn().mockReturnValue(new Uint8Array(64)),
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
  return new AuthService(Constants, 'http://localhost:3000/api', eciesConfig, 'localhost');
}

/**
 * Returns a successful 201 register response to keep the service happy.
 */
function mockSuccessResponse() {
  return {
    status: 201,
    data: {
      message: 'Registration successful',
      mnemonic: 'server generated mnemonic phrase here',
    },
  };
}

/**
 * Arbitrary that generates a non-empty string suitable as a mnemonic value.
 * Uses printable ASCII characters excluding control chars.
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: user-provided-mnemonic, Property 9: Mnemonic included in POST request body', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createService();
  });

  /**
   * Property 9a: When a non-empty mnemonic is passed to AuthService.register,
   * the POST body contains a `mnemonic` field equal to that string.
   *
   * **Validates: Requirements 6.2**
   */
  it('should include mnemonic in POST body when a non-empty mnemonic is provided', async () => {
    await fc.assert(
      fc.asyncProperty(nonEmptyStringArb, async (mnemonic) => {
        mockPost.mockClear();
        mockPost.mockResolvedValueOnce(mockSuccessResponse());

        await service.register('testuser', 'test@example.com', 'UTC', 'Password1!', mnemonic);

        expect(mockPost).toHaveBeenCalledTimes(1);
        const [url, body] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
        expect(url).toBe('/user/register');
        expect(body).toHaveProperty('mnemonic', mnemonic);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9b: When no mnemonic is provided (undefined), the POST body
   * does not contain a `mnemonic` field.
   *
   * **Validates: Requirements 6.2**
   */
  it('should not include mnemonic in POST body when mnemonic is omitted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
          email: fc.string({ minLength: 5, maxLength: 50 }).filter((s) => s.trim().length > 0),
          timezone: fc.constantFrom('UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'),
        }),
        async ({ username, email, timezone }) => {
          mockPost.mockClear();
          mockPost.mockResolvedValueOnce(mockSuccessResponse());

          await service.register(username, email, timezone);

          expect(mockPost).toHaveBeenCalledTimes(1);
          const [url, body] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
          expect(url).toBe('/user/register');
          expect(body).not.toHaveProperty('mnemonic');
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9c: When mnemonic is provided alongside a password, both fields
   * appear in the POST body with their correct values.
   *
   * **Validates: Requirements 6.2**
   */
  it('should include both password and mnemonic in POST body when both are provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringArb,
        fc.string({ minLength: 8, maxLength: 50 }).filter((s) => s.trim().length >= 8),
        async (mnemonic, password) => {
          mockPost.mockClear();
          mockPost.mockResolvedValueOnce(mockSuccessResponse());

          await service.register('testuser', 'test@example.com', 'UTC', password, mnemonic);

          expect(mockPost).toHaveBeenCalledTimes(1);
          const [, body] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
          expect(body).toHaveProperty('mnemonic', mnemonic);
          expect(body).toHaveProperty('password', password);
        },
      ),
      { numRuns: 100 },
    );
  });
});
