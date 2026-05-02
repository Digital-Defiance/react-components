import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { UserSettingsForm, UserSettingsFormValues, UserSettingsFormProps } from '../components/UserSettingsForm';
import { useAuth, useSuiteConfig } from '../contexts';
import { useUserSettingsPublic } from '../hooks';
import { getSuiteCoreTranslation, IConstants, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { createAuthService } from '../services/authService';
import { createAuthenticatedApiClient } from '../services/authenticatedApi';
import { IECIESConfig } from '@digitaldefiance/ecies-lib';

export interface UserSettingsFormWrapperProps {
  onSuccess?: () => void;
  /**
   * Constants for AuthService (required for TOTP methods).
   * If not provided, TOTP callbacks will not be wired up.
   */
  constants?: IConstants;
  /**
   * ECIES config for AuthService (required for TOTP methods).
   * If not provided, TOTP callbacks will not be wired up.
   */
  eciesConfig?: IECIESConfig;
  /**
   * Email domain for AuthService (required for TOTP methods).
   */
  emailDomain?: string;
  /**
   * When false (default), TOTP management controls are not shown.
   * Set to true when TOTP_AVAILABLE is enabled in the server environment.
   */
  totpAvailable?: boolean;
  componentProps?: Partial<Omit<UserSettingsFormProps, 'initialValues' | 'onSubmit' | 'languages'>>;
}

export const UserSettingsFormWrapper: FC<UserSettingsFormWrapperProps> = ({ 
  onSuccess,
  constants,
  eciesConfig,
  emailDomain = '',
  totpAvailable = false,
  componentProps = {},
}) => {
  const { settings, updateSettings } = useUserSettingsPublic();
  const { languages, baseUrl } = useSuiteConfig();
  const { isAuthenticated } = useAuth();

  // Fetch totpEnabled from the settings API
  const [totpEnabled, setTotpEnabled] = useState<boolean | undefined>(undefined);

  const authenticatedApi = useMemo(
    () => createAuthenticatedApiClient(baseUrl),
    [baseUrl],
  );

  const authService = useMemo(() => {
    if (!constants || !eciesConfig) return null;
    return createAuthService(constants, baseUrl, eciesConfig, emailDomain);
  }, [constants, eciesConfig, baseUrl, emailDomain]);

  // Fetch totpEnabled from GET /user/settings
  useEffect(() => {
    if (!isAuthenticated) return;
    authenticatedApi
      .get<{ settings: { totpEnabled?: boolean } }>('/user/settings')
      .then((res) => {
        setTotpEnabled(res.data?.settings?.totpEnabled ?? false);
      })
      .catch(() => {
        // If the endpoint fails, leave totpEnabled undefined (no TOTP controls shown)
      });
  }, [isAuthenticated, authenticatedApi]);

  const handleSubmit = async (values: UserSettingsFormValues) => {
    const result = await updateSettings(values);
    if ('success' in result && result.success && onSuccess) {
      onSuccess();
    }
    return result;
  };

  // TOTP callbacks — only wired when authService is available
  const handleTotpSetup = useCallback(async () => {
    if (!authService) return { error: 'AuthService not configured' };
    return authService.setupTotp();
  }, [authService]);

  const handleTotpConfirm = useCallback(async (code: string) => {
    if (!authService) return { error: 'AuthService not configured' };
    const result = await authService.confirmTotp(code);
    if ('success' in result && result.success) {
      setTotpEnabled(true);
    }
    return result;
  }, [authService]);

  const handleTotpDisable = useCallback(async (code: string) => {
    if (!authService) return { error: 'AuthService not configured' };
    const result = await authService.disableTotp(code);
    if ('success' in result && result.success) {
      setTotpEnabled(false);
    }
    return result;
  }, [authService]);

  const handleTotpReset = useCallback(async (code: string) => {
    if (!authService) return { error: 'AuthService not configured' };
    return authService.resetTotp(code);
  }, [authService]);

  // Only show loading on initial load, not during updates
  // Once we have settings, keep showing the form even during updates
  if (!settings) {
    return <div>{getSuiteCoreTranslation(SuiteCoreStringKey.Common_Loading)}...</div>;
  }

  // Only pass TOTP props when totpAvailable is true, authService is available, and totpEnabled has been fetched
  const totpProps = totpAvailable && authService && totpEnabled !== undefined
    ? {
        totpEnabled,
        onTotpSetup: handleTotpSetup,
        onTotpConfirm: handleTotpConfirm,
        onTotpDisable: handleTotpDisable,
        onTotpReset: handleTotpReset,
      }
    : {};

  return (
    <UserSettingsForm
      initialValues={settings}
      onSubmit={handleSubmit}
      languages={languages}
      {...totpProps}
      {...componentProps}
    />
  );
};
