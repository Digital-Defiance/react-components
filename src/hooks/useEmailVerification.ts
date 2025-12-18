import {
  getSuiteCoreTranslation,
  SuiteCoreStringKey,
} from '@digitaldefiance/suite-core-lib';
import { useMemo, useState } from 'react';
import { useSuiteConfig } from '../contexts';
import { createAuthenticatedApiClient } from '../services';

export interface UseEmailVerificationResult {
  isVerifying: boolean;
  error: Error | null;
  verifyEmail: (
    token: string
  ) => Promise<{ success: boolean; message?: string }>;
}

export const useEmailVerification = (): UseEmailVerificationResult => {
  const { baseUrl } = useSuiteConfig();
  const api = useMemo(() => createAuthenticatedApiClient(baseUrl), [baseUrl]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const result = await api.post<{ message: string }>('/verify-email', {
        token: verificationToken,
      });
      return { success: true, message: result.data.message };
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosError.response?.data?.message ||
        getSuiteCoreTranslation(SuiteCoreStringKey.Error_VerificationFailed);
      const error = new Error(errorMessage);
      setError(error);
      return { success: false, message: errorMessage };
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    isVerifying,
    error,
    verifyEmail,
  };
};
