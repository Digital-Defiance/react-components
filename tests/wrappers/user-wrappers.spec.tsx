import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LocalStorageMock } from '@digitaldefiance/express-suite-test-utils/src/lib/localStorage-mock';
import {
  BackupCodesWrapper,
  ChangePasswordFormWrapper,
  VerifyEmailPageWrapper,
  UserSettingsFormWrapper,
} from '../../src/wrappers';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';
import { AuthProvider } from '../../src/contexts/AuthProvider';
import { AppThemeProvider } from '../../src/contexts/ThemeProvider';
import { I18nProvider } from '../../src/contexts/I18nProvider';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { ECIES } from '@digitaldefiance/ecies-lib';

const mockUseBackupCodes = jest.fn();
const mockUseUserSettings = jest.fn();
const mockUseEmailVerification = jest.fn();

jest.mock('../../src/hooks/useBackupCodes', () => ({
  useBackupCodes: () => mockUseBackupCodes(),
}));

jest.mock('../../src/hooks/useUserSettings', () => ({
  useUserSettings: () => mockUseUserSettings(),
}));

jest.mock('../../src/hooks/useEmailVerification', () => ({
  useEmailVerification: () => mockUseEmailVerification(),
}));

const mockAuthService = {
  verifyToken: jest.fn().mockResolvedValue({ valid: false, userData: null }) as any,
  refreshToken: jest.fn().mockResolvedValue({ token: null }) as any,
  directLogin: jest.fn().mockResolvedValue({ success: false }) as any,
  emailChallengeLogin: jest.fn().mockResolvedValue({ success: false }) as any,
  register: jest.fn().mockResolvedValue({ success: false }) as any,
  requestEmailLogin: jest.fn().mockResolvedValue({ success: false }) as any,
  backupCodeLogin: jest.fn().mockResolvedValue({ success: false }) as any,
  changePassword: jest.fn().mockResolvedValue({ success: false }) as any,
};

jest.mock('../../src/services/authService', () => ({
  createAuthService: jest.fn(() => mockAuthService),
}));

const mockApiClient = {
  get: jest.fn().mockResolvedValue({ data: {} }) as any,
  post: jest.fn().mockResolvedValue({ data: {} }) as any,
  put: jest.fn().mockResolvedValue({ data: {} }) as any,
  delete: jest.fn().mockResolvedValue({ data: {} }) as any,
};

jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => mockApiClient),
}));

describe('User Management Wrapper Components', () => {
  let i18nEngine: I18nEngine;

  beforeAll(() => {
    i18nEngine = I18nEngine.getInstance('default');
    
    Object.defineProperty(window, 'localStorage', {
      value: new LocalStorageMock(),
      writable: true,
      configurable: true,
    });

    mockUseBackupCodes.mockReturnValue({
      backupCodesRemaining: 5,
      isLoading: false,
      error: null,
      generateBackupCodes: jest.fn().mockResolvedValue({
        message: 'Success',
        backupCodes: ['code1', 'code2'],
      }) as any,
      refreshCodeCount: jest.fn(),
    });

    mockUseUserSettings.mockReturnValue({
      settings: {
        email: 'test@example.com',
        timezone: 'UTC',
        siteLanguage: 'en-US',
        currency: 'USD',
        darkMode: false,
        directChallenge: false,
      },
      isLoading: false,
      error: null,
      updateSettings: jest.fn().mockResolvedValue({ success: true }) as any,
      refreshSettings: jest.fn(),
    });

    mockUseEmailVerification.mockReturnValue({
      isVerifying: false,
      error: null,
      verifyEmail: jest.fn().mockResolvedValue({ success: true }) as any,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <SuiteConfigProvider
        baseUrl="https://api.test.com"
        routes={{
          dashboard: '/dashboard',
          login: '/login',
          register: '/register',
          verifyEmail: '/verify-email',
        }}
        languages={[{ code: 'en-US', label: 'English' }]}
      >
        <I18nProvider i18nEngine={i18nEngine}>
          <AppThemeProvider>
            <AuthProvider 
              baseUrl="https://api.test.com" 
              constants={Constants}
              eciesConfig={ECIES as any}
              onLogout={() => {}}
            >
              {children}
            </AuthProvider>
          </AppThemeProvider>
        </I18nProvider>
      </SuiteConfigProvider>
    </BrowserRouter>
  );

  describe('BackupCodesWrapper', () => {
    it('renders BackupCodesForm with code count', () => {
      render(<BackupCodesWrapper />, { wrapper });
      expect(screen.getByRole('heading', { name: /backup codes remaining/i })).toBeTruthy();
    });
  });

  describe('ChangePasswordFormWrapper', () => {
    it('renders ChangePasswordForm', () => {
      render(<ChangePasswordFormWrapper />, { wrapper });
      expect(screen.getByRole('heading', { name: /change password/i })).toBeTruthy();
    });
  });

  describe('VerifyEmailPageWrapper', () => {
    it('renders VerifyEmailPage', () => {
      // Note: window.location.search is read when component mounts
      render(<VerifyEmailPageWrapper />, { wrapper });
      expect(mockUseEmailVerification).toHaveBeenCalled();
    });
  });

  describe('UserSettingsFormWrapper', () => {
    it('shows loading state initially', () => {
      mockUseUserSettings.mockReturnValue({
        settings: null,
        isLoading: true,
        error: null,
        updateSettings: jest.fn(),
        refreshSettings: jest.fn(),
      });

      render(<UserSettingsFormWrapper />, { wrapper });
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it('renders UserSettingsForm after loading', () => {
      mockUseUserSettings.mockReturnValue({
        settings: {
          email: 'test@example.com',
          timezone: 'UTC',
          siteLanguage: 'en-US',
          currency: 'USD',
          darkMode: false,
          directChallenge: false,
        },
        isLoading: false,
        error: null,
        updateSettings: jest.fn().mockResolvedValue({ success: true }) as any,
        refreshSettings: jest.fn(),
      });

      render(<UserSettingsFormWrapper />, { wrapper });
      expect(screen.getByRole('heading', { name: /settings/i })).toBeTruthy();
    });

    it('uses languages from SuiteConfig', () => {
      render(<UserSettingsFormWrapper />, { wrapper });
      expect(screen.getByLabelText(/language/i)).toBeTruthy();
    });
  });
});
