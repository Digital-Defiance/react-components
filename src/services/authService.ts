// services/authService.js
import {
  EciesCryptoCore,
  ECIESService,
  EmailString,
  hexToUint8Array,
  IECIESConfig,
  SecureString,
  uint8ArrayToHex,
} from '@digitaldefiance/ecies-lib';
import { getSuiteCoreTranslation, IConstants, IRequestUserDTO, SuiteCoreStringKey, TranslatableSuiteError } from '@digitaldefiance/suite-core-lib';
import { CoreLanguageCode } from '@digitaldefiance/i18n-lib';
import { Wallet } from '@ethereumjs/wallet';
import axios, { isAxiosError } from 'axios';
import { createApiClient }  from './api';
import { createAuthenticatedApiClient } from './authenticatedApi';

interface AuthContextFunctions {
  setUser: (user: IRequestUserDTO | null) => void;
  setLanguage: (lang: CoreLanguageCode) => void;
}

export class AuthService {
  private eciesService: ECIESService;
  private cryptoCore: EciesCryptoCore;
  private apiClient: axios.AxiosInstance;
  private authenticatedApiClient: axios.AxiosInstance;

  constructor(
    private constants: IConstants,
    private baseUrl: string,
    eciesConfig: IECIESConfig
  ) {
    this.eciesService = new ECIESService(eciesConfig);
    this.cryptoCore = new EciesCryptoCore(eciesConfig);
    this.apiClient = createApiClient(this.baseUrl);
    this.authenticatedApiClient = createAuthenticatedApiClient(this.baseUrl);
  }

  getSiteDomain(): string {
    return this.constants.AdministratorEmail.split('@')[1];
  }

  async register(
    username: string,
    email: string,
    timezone: string,
    password?: string,
  ): Promise<
    | { success: boolean; message: string; mnemonic: string }
    | {
        error: string;
        errorType?: string;
        field?: string;
        errors?: Array<Record<string, string>>;
      }
  > {
    try {
      const response = await this.apiClient.post('/user/register', {
        username,
        email,
        timezone,
        ...(password ? { password } : {}),
      });
      if (response.status !== 201) {
        return {
          error: response.data.message
            ? response.data.message
            : getSuiteCoreTranslation(SuiteCoreStringKey.Registration_Error),
          ...(response.data.errorType
            ? { errorType: response.data.errorType }
            : {}),
          ...(response.data.errors ? { errors: response.data.errors } : {}),
        };
      }
      return {
        success: true,
        message:
          response.data.message ??
          getSuiteCoreTranslation(SuiteCoreStringKey.Registration_Success, {
            MNEMONIC: response.data.mnemonic,
          }),
        mnemonic: response.data.mnemonic,
      };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          error:
            error.response.data.error?.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
          ...(error.response.data.error?.field
            ? { field: error.response.data.error.field }
            : {}),
          ...(error.response.data.errors
            ? { errors: error.response.data.errors }
            : {}),
        };
      } else {
        return {
          error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
        };
      }
    }
  }

  async directLogin(
    mnemonic: SecureString,
    username?: string,
    email?: EmailString,
  ): Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet; message: string }
    | { error: string; errorType?: string }
  > {
    if (!username && !email) {
      return {
        error: getSuiteCoreTranslation(SuiteCoreStringKey.Validation_UsernameOrEmailRequired),
      };
    }
    try {
      const loginRequest = await this.apiClient.post('/user/request-direct-login');
      if (loginRequest.data.challenge) {
        const { wallet } = this.cryptoCore.walletAndSeedFromMnemonic(mnemonic);
        const publicKey = wallet.getPublicKey();
        // Add 0x04 prefix for uncompressed public key
        const publicKeyWithPrefix = new Uint8Array(publicKey.length + 1);
        publicKeyWithPrefix[0] = 0x04;
        publicKeyWithPrefix.set(publicKey, 1);
        const challengeBuffer = hexToUint8Array(loginRequest.data.challenge);
        const privateKeyBuffer = wallet.getPrivateKey();
        const signature = this.eciesService.signMessage(privateKeyBuffer, challengeBuffer);
        const signatureHex = uint8ArrayToHex(signature);
        const loginResponse = await this.apiClient.post('/user/direct-challenge', {
          username: username,
          email: email ? email.email : undefined,
          challenge: loginRequest.data.challenge,
          signature: signatureHex,
        });
        if (loginResponse.data.token && loginResponse.data.user) {
          return {
            message: loginResponse.data.message,
            token: loginResponse.data.token,
            user: loginResponse.data.user,
            wallet,
          };
        }
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        // Check for DirectChallengeNotEnabled error
        if (error.response.status === 403 && error.response.data.errorType === 'DirectChallengeNotEnabledError') {
          return {
            error: getSuiteCoreTranslation(SuiteCoreStringKey.Error_Login_DirectChallengeNotEnabled),
            errorType: 'DirectChallengeNotEnabled',
          };
        }
        // Check for PasswordLoginNotEnabled error
        if (error.response.status === 403 && error.response.data.errorType === 'PasswordLoginNotEnabledError') {
          return {
            error: getSuiteCoreTranslation(SuiteCoreStringKey.Error_Login_PasswordLoginNotEnabled),
            errorType: 'PasswordLoginNotEnabled',
          };
        }
        
        return {
          error:
            error.response.data.error?.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
        };
      }
      console.error('directLogin: non-axios error:', error);
    }
    return {
      error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
    };
  }

  async requestEmailLogin(
    username?: string,
    email?: EmailString,
  ): Promise<string | { error: string; errorType?: string }> {
    if (!username && !email) {
      return {
        error: getSuiteCoreTranslation(SuiteCoreStringKey.Validation_UsernameOrEmailRequired),
      };
    }
    try {
      const result = await this.apiClient.post('/user/request-email-login', {
        email: email ? email.email : undefined,
        username,
      });
      if (result.data.message) {
        return result.data.message;
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          error:
            error.response.data.error?.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
        };
      }
    }
    return {
      error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
    };
  }

  async emailChallengeLogin(
    mnemonic: SecureString,
    token: string,
    username?: string,
    email?: EmailString,
  ): Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet; message: string }
    | { error: string; errorType?: string }
  > {
    if (!username && !email) {
      return {
        error: getSuiteCoreTranslation(SuiteCoreStringKey.Validation_UsernameOrEmailRequired),
      };
    }
    try {
      const { wallet } = this.cryptoCore.walletAndSeedFromMnemonic(mnemonic);
      const challengeBuffer = hexToUint8Array(token);
      const privateKeyBuffer = wallet.getPrivateKey();
      const signature = this.eciesService.signMessage(privateKeyBuffer, challengeBuffer);
      const signatureHex = uint8ArrayToHex(signature);
      const response = await this.apiClient.post('/user/email-login', {
        token,
        signature: signatureHex,
        username: username ?? null,
        email: email ?? null,
      });
      if (response.data.token && response.data.user) {
        return {
          message: response.data.message,
          token: response.data.token,
          user: response.data.user,
          wallet,
        };
      }
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          error:
            error.response.data.error?.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
        };
      }
    }
    return {
      error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
    };
  }

  async verifyToken(
    token: string,
  ): Promise<IRequestUserDTO | { error: string; errorType?: string }> {
    try {
      const response = await this.apiClient.get('/user/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user as IRequestUserDTO;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          error: error.response.data.message
            ? error.response.data.message
            : error.message
            ? error.message
            : getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
        };
      } else {
        return {
          error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
        };
      }
    }
  }

  async refreshToken(): Promise<{
    token: string;
    user: IRequestUserDTO;
  }> {
    try {
      const refreshResponse = await this.authenticatedApiClient.get('/user/refresh-token');
      if (refreshResponse.status === 200) {
        const newToken = refreshResponse.headers['authorization'];
        let token: string | undefined = undefined;
        let user: IRequestUserDTO | undefined = undefined;
        if (newToken?.startsWith('Bearer ')) {
          token = newToken.slice(7);
        }
        if (refreshResponse.data.user) {
          user = refreshResponse.data.user;
        }
        if (token && user) {
          return { token, user };
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      if (isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    }
    throw new TranslatableSuiteError(SuiteCoreStringKey.Common_UnexpectedError);
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean } | { error: string; errorType?: string }> {
    try {
      await this.authenticatedApiClient.post('/user/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        return {
          error:
            error.response.data.error?.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
        };
      }
      return { error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError) };
    }
  }

  async backupCodeLogin(
    identifier: string,
    code: string,
    isEmail: boolean,
    recoverMnemonic: boolean,
    newPassword?: string,
  ): Promise<
    | {
        token: string;
        codeCount: number;
        user?: IRequestUserDTO;
        mnemonic?: string;
        message?: string;
      }
    | { error: string; status?: number; errorType?: string }
  > {
    try {
      const response = await this.apiClient.post('/user/backup-code', {
        [isEmail ? 'email' : 'username']: identifier,
        code,
        recoverMnemonic,
        ...(newPassword ? { newPassword } : {}),
      });
      if (response.data.token && response.data.user) {
        return {
          token: response.data.token,
          user: response.data.user,
          codeCount: response.data.codeCount ?? 0,
          ...(response.data.mnemonic ? { mnemonic: response.data.mnemonic } : {}),
          ...(response.data.message ? { message: response.data.message } : {}),
        };
      }
      return {
        error: response.data.message
          ? response.data.message
          : getSuiteCoreTranslation(SuiteCoreStringKey.Validation_InvalidToken),
        ...(response.data.errorType
          ? { errorType: response.data.errorType }
          : {}),
      };
    } catch (error) {
      console.error('Backup code login error:', error);
      if (isAxiosError(error) && error.response) {
        return {
          error:
            error.response.data.error.message ??
            error.response.data.message ??
            error.message ??
            getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError),
          ...(error.response.data.errorType
            ? { errorType: error.response.data.errorType }
            : {}),
          status: error.response.status,
        };
      }
      return { error: getSuiteCoreTranslation(SuiteCoreStringKey.Common_UnexpectedError) };
    }
  }
}

export const createAuthService = (constants: IConstants, baseUrl: string, eciesConfig: IECIESConfig) => 
  new AuthService(constants, baseUrl, eciesConfig);
