import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBackupCodes } from '../../src/hooks/useBackupCodes';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';

// Mock the services
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
  })),
}));

describe('useBackupCodes', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SuiteConfigProvider baseUrl="https://api.test.com">
      {children}
    </SuiteConfigProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null backup codes remaining when no initial count provided', async () => {
    mockGet.mockResolvedValue({ data: { codeCount: 0 } });
    const { result } = renderHook(() => useBackupCodes(), { wrapper });

    // Initially loading
    expect(result.current.backupCodesRemaining).toBeNull();
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBeNull();
  });

  it('initializes with provided initial code count', () => {
    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 5 }), { wrapper });

    expect(result.current.backupCodesRemaining).toBe(5);
  });

  it('fetches backup code count on mount when no initial count', async () => {
    mockGet.mockResolvedValue({ data: { codeCount: 3 } });

    const { result } = renderHook(() => useBackupCodes(), { wrapper });

    await waitFor(() => {
      expect(result.current.backupCodesRemaining).toBe(3);
    });

    expect(mockGet).toHaveBeenCalledWith('/user/backup-codes');
  });

  it('does not fetch when initial count is provided', async () => {
    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 5 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('sets backup codes to 0 on fetch error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useBackupCodes(), { wrapper });

    await waitFor(() => {
      expect(result.current.backupCodesRemaining).toBe(0);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('generates backup codes with password', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Backup codes generated',
        backupCodes: ['code1', 'code2', 'code3'],
      },
    });

    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 0 }), { wrapper });

    let codes: string[] = [];
    await act(async () => {
      const response = await result.current.generateBackupCodes('password123');
      codes = response.backupCodes;
    });

    expect(mockPost).toHaveBeenCalledWith('/user/backup-codes', {
      password: 'password123',
    });
    expect(codes).toEqual(['code1', 'code2', 'code3']);
  });

  it('generates backup codes with mnemonic', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Backup codes generated',
        backupCodes: ['code1', 'code2'],
      },
    });

    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 0 }), { wrapper });

    await act(async () => {
      await result.current.generateBackupCodes(undefined, 'word1 word2 word3');
    });

    expect(mockPost).toHaveBeenCalledWith('/user/backup-codes', {
      mnemonic: 'word1 word2 word3',
    });
  });

  it('generates backup codes with both password and mnemonic', async () => {
    mockPost.mockResolvedValue({
      data: {
        message: 'Success',
        backupCodes: ['code1'],
      },
    });

    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 0 }), { wrapper });

    await act(async () => {
      await result.current.generateBackupCodes('password123', 'mnemonic words');
    });

    expect(mockPost).toHaveBeenCalledWith('/user/backup-codes', {
      password: 'password123',
      mnemonic: 'mnemonic words',
    });
  });

  it('throws error on generate failure', async () => {
    mockPost.mockRejectedValue(new Error('Generation failed'));

    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 0 }), { wrapper });

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await result.current.generateBackupCodes('password123');
      } catch (err) {
        caughtError = err as Error;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe('Generation failed');
    
    // Error state should also be set
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it('refreshes code count', async () => {
    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 5 }), { wrapper });

    expect(result.current.backupCodesRemaining).toBe(5);

    mockGet.mockResolvedValueOnce({ data: { codeCount: 3 } });

    await act(async () => {
      await result.current.refreshCodeCount();
    });

    await waitFor(() => {
      expect(result.current.backupCodesRemaining).toBe(3);
    });
    expect(mockGet).toHaveBeenCalledWith('/user/backup-codes');
  });

  it('sets isLoading correctly during operations', async () => {
    mockPost.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { backupCodes: [] } }), 100))
    );

    const { result } = renderHook(() => useBackupCodes({ initialCodeCount: 0 }), { wrapper });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.generateBackupCodes('password');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('only fetches once on mount', async () => {
    mockGet.mockResolvedValue({ data: { codeCount: 5 } });

    const { result, rerender } = renderHook(() => useBackupCodes(), { wrapper });

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.backupCodesRemaining).toBe(5);
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockGet.mock.calls.length;

    rerender();
    rerender();

    // Should not fetch again after rerender
    expect(mockGet.mock.calls.length).toBe(initialCallCount);
  });
});
