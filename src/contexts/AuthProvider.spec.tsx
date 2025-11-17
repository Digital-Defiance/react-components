import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React, { ReactNode } from 'react';

// Mock PasswordLoginService
const mockPasswordLoginService = {
  getWalletAndMnemonicFromLocalStorageBundle: jest.fn(),
  setupPasswordLoginLocalStorageBundle: jest.fn(),
};

const mockNavigate = jest.fn();

// Create shared mock instance
const mockAuthService = {
  verifyToken: jest.fn(),
  directLogin: jest.fn(),
  emailChallengeLogin: jest.fn(),
  refreshToken: jest.fn(),
  register: jest.fn(),
  requestEmailLogin: jest.fn(),
  backupCodeLogin: jest.fn(),
  changePassword: jest.fn(),
};

// Mock dependencies - must be before imports
jest.mock('../services/authService', () => ({
  mockAuthService,
  createAuthService: jest.fn(() => mockAuthService),
}));
jest.mock('../services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
}));



jest.mock('@digitaldefiance/i18n-lib', () => {
  const actual = jest.requireActual('@digitaldefiance/i18n-lib');
  const mockI18nEngineInstance = {
    t: jest.fn((key: string) => key),
    translate: jest.fn((componentId: string, key: string) => key),
    setLanguage: jest.fn(),
  };
  return {
    ...actual,
    DefaultCurrencyCode: 'USD',
    CurrencyCode: class MockCurrencyCode {
      constructor(public value: string = 'USD') {}
    },
    I18nEngine: {
      getInstance: () => mockI18nEngineInstance,
    },
    ECIESService: jest.fn(),
    t: jest.fn((key) => key),
  };
});

jest.mock('@digitaldefiance/ecies-lib', () => {
  const actual = jest.requireActual('@digitaldefiance/ecies-lib');
  return {
    ...actual,
    PasswordLoginService: jest.fn().mockImplementation(() => mockPasswordLoginService),
  };
});

jest.mock('./I18nProvider', () => {
  const React = require('react');
  const I18nProvider = ({ children }: { children: any }) => {
    return React.createElement(React.Fragment, null, children);
  };
  I18nProvider.displayName = 'MockI18nProvider';
  
  return {
    I18nProvider,
    useI18n: () => ({
      t: (key: string) => key,
      tComponent: (componentId: string, key: string) => key,
      changeLanguage: jest.fn(),
      currentLanguage: 'en-US',
    }),
  };
});

jest.mock('@ethereumjs/wallet', () => ({
  Wallet: {
    generate: jest.fn(() => ({
      getPrivateKey: jest.fn(() => Buffer.from('test')),
      getPublicKey: jest.fn(() => Buffer.from('test')),
      getAddress: jest.fn(() => Buffer.from('test')),
    })),
  },
}));

// Now import after mocks
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createAuthenticatedApiClient } from '../services/authenticatedApi';
import { Wallet } from '@ethereumjs/wallet';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { localStorageMock } from '../../tests/setup';
import { SecureString, ECIES as ECIESConstants } from '@digitaldefiance/ecies-lib';
import { CurrencyCode } from '@digitaldefiance/i18n-lib';
import { AuthProvider, useAuth } from './AuthProvider';
import { I18nProvider } from './I18nProvider';

// Mock localStorage is imported from test-setup



// Mock console methods
const consoleMock = {
  error: jest.fn(),
  log: jest.fn(),
};
Object.defineProperty(console, 'error', { value: consoleMock.error });

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider i18nEngine={null as any} onLanguageChange={async () => {}}>
    <AuthProvider 
      baseUrl="http://localhost:3000" 
      constants={Constants} 
      eciesConfig={ECIESConstants}
      onLogout={mockNavigate}
    >
      {children}
    </AuthProvider>
  </I18nProvider>
);

// Helper to create mock user
const createMockUser = (admin = false) => ({
  id: '1',
  username: admin ? 'admin' : 'testuser',
  email: admin ? 'admin@example.com' : 'test@example.com',
  roles: [{
    id: 'role1',
    _id: 'role1',
    name: admin ? 'admin' : 'user',
    member: true,
    child: false,
    system: false,
    admin,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    deletedAt: undefined,
    createdBy: 'system',
    updatedBy: 'system',
  }],
  siteLanguage: 'en-US',
  timezone: 'UTC',
  emailVerified: true,
});

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    mockPasswordLoginService.getWalletAndMnemonicFromLocalStorageBundle.mockClear();
    mockPasswordLoginService.setupPasswordLoginLocalStorageBundle.mockClear();
    mockAuthService.verifyToken.mockClear();
    mockAuthService.directLogin.mockClear();
    mockAuthService.emailChallengeLogin.mockClear();
    mockAuthService.refreshToken.mockClear();
    mockAuthService.register.mockClear();
    mockAuthService.requestEmailLogin.mockClear();
    mockAuthService.backupCodeLogin.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.userData).toBe(null);
        expect(result.current.token).toBe(null);
        expect(result.current.mnemonic).toBeUndefined();
        expect(result.current.wallet).toBeUndefined();
        expect(result.current.admin).toBe(false);
      });
    });

    it('should initialize currency code from localStorage', async () => {
      localStorageMock.getItem.mockImplementation((key) => 
        key === 'currencyCode' ? 'EUR' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.currencyCode.value).toBe('EUR');
      });
    });

    it('should initialize expiration seconds from localStorage', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'mnemonicExpirationSeconds') return '300';
        if (key === 'walletExpirationSeconds') return '600';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('mnemonicExpirationSeconds');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('walletExpirationSeconds');
      });
    });

    it('should use default expiration seconds when not in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('mnemonicExpirationSeconds');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('walletExpirationSeconds');
      });
    });
  });

  describe('checkAuth', () => {
    it('should clear auth state when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isCheckingAuth).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should verify token and set user when token exists', async () => {
      const mockUser = createMockUser();
      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      localStorageMock.getItem.mockImplementation((key) => 
        key === 'authToken' ? 'valid-token' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isCheckingAuth).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
      }, { timeout: 5000 });
      
      expect(result.current.userData).toEqual(mockUser);
      expect(result.current.token).toBe('valid-token');
    });

    it('should handle token verification failure', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      mockAuthService.verifyToken.mockRejectedValue(new Error('Token invalid'));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.userData).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.isCheckingAuth).toBe(false);
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      });
    });

    it('should set admin flag for admin users', async () => {
      const mockAdminUser = createMockUser(true);
      mockAuthService.verifyToken.mockResolvedValue(mockAdminUser);

      localStorageMock.getItem.mockImplementation((key) => 
        key === 'authToken' ? 'admin-token' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.admin).toBe(true);
      }, { timeout: 5000 });
    });
  });

  describe('directLogin', () => {
    it('should perform successful direct login', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'new-token',
        user: mockUser,
        wallet: mockWallet,
        message: 'Login successful',
      };

      mockAuthService.directLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.directLogin).toBeDefined();
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.directLogin(mockMnemonic, 'testuser');
      });
      
      expect(mockAuthService.directLogin).toHaveBeenCalled();
      expect(loginResult).toEqual(mockLoginResult);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('should perform successful direct login with custom expiration seconds', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'new-token',
        user: mockUser,
        wallet: mockWallet,
        message: 'Login successful',
      };

      mockAuthService.directLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.directLogin(
          mockMnemonic, 
          'testuser', 
          undefined, 
          600, // mnemonicExpirationSeconds
          1200 // walletExpirationSeconds
        );
      });
      
      expect(loginResult).toEqual(mockLoginResult);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mnemonicExpirationSeconds', '600');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('walletExpirationSeconds', '1200');
    });

    it('should handle direct login failure', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockError = { error: 'Login failed' };

      mockAuthService.directLogin.mockResolvedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.directLogin(mockMnemonic, 'testuser');
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('emailChallengeLogin', () => {
    it('should perform successful email challenge login', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'new-token',
        user: mockUser,
        wallet: mockWallet,
        message: 'Login successful',
      };

      mockAuthService.emailChallengeLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.emailChallengeLogin(
          mockMnemonic,
          'challenge-token',
          'testuser'
        );
      });
      
      expect(loginResult).toEqual(mockLoginResult);
    });

    it('should perform successful email challenge login with custom expiration seconds', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'new-token',
        user: mockUser,
        wallet: mockWallet,
        message: 'Login successful',
      };

      mockAuthService.emailChallengeLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.emailChallengeLogin(
          mockMnemonic,
          'challenge-token',
          'testuser',
          undefined,
          300, // mnemonicExpirationSeconds
          900  // walletExpirationSeconds
        );
      });
      
      expect(loginResult).toEqual(mockLoginResult);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mnemonicExpirationSeconds', '300');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('walletExpirationSeconds', '900');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockUser = createMockUser();
      const mockRefreshResult = {
        token: 'refreshed-token',
        user: mockUser,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.refreshToken).toBeDefined();
      });

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });
      
      expect(refreshResult).toEqual(mockRefreshResult);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'refreshed-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('should handle refresh token failure', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.refreshToken).toBeDefined();
      });

      await expect(act(async () => {
        await result.current.refreshToken();
      })).rejects.toThrow('Refresh failed');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockRegisterResult = {
        success: true,
        message: 'Registration successful',
        mnemonic: 'test mnemonic',
      };

      mockAuthService.register.mockResolvedValue(mockRegisterResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.register(
          'testuser',
          'test@example.com',
          'UTC',
          'password'
        );
      });
    });
  });

  describe('requestEmailLogin', () => {
    it('should request email login successfully', async () => {
      const mockMessage = 'Email sent successfully';
      mockAuthService.requestEmailLogin.mockResolvedValue(mockMessage);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.requestEmailLogin('testuser');
      });
    });
  });

  describe('backupCodeLogin', () => {
    it('should perform backup code login successfully', async () => {
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'backup-token',
        user: mockUser,
        codeCount: 5,
        mnemonic: 'recovered mnemonic',
        message: 'Login successful',
      };

      mockAuthService.backupCodeLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.backupCodeLogin(
          'testuser',
          'backup-code',
          false,
          true
        );
      });
      
      expect(loginResult).toEqual({
        token: 'backup-token',
        codeCount: 5,
        mnemonic: 'recovered mnemonic',
        message: 'Login successful',
      });
    });
  });

  describe('logout', () => {
    it('should logout user and clear all data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userData).toBe(null);
      expect(result.current.mnemonic).toBeUndefined();
      expect(result.current.wallet).toBeUndefined();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const mockUser = createMockUser();
      mockAuthService.verifyToken.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyToken('test-token');
      });

      expect(verifyResult).toBe(true);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('test-token');
    });

    it('should handle token verification failure', async () => {
      mockAuthService.verifyToken.mockResolvedValue({ error: 'Invalid token' });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let verifyResult;
      await act(async () => {
        verifyResult = await result.current.verifyToken('invalid-token');
      });

      expect(verifyResult).toBe(false);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('invalid-token');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock localStorage to have encrypted password (password login available)
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'encryptedPassword') return 'mock-encrypted-password';
        return null;
      });

      // Mock successful password login service operations
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      mockPasswordLoginService.getWalletAndMnemonicFromLocalStorageBundle.mockResolvedValue({
        mnemonic: mockMnemonic,
        wallet: mockWallet,
      });
      mockPasswordLoginService.setupPasswordLoginLocalStorageBundle.mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.changePassword('oldpass', 'newpass');
      });
    });

    it('should handle password change failure', async () => {
      // Mock localStorage to not have encrypted password (password login not available)
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let changeResult;
      await act(async () => {
        changeResult = await result.current.changePassword('oldpass', 'newpass');
      });

      expect(changeResult).toEqual({ error: 'error_login_passwordLoginNotSetup', errorType: 'PasswordLoginNotSetup' });
    });
  });

  describe('Mnemonic Management', () => {
    it('should set and clear mnemonic', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');

      await waitFor(() => {
        expect(result.current.setMnemonic).toBeDefined();
      });

      act(() => {
        result.current.setMnemonic(mockMnemonic, 10);
      });

      expect(result.current.mnemonic).toEqual(mockMnemonic);

      act(() => {
        result.current.clearMnemonic();
      });

      expect(result.current.mnemonic).toBeUndefined();
    });

    it('should store mnemonic expiration seconds to localStorage when provided', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');

      await waitFor(() => {
        expect(result.current.setMnemonic).toBeDefined();
      });

      act(() => {
        result.current.setMnemonic(mockMnemonic, 300);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('mnemonicExpirationSeconds', '300');
      expect(result.current.mnemonic).toEqual(mockMnemonic);
    });

    it('should use stored expiration seconds when duration not provided', async () => {
      localStorageMock.getItem.mockImplementation((key) => 
        key === 'mnemonicExpirationSeconds' ? '600' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');

      await waitFor(() => {
        expect(result.current.setMnemonic).toBeDefined();
      });

      act(() => {
        result.current.setMnemonic(mockMnemonic);
      });

      expect(result.current.mnemonic).toEqual(mockMnemonic);
      // Should not call setItem when no duration provided
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('mnemonicExpirationSeconds', expect.any(String));
    });
  });

  describe('Wallet Management', () => {
    it('should set and clear wallet', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setWallet).toBeDefined();
      });

      act(() => {
        result.current.setWallet(mockWallet, 10);
      });

      expect(result.current.wallet).toEqual(mockWallet);

      act(() => {
        result.current.clearWallet();
      });

      expect(result.current.wallet).toBeUndefined();
    });

    it('should store wallet expiration seconds to localStorage when provided', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setWallet).toBeDefined();
      });

      act(() => {
        result.current.setWallet(mockWallet, 900);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('walletExpirationSeconds', '900');
      expect(result.current.wallet).toEqual(mockWallet);
    });

    it('should use stored expiration seconds when duration not provided', async () => {
      localStorageMock.getItem.mockImplementation((key) => 
        key === 'walletExpirationSeconds' ? '1200' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setWallet).toBeDefined();
      });

      act(() => {
        result.current.setWallet(mockWallet);
      });

      expect(result.current.wallet).toEqual(mockWallet);
      // Should not call setItem when no duration provided
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('walletExpirationSeconds', expect.any(String));
    });
  });

  describe('Expiration Settings Management', () => {
    it('should set mnemonic expiration seconds and update localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.setMnemonicExpirationSeconds).toBeDefined();
      });

      act(() => {
        result.current.setMnemonicExpirationSeconds(1800);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('mnemonicExpirationSeconds', '1800');
    });

    it('should set wallet expiration seconds and update localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.setWalletExpirationSeconds).toBeDefined();
      });

      act(() => {
        result.current.setWalletExpirationSeconds(3600);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('walletExpirationSeconds', '3600');
    });

    it('should use updated expiration seconds after setting them', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setMnemonicExpirationSeconds).toBeDefined();
        expect(result.current.setWalletExpirationSeconds).toBeDefined();
      });

      // Set new expiration times
      act(() => {
        result.current.setMnemonicExpirationSeconds(2400);
        result.current.setWalletExpirationSeconds(4800);
      });

      // Clear the setItem calls from setting expiration times
      localStorageMock.setItem.mockClear();

      // Now set mnemonic and wallet without duration - should use the stored values
      act(() => {
        result.current.setMnemonic(mockMnemonic);
      });

      act(() => {
        result.current.setWallet(mockWallet);
      });

      expect(result.current.mnemonic).toEqual(mockMnemonic);
      expect(result.current.wallet).toEqual(mockWallet);
      // Should not call setItem again since we're using stored defaults
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('mnemonicExpirationSeconds', expect.any(String));
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('walletExpirationSeconds', expect.any(String));
    });
  });

  describe('Currency and Language Management', () => {
    it('should set currency code and update localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.setCurrencyCode).toBeDefined();
      });

      const newCurrencyCode = new CurrencyCode('EUR');

      await act(async () => {
        await result.current.setCurrencyCode(newCurrencyCode);
      });

      expect(result.current.currencyCode).toEqual(newCurrencyCode);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currencyCode', 'EUR');
    });

    it('should set language', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.setLanguage('es');
      });

      expect(result.current.setLanguage).toBeDefined();
    });
  });

  describe('Timeout Management', () => {
    it('should set expiration times and use them for timeouts', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setMnemonicExpirationSeconds).toBeDefined();
        expect(result.current.setWalletExpirationSeconds).toBeDefined();
      });

      // Set custom expiration times
      act(() => {
        result.current.setMnemonicExpirationSeconds(120); // 2 minutes
        result.current.setWalletExpirationSeconds(180); // 3 minutes
      });

      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalledWith('mnemonicExpirationSeconds', '120');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('walletExpirationSeconds', '180');

      // Set mnemonic and wallet without explicit duration - should use the custom times
      act(() => {
        result.current.setMnemonic(mockMnemonic);
        result.current.setWallet(mockWallet);
      });

      expect(result.current.mnemonic).toEqual(mockMnemonic);
      expect(result.current.wallet).toEqual(mockWallet);
      
      // Verify timeout functions are set up (they should be active but we won't test timing)
      expect(result.current.mnemonic).toBeDefined();
      expect(result.current.wallet).toBeDefined();
    });
  });

  describe('passwordLogin', () => {
    it('should perform successful password login', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();
      const mockUser = createMockUser();
      const mockLoginResult = {
        token: 'password-token',
        message: 'Login successful',
        user: mockUser,
        wallet: mockWallet,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'encryptedPassword') return 'mock-encrypted-password';
        if (key === 'passwordLoginSalt') return '0'.repeat(64);
        if (key === 'encryptedPrivateKey') return '0'.repeat(128);
        if (key === 'encryptedMnemonic') return '0'.repeat(128);
        if (key === 'pbkdf2Profile') return 'BROWSER_PASSWORD';
        return null;
      });

      mockPasswordLoginService.getWalletAndMnemonicFromLocalStorageBundle.mockResolvedValue({
        mnemonic: mockMnemonic,
        wallet: mockWallet,
      });
      mockAuthService.directLogin.mockResolvedValue(mockLoginResult);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.passwordLogin(new SecureString('password'));
      });
      
      expect(loginResult).toEqual(mockLoginResult);
      expect(mockPasswordLoginService.getWalletAndMnemonicFromLocalStorageBundle).toHaveBeenCalled();
    });

    it('should handle password login when not available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.passwordLogin(new SecureString('password'));
      });

      expect(loginResult).toEqual({ error: 'error_login_passwordLoginNotSetup', errorType: 'PasswordLoginNotSetup' });
    });
  });

  describe('setUpPasswordLogin', () => {
    it('should set up password login successfully', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();

      mockPasswordLoginService.setupPasswordLoginLocalStorageBundle.mockResolvedValue(mockWallet);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let setupResult;
      await act(async () => {
        setupResult = await result.current.setUpPasswordLogin(
          mockMnemonic,
          new SecureString('password')
        );
      });
      
      expect(setupResult).toEqual({ success: true, message: expect.any(String) });
      expect(mockPasswordLoginService.setupPasswordLoginLocalStorageBundle).toHaveBeenCalled();
    });

    it('should handle password setup failure', async () => {
      const mockMnemonic = new SecureString('test mnemonic');
      mockPasswordLoginService.setupPasswordLoginLocalStorageBundle.mockRejectedValue(new Error('Setup failed'));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      let setupResult;
      await act(async () => {
        setupResult = await result.current.setUpPasswordLogin(
          mockMnemonic,
          new SecureString('password')
        );
      });

      expect(setupResult).toEqual({
        success: false,
        message: 'passwordLogin_setup_failure',
      });
    });
  });

  describe('isPasswordLoginAvailable', () => {
    it('should return true when encrypted password exists', async () => {
      localStorageMock.getItem.mockImplementation((key) => 
        key === 'encryptedPassword' ? 'mock-encrypted-password' : null
      );

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isPasswordLoginAvailable?.()).toBe(true);
      });
    });

    it('should return false when no encrypted password exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isPasswordLoginAvailable?.()).toBe(false);
      });
    });
  });

  describe('Timeout Setup', () => {
    it('should set up timeouts when setting mnemonic and wallet', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
      const mockMnemonic = new SecureString('test mnemonic');
      const mockWallet = Wallet.generate();

      await waitFor(() => {
        expect(result.current.setMnemonic).toBeDefined();
        expect(result.current.setWallet).toBeDefined();
      });

      act(() => {
        result.current.setMnemonic(mockMnemonic, 300);
        result.current.setWallet(mockWallet, 600);
      });

      expect(result.current.mnemonic).toEqual(mockMnemonic);
      expect(result.current.wallet).toEqual(mockWallet);
    });
  });

  describe('State Exposure', () => {
    it('should expose mnemonicExpirationSeconds and walletExpirationSeconds', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(typeof result.current.mnemonicExpirationSeconds).toBe('number');
        expect(typeof result.current.walletExpirationSeconds).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid localStorage values gracefully', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'mnemonicExpirationSeconds') return 'invalid';
        if (key === 'walletExpirationSeconds') return 'invalid';
        return null;
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(typeof result.current.mnemonicExpirationSeconds).toBe('number');
        expect(typeof result.current.walletExpirationSeconds).toBe('number');
      });
    });

    it('should handle checkAuth with error response from verifyToken', async () => {
      localStorageMock.getItem.mockReturnValue('token-with-error');
      mockAuthService.verifyToken.mockResolvedValue({ error: 'Token expired' });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.token).toBe(null);
      });
    });

    it('should handle changePassword with invalid current password', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'encryptedPassword') return 'mock-encrypted-password';
        return null;
      });

      mockPasswordLoginService.getWalletAndMnemonicFromLocalStorageBundle.mockResolvedValue({
        mnemonic: null, // Invalid mnemonic
        wallet: Wallet.generate(),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.changePassword('wrongpass', 'newpass');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle console errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      mockAuthService.verifyToken.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(consoleMock.error).toHaveBeenCalledWith('Token verification failed:', expect.any(Error));
      });
    });
  });
});