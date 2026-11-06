/**
 * The authentication context, its data shape, and the `useAuth` hook, split out of AuthProvider so consumers that only
 * read auth state (e.g. the menu components) need not pull AuthProvider's runtime crypto/HTTP stack (ecies-lib,
 * @ethereumjs/wallet, axios) into their bundle. The crypto/suite symbols are imported as TYPES only, so they are erased
 * at build time and add no runtime weight. AuthProvider re-exports these, so the public API is unchanged.
 */
import { createContext, useContext } from 'react';
import type { EmailString, Member as FrontendMember, SecureString } from '@digitaldefiance/ecies-lib';
import type { CurrencyCode } from '@digitaldefiance/i18n-lib';
import type { IRequestUserDTO, ISuccessMessage, IUserSettings } from '@digitaldefiance/suite-core-lib';
import type { Wallet } from '@ethereumjs/wallet';
import type { PaletteMode } from '@mui/material';

export interface AuthContextData {
  /**
   * True if the user has a global admin role
   */
  admin: boolean;
  /**
   * Counter that increments on login/logout to trigger effects in dependent components
   */
  authState: number;
  /**
   * Performs a server side backup-code login
   * @param identifier
   * @param code
   * @param isEmail
   * @param recoverMnemonic
   * @param newPassword
   * @returns
   */
  backupCodeLogin: (
    identifier: string,
    code: string,
    isEmail: boolean,
    recoverMnemonic: boolean,
    newPassword?: string
  ) => Promise<
    | { token: string; codeCount: number; mnemonic?: string; message?: string }
    | { error: string; status?: number }
  >;
  /**
   * Verifies the stored token (if any) and updates auth state
   * @returns void
   */
  checkAuth: () => void;
  /**
   * Changes the stored browser password login mnemonic
   * @param currentPassword
   * @param newPassword
   * @returns
   */
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<
    | ISuccessMessage
    | {
        error: string;
        errorType?: string | undefined;
      }
  >;
  clearMnemonic: () => void;
  clearWallet: () => void;
  colorMode?: PaletteMode;
  currencyCode?: CurrencyCode;
  directLogin: (
    mnemonic: SecureString,
    username?: string,
    email?: EmailString,
    expireMnemonicSeconds?: number,
    expireWalletSeconds?: number
  ) => Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet }
    | { pendingTotpToken: string }
    | { error: string; errorType?: string }
  >;
  emailChallengeLogin: (
    mnemonic: SecureString,
    token: string,
    username?: string,
    email?: EmailString,
    expireMnemonicSeconds?: number,
    expireWalletSeconds?: number
  ) => Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet; message: string }
    | { pendingTotpToken: string }
    | { error: string; errorType?: string }
  >;
  isAuthenticated: boolean;
  // True only while the app is determining initial auth state (e.g., on first load or refresh)
  isCheckingAuth: boolean;
  isBrowserPasswordLoginAvailable?: () => boolean;
  loading: boolean;
  logout: () => void;
  mnemonic?: SecureString;
  mnemonicExpirationSeconds: number;
  passwordLogin: (
    password: SecureString,
    username?: string,
    email?: EmailString
  ) => Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet }
    | { pendingTotpToken: string }
    | { error: string; errorType?: string }
  >;
  requestEmailLogin: (
    username?: string,
    email?: EmailString
  ) => Promise<string | { error: string; errorType?: string }>;
  refreshToken: () => Promise<{ token: string; user: IRequestUserDTO }>;
  register: (
    username: string,
    email: string,
    timezone: string,
    password?: string,
    mnemonic?: string,
    displayName?: string,
    directChallenge?: boolean
  ) => Promise<
    | {
        success: boolean;
        message: string;
        mnemonic: string;
      }
    | {
        error: string;
        errorType?: string;
        field?: string;
        errors?: Array<{ path: string; msg: string }>;
      }
  >;
  serverPublicKey: string | null;
  /**
   * Gets the remaining time in seconds for the mnemonic expiration
   * @returns Number of seconds remaining, or 0 if no mnemonic is set
   */
  getMnemonicRemainingTime: () => number;
  /**
   * Gets the remaining time in seconds for the wallet expiration
   * @returns Number of seconds remaining, or 0 if no wallet is set
   */
  getWalletRemainingTime: () => number;
  setMnemonic: (mnemonic: SecureString, durationSeconds?: number) => void;
  setMnemonicExpirationSeconds: (seconds: number) => void;
  setWalletExpirationSeconds: (seconds: number) => void;
  setUpBrowserPasswordLogin: (
    mnemonic: SecureString,
    password: SecureString,
    username?: string,
    email?: EmailString
  ) => Promise<
    | { success: boolean; message: string }
    | { error: string; errorType?: string }
  >;
  setUser: (user: IRequestUserDTO | null) => Promise<void>;
  setUserSetting: (setting?: Partial<IUserSettings>) => Promise<void>;
  setWallet: (wallet: Wallet, durationSeconds?: number) => void;
  user: FrontendMember | null;
  userData: IRequestUserDTO | null;
  userSettings: IUserSettings | undefined;
  token: string | null;
  wallet?: Wallet;
  walletExpirationSeconds: number;
  verifyToken: (token: string) => Promise<boolean>;
  /**
   * Initiates TOTP setup for the authenticated user.
   * Returns the provisioning URI and raw base32 secret on success.
   */
  setupTotp: () => Promise<
    { provisioningUri: string; secret: string } | { error: string }
  >;
  /**
   * Confirms TOTP setup with a 6-digit code.
   */
  confirmTotp: (
    code: string
  ) => Promise<{ success: boolean } | { error: string }>;
  /**
   * Completes TOTP login by verifying a 6-digit code against a pending TOTP token.
   */
  verifyTotpLogin: (
    pendingTotpToken: string,
    code: string
  ) => Promise<{ token: string; user: IRequestUserDTO } | { error: string }>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => useContext(AuthContext);
