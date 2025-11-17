import { Member as FrontendMember,
    ECIESService,
  EmailString,
  IECIESConfig,
  SecureString,
  PasswordLoginService,
  Constants as AppConstants,
  Pbkdf2Service,
} from '@digitaldefiance/ecies-lib';
import {
  CoreLanguageCode,
  CurrencyCode,
  DefaultCurrencyCode,
} from '@digitaldefiance/i18n-lib';
import { Wallet } from '@ethereumjs/wallet';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useI18n } from './I18nProvider';
import { useTheme } from './ThemeProvider';
import { createAuthService } from '../services/authService';
import { createAuthenticatedApiClient } from '../services/authenticatedApi';
import { useExpiringValue } from '../hooks/useExpiringValue';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ISuccessMessage, IRequestUserDTO, SuiteCoreComponentId, SuiteCoreStringKey, IConstants } from '@digitaldefiance/suite-core-lib';

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
    newPassword?: string,
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
    newPassword: string,
  ) => Promise<
    | ISuccessMessage
    | {
        error: string;
        errorType?: string | undefined;
      }
  >;
  clearMnemonic: () => void;
  clearWallet: () => void;
  currencyCode: CurrencyCode;
  directLogin: (
    mnemonic: SecureString,
    username?: string,
    email?: EmailString,
    expireMnemonicSeconds?: number,
    expireWalletSeconds?: number,
  ) => Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet }
    | { error: string; errorType?: string }
  >;
  emailChallengeLogin: (
    mnemonic: SecureString,
    token: string,
    username?: string,
    email?: EmailString,
    expireMnemonicSeconds?: number,
    expireWalletSeconds?: number,
  ) => Promise<
    | { token: string; user: IRequestUserDTO; wallet: Wallet; message: string }
    | { error: string; errorType?: string }
  >;
  isAuthenticated: boolean;
  // True only while the app is determining initial auth state (e.g., on first load or refresh)
  isCheckingAuth: boolean;
  isPasswordLoginAvailable?: () => boolean;
  language: string;
  loading: boolean;
  logout: () => void;
  mnemonic?: SecureString;
  mnemonicExpirationSeconds: number;
  passwordLogin: (password: SecureString, username?: string, email?: EmailString) => Promise<{ token: string; user: IRequestUserDTO; wallet: Wallet } | { error: string; errorType?: string }>;
  requestEmailLogin: (
    username?: string,
    email?: EmailString,
  ) => Promise<string | { error: string; errorType?: string }>;
  refreshToken: () => Promise<{ token: string; user: IRequestUserDTO }>;
  register: (
    username: string,
    email: string,
    timezone: string,
    password?: string,
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
  setCurrencyCode: (code: CurrencyCode) => Promise<void>;
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
  setLanguage: (lang: string) => Promise<void>;
  setMnemonic: (mnemonic: SecureString, durationSeconds?: number) => void;
  setMnemonicExpirationSeconds: (seconds: number) => void;
  setWalletExpirationSeconds: (seconds: number) => void;
  setUpPasswordLogin: (mnemonic: SecureString, password: SecureString, username?: string, email?: EmailString) => Promise<{ success: boolean; message: string } | { error: string; errorType?: string }>;
  setUser: (user: IRequestUserDTO | null) => Promise<void>;
  setWallet: (wallet: Wallet, durationSeconds?: number) => void;
  user: FrontendMember | null;
  userData: IRequestUserDTO | null;
  token: string | null;
  wallet?: Wallet;
  walletExpirationSeconds: number;
  verifyToken: (token: string) => Promise<boolean>;
}

export type AuthProviderProps = {
  children: ReactNode;
  baseUrl: string;
  constants: IConstants;
  eciesConfig: IECIESConfig;
  /**
   * Optional callback to handle navigation after logout
   * If not provided, logout will only clear auth state without navigation
   */
  onLogout?: () => void;
};

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData,
);

const AuthProviderInner = ({ children, baseUrl, constants, eciesConfig, onLogout }: AuthProviderProps) => {
  const { changeLanguage, currentLanguage, t, tComponent } = useI18n();
  const { setColorMode } = useTheme();
  
  const authService = useMemo(() => createAuthService(constants, baseUrl, eciesConfig), [constants, baseUrl, eciesConfig]);
  const authenticatedApi = useMemo(() => createAuthenticatedApiClient(baseUrl), [baseUrl]);
  
  // Use the custom hooks for expiring values
  const mnemonicManager = useExpiringValue<SecureString>(
    constants.DefaultExpireMemoryMnemonicSeconds, 
    'mnemonicExpirationSeconds'
  );
  const walletManager = useExpiringValue<Wallet>(
    constants.DefaultExpireMemoryWalletSeconds, 
    'walletExpirationSeconds'
  );
  
  // Use localStorage hook for expiration settings
  const [mnemonicExpirationSeconds, _setMnemonicExpirationSeconds] = useLocalStorage(
    'mnemonicExpirationSeconds', 
    constants.DefaultExpireMemoryMnemonicSeconds
  );
  const [walletExpirationSeconds, _setWalletExpirationSeconds] = useLocalStorage(
    'walletExpirationSeconds', 
    constants.DefaultExpireMemoryWalletSeconds
  );
  const [serverPublicKey, setServerPublicKey] = useState<string | null>(null);
  const [user, setUser] = useState<IRequestUserDTO | null>(null);
  const [frontendUser, setFrontendUser] =
    useState<FrontendMember | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  // Separate flag so route guards don't unmount during actions (e.g., register/login)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authState, setAuthState] = useState(0);

  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    return new CurrencyCode(
      localStorage.getItem('currencyCode') ?? DefaultCurrencyCode,
    );
  });

  // Helper functions to calculate remaining time (now provided by the hooks)
  const getMnemonicRemainingTime = mnemonicManager.getRemainingTime;
  const getWalletRemainingTime = walletManager.getRemainingTime;

  // Wrapper functions to match the interface (the localStorage hook handles storage automatically)
  const setMnemonicExpirationSeconds = _setMnemonicExpirationSeconds;
  const setWalletExpirationSeconds = _setWalletExpirationSeconds;

  // Sync user language with i18n provider when the user's saved language changes.
  // Important: do NOT depend on currentLanguage here, or we'll run when the UI
  // language changes and inadvertently revert to the older user.siteLanguage,
  // causing a second update request with English US.
  useEffect(() => {
    if (user?.siteLanguage && user.siteLanguage !== currentLanguage) {
      void changeLanguage(user.siteLanguage as CoreLanguageCode);
    }
    // We intentionally only react to changes in the user's saved language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.siteLanguage]);

  const setMnemonic = useCallback((mnemonic: SecureString, durationSeconds?: number) => {
    const finalDurationSeconds = durationSeconds ?? mnemonicExpirationSeconds;
    
    // Store the duration to localStorage if provided
    if (durationSeconds !== undefined) {
      _setMnemonicExpirationSeconds(durationSeconds);
    }
    
    // Only save to storage if a custom duration was provided
    return mnemonicManager.setValue(mnemonic, finalDurationSeconds, durationSeconds !== undefined);
  }, [mnemonicExpirationSeconds, mnemonicManager.setValue, _setMnemonicExpirationSeconds]);

  const setWallet = useCallback((wallet: Wallet, durationSeconds?: number) => {
    const finalDurationSeconds = durationSeconds ?? walletExpirationSeconds;
    
    // Store the duration to localStorage if provided
    if (durationSeconds !== undefined) {
      _setWalletExpirationSeconds(durationSeconds);
    }
    
    // Only save to storage if a custom duration was provided
    return walletManager.setValue(wallet, finalDurationSeconds, durationSeconds !== undefined);
  }, [walletExpirationSeconds, walletManager.setValue, _setWalletExpirationSeconds]);

  const clearMnemonic = mnemonicManager.clearValue;
  const clearWallet = walletManager.clearValue;

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setIsCheckingAuth(false);
      setToken(null);
      setFrontendUser(null);
      setServerPublicKey(null);
      clearMnemonic();
      clearWallet();
      return;
    }

    try {
      const userData = await authService.verifyToken(token);
      if ('error' in userData && typeof userData.error === 'string') {
        setIsAuthenticated(false);
        setToken(null);
      } else {
        setUser(userData as IRequestUserDTO);
        setIsGlobalAdmin(
          (userData as IRequestUserDTO).roles.some((r) => r.admin),
        );
        setIsAuthenticated(true);
        setToken(token);
        // Set theme based on user's darkMode preference
        setColorMode((userData as IRequestUserDTO).darkMode ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  }, [authService, clearMnemonic, clearWallet, setColorMode]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      (async () => {
        await checkAuth();
      })();
    } else {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  }, [checkAuth, authState]);

  const directLogin: AuthContextData['directLogin'] = useCallback(
    async (mnemonic, username, email, expireMnemonicSeconds, expireWalletSeconds) => {
      setLoading(true);
      const loginResult = await authService.directLogin(
        mnemonic,
        username,
        email,
      );
      setLoading(false);
      if (
        typeof loginResult === 'object' &&
        'token' in loginResult &&
        'user' in loginResult &&
        'wallet' in loginResult
      ) {
        setMnemonic(mnemonic, expireMnemonicSeconds);
        setUser(loginResult.user);
        setWallet(loginResult.wallet, expireWalletSeconds);
        setIsAuthenticated(true);
        setAuthState((prev) => prev + 1);
        localStorage.setItem('authToken', loginResult.token);
        localStorage.setItem('user', JSON.stringify(loginResult.user));
        // Set theme based on user's darkMode preference
        setColorMode(loginResult.user.darkMode ? 'dark' : 'light');
        return loginResult;
      }
      return loginResult;
    },
    [authService, setMnemonic, setWallet, setColorMode],
  );

  const emailChallengeLogin: AuthContextData['emailChallengeLogin'] =
    useCallback(async (mnemonic, token, username, email, expireMnemonicSeconds, expireWalletSeconds) => {
      setLoading(true);
      const loginResult = await authService.emailChallengeLogin(
        mnemonic,
        token,
        username,
        email,
      );
      setLoading(false);
      if (
        typeof loginResult === 'object' &&
        'token' in loginResult &&
        'user' in loginResult &&
        'wallet' in loginResult
      ) {
        setMnemonic(mnemonic, expireMnemonicSeconds);
        setUser(loginResult.user);
        setWallet(loginResult.wallet, expireWalletSeconds);
        setIsAuthenticated(true);
        setAuthState((prev) => prev + 1);
        localStorage.setItem('authToken', loginResult.token);
        localStorage.setItem('user', JSON.stringify(loginResult.user));
        // Set theme based on user's darkMode preference
        setColorMode(loginResult.user.darkMode ? 'dark' : 'light');
        return loginResult;
      }
      return loginResult;
    }, [authService, setMnemonic, setWallet, setColorMode]);

  const getPasswordLoginService = useCallback(() => {
    const eciesService: ECIESService = new ECIESService(eciesConfig);
    return new PasswordLoginService(eciesService, new Pbkdf2Service(AppConstants.PBKDF2_PROFILES, AppConstants.ECIES, AppConstants.PBKDF2));
  }, [eciesConfig]);

  const isPasswordLoginAvailable: AuthContextData['isPasswordLoginAvailable'] = useCallback(() => {
    const storedEncryptedPassword = localStorage.getItem('encryptedPassword');
    return !!storedEncryptedPassword;
  }, []);

  const passwordLogin: AuthContextData['passwordLogin'] = useCallback(
    async (password: SecureString, username?: string, email?: EmailString) => {
      if (!isPasswordLoginAvailable()) {
        return { error: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Error_Login_PasswordLoginNotSetup), errorType: 'PasswordLoginNotSetup' };
      }
      setLoading(true);
      const passwordLoginService: PasswordLoginService = getPasswordLoginService();
      const { wallet, mnemonic } = await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(password);
      const loginResult = await authService.directLogin(
        mnemonic,
        username,
        email,
      );
      setLoading(false);
      setWallet(wallet);
      setMnemonic(mnemonic);
      // Set theme based on user's darkMode preference if login succeeded
      if ('user' in loginResult) {
        setColorMode(loginResult.user.darkMode ? 'dark' : 'light');
      }
      return loginResult;
    }, [authService, getPasswordLoginService, setMnemonic, setWallet, t, tComponent, isPasswordLoginAvailable, setColorMode]);

  const refreshToken: AuthContextData['refreshToken'] =
    useCallback(async () => {
      try {
        const result = await authService.refreshToken();
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setIsAuthenticated(true);
        return result;
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        throw error;
      }
    }, [authService]);

  const register: AuthContextData['register'] = useCallback(
    async (
      username: string,
      email: string,
      timezone: string,
      password?: string,
    ) => {
      const registerResult = await authService.register(
        username,
        email,
        timezone,
        password,
      );
      return registerResult as Awaited<ReturnType<AuthContextData['register']>>;
    },
    [baseUrl],
  );

  const requestEmailLogin = useCallback(
    async (
      username?: string,
      email?: EmailString,
    ): Promise<string | { error: string; errorType?: string }> => {
      setLoading(true);
      const result = await authService.requestEmailLogin(username, email);
      setLoading(false);
      return result;
    },
    [baseUrl],
  );



  const setUpPasswordLogin = useCallback(
    async (mnemonic: SecureString, password: SecureString, username?: string, email?: EmailString): Promise<{ success: boolean; message: string } | { error: string; errorType?: string }> => {
      setLoading(true);
      const passwordLoginService: PasswordLoginService = getPasswordLoginService();
      try {
        const wallet = await passwordLoginService.setupPasswordLoginLocalStorageBundle(mnemonic, password);
        setLoading(false);
        setWallet(wallet);
        setMnemonic(mnemonic);
        return { success: true, message: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId,SuiteCoreStringKey.PasswordLogin_Setup_Success) };
      } catch {
        setLoading(false);
        return { success: false, message: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.PasswordLogin_Setup_Failure) };
      }
    },
    [setMnemonic, setWallet, t, tComponent],
  );

  const backupCodeLogin = useCallback(
    async (
      identifier: string,
      code: string,
      isEmail: boolean,
      recoverMnemonic: boolean,
      newPassword?: string,
    ): Promise<
      | {
          token: string;
          codeCount: number;
          mnemonic?: string;
          message?: string;
        }
      | { error: string; status?: number }
    > => {
      setLoading(true);
      const loginResult = await authService.backupCodeLogin(
        identifier,
        code,
        isEmail,
        recoverMnemonic,
        newPassword,
      );
      setLoading(false);
      if (typeof loginResult === 'object' && 'token' in loginResult) {
        localStorage.setItem('authToken', loginResult.token);
        if (loginResult.user) {
          setUser(loginResult.user);
          setIsAuthenticated(true);
          // Set theme based on user's darkMode preference
          setColorMode(loginResult.user.darkMode ? 'dark' : 'light');
        }
        setAuthState((prev) => prev + 1);
        return {
          token: loginResult.token,
          mnemonic: loginResult.mnemonic,
          message: loginResult.message,
          codeCount: loginResult.codeCount,
        };
      }
      return loginResult;
    },
    [baseUrl, setColorMode],
  );

  const logout = useCallback(async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    clearMnemonic();
    setUser(null);
    clearWallet();
    setIsAuthenticated(false);
    setAuthState((prev) => prev + 1);
    
    // Call the optional navigation callback if provided
    if (onLogout) {
      onLogout();
    }
  }, [onLogout, clearMnemonic, clearWallet]);

  const verifyToken = useCallback(async (token: string) => {
    const requestUser = await authService.verifyToken(token);
    if (typeof requestUser === 'object' && 'error' in requestUser) {
      setIsAuthenticated(false);
      return false;
    } else {
      setUser(requestUser);
      setIsAuthenticated(true);
      return true;
    }
  }, [baseUrl]);

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<
      | ISuccessMessage
      | {
          error: string;
          errorType?: string | undefined;
        }
    > => {
      if (!isPasswordLoginAvailable()) {
        return { error: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Error_Login_PasswordLoginNotSetup), errorType: 'PasswordLoginNotSetup' };
      }
      setLoading(true);
      try {
        const passwordLoginService: PasswordLoginService = getPasswordLoginService();
        const { mnemonic, wallet } = await passwordLoginService.getWalletAndMnemonicFromLocalStorageBundle(new SecureString(currentPassword));
        if (!mnemonic) {
          setLoading(false);
          return { error: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.PasswordLogin_InvalidCurrentPassword), errorType: 'InvalidCurrentPassword' };
        }
        await passwordLoginService.setupPasswordLoginLocalStorageBundle(mnemonic, new SecureString(newPassword));
        setLoading(false);
        setWallet(wallet);
        setMnemonic(mnemonic);
        return { success: true, message: tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.PasswordChange_Success) };
      } catch (error) {
        setLoading(false);
        return { error: 'Password change failed' };
      }
    },
    [setMnemonic, setWallet, t, tComponent, isPasswordLoginAvailable],
  );

  const contextValue = useMemo(() => {
    const setUserAndLanguage = async (newUser: IRequestUserDTO | null) => {
      setUser(newUser);
      setIsAuthenticated(!!newUser);
    };

    const setLanguageAndUpdateUser = async (newLanguage: string) => {
      // Change the language in the i18n context
      changeLanguage(newLanguage);
      
      // Update the user's language preference on the server if authenticated
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await authenticatedApi.post('/user/language', { language: newLanguage });
        } catch (error) {
          console.error('Failed to update user language:', error);
        }
      }
    };

    const setCurrencyCodeAndUpdateStorage = async (code: CurrencyCode) => {
      setCurrencyCode(code);
      localStorage.setItem('currencyCode', code.value);
    };

    return {
      admin: isGlobalAdmin,
      authState,
      backupCodeLogin,
      changePassword,
      checkAuth,
      clearMnemonic,
      clearWallet,
      currencyCode,
      directLogin,
      emailChallengeLogin,
      getMnemonicRemainingTime,
      getWalletRemainingTime,
      isAuthenticated,
      isCheckingAuth,
      isPasswordLoginAvailable,
      language: currentLanguage,
      loading,
      logout,
      mnemonic: mnemonicManager.value,
      mnemonicExpirationSeconds,
      passwordLogin,
      refreshToken,
      register,
      requestEmailLogin,
      serverPublicKey,
      setCurrencyCode: setCurrencyCodeAndUpdateStorage,
      setLanguage: setLanguageAndUpdateUser,
      setMnemonic,
      setMnemonicExpirationSeconds,
      setUpPasswordLogin,
      setUser: setUserAndLanguage,
      setWallet,
      setWalletExpirationSeconds,
      token,
      user: frontendUser,
      userData: user,
      verifyToken,
      wallet: walletManager.value,
      walletExpirationSeconds,
    };
  }, [
    authenticatedApi,
    authState,
    backupCodeLogin,
    changeLanguage,
    changePassword,
    checkAuth,
    clearMnemonic,
    clearWallet,
    currencyCode,
    currentLanguage,
    directLogin,
    emailChallengeLogin,
    frontendUser,
    getMnemonicRemainingTime,
    getWalletRemainingTime,
    isAuthenticated,
    isCheckingAuth,
    isGlobalAdmin,
    isPasswordLoginAvailable,
    loading,
    logout,
    mnemonicManager.value,
    mnemonicExpirationSeconds,
    passwordLogin,
    refreshToken,
    register,
    requestEmailLogin,
    serverPublicKey,
    setMnemonic,
    setMnemonicExpirationSeconds,
    setUpPasswordLogin,
    setWallet,
    setWalletExpirationSeconds,
    token,
    user,
    verifyToken,
    walletManager.value,
    walletExpirationSeconds,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const AuthProvider = ({ children, baseUrl, constants, eciesConfig, onLogout }: AuthProviderProps) => {
  return (
    <AuthProviderInner baseUrl={baseUrl} constants={constants} eciesConfig={eciesConfig} onLogout={onLogout}>
      {children}
    </AuthProviderInner>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
