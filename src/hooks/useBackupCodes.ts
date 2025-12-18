import {
  SuiteCoreStringKey,
  TranslatableSuiteError,
} from '@digitaldefiance/suite-core-lib';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSuiteConfig } from '../contexts';
import { createAuthenticatedApiClient } from '../services';

export interface UseBackupCodesOptions {
  initialCodeCount?: number | null;
}

export interface UseBackupCodesResult {
  backupCodesRemaining: number | null;
  isLoading: boolean;
  error: Error | null;
  generateBackupCodes: (
    password?: string,
    mnemonic?: string
  ) => Promise<{
    message: string;
    backupCodes: string[];
  }>;
  refreshCodeCount: () => Promise<void>;
}

export const useBackupCodes = (
  options: UseBackupCodesOptions = {}
): UseBackupCodesResult => {
  const { baseUrl } = useSuiteConfig();
  const [backupCodesRemaining, setBackupCodesRemaining] = useState<
    number | null
  >(options.initialCodeCount ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestedOnMountRef = useRef(false);
  const api = useMemo(() => createAuthenticatedApiClient(baseUrl), [baseUrl]);

  const refreshCodeCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<{ codeCount: number }>('/user/backup-codes');
      if (result?.data?.codeCount !== undefined) {
        setBackupCodesRemaining(result.data.codeCount);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new TranslatableSuiteError(
              SuiteCoreStringKey.BackupCodes_FailedToFetch
            )
      );
      setBackupCodesRemaining(0);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (requestedOnMountRef.current) return;
    if (backupCodesRemaining !== null) return;

    requestedOnMountRef.current = true;
    refreshCodeCount();
  }, [backupCodesRemaining, refreshCodeCount]);

  const generateBackupCodes = async (password?: string, mnemonic?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post<{ message: string; backupCodes: string[] }>(
        '/user/backup-codes',
        {
          ...(password ? { password } : {}),
          ...(mnemonic ? { mnemonic } : {}),
        }
      );
      return {
        message: result.data.message,
        backupCodes: result.data.backupCodes,
      };
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new TranslatableSuiteError(
              SuiteCoreStringKey.BackupCodes_FailedToGenerate
            );
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    backupCodesRemaining,
    isLoading,
    error,
    generateBackupCodes,
    refreshCodeCount,
  };
};
