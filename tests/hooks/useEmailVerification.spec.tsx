import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEmailVerification } from '../../src/hooks/useEmailVerification';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';

// Mock the services
const mockPost = jest.fn();

jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    post: mockPost,
  })),
}));

describe('useEmailVerification', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SuiteConfigProvider baseUrl="https://api.test.com">
      {children}
    </SuiteConfigProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    expect(result.current.isVerifying).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.verifyEmail).toBeInstanceOf(Function);
  });

  it('verifies email successfully', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Email verified successfully' },
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyEmail('test-token-123');
    });

    expect(response.success).toBe(true);
    expect(response.message).toBe('Email verified successfully');
    expect(mockPost).toHaveBeenCalledWith('/verify-email', { token: 'test-token-123' });
    expect(result.current.error).toBeNull();
  });

  it('handles verification failure', async () => {
    mockPost.mockRejectedValue({
      response: {
        data: { message: 'Invalid token' },
      },
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyEmail('invalid-token');
    });

    expect(response.success).toBe(false);
    expect(response.message).toBe('Invalid token');
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid token');
  });

  it('handles network errors', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyEmail('test-token');
    });

    expect(response.success).toBe(false);
    expect(response.message).toBe('Verification failed');
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('sets isVerifying during verification', async () => {
    mockPost.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { message: 'Success' } }), 100))
    );

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    expect(result.current.isVerifying).toBe(false);

    act(() => {
      result.current.verifyEmail('test-token');
    });

    expect(result.current.isVerifying).toBe(true);

    await waitFor(() => {
      expect(result.current.isVerifying).toBe(false);
    });
  });

  it('clears error on successful verification', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'First error' } },
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    // First attempt fails
    await act(async () => {
      await result.current.verifyEmail('bad-token');
    });

    expect(result.current.error).toBeInstanceOf(Error);

    // Second attempt succeeds
    mockPost.mockResolvedValueOnce({
      data: { message: 'Success' },
    });

    await act(async () => {
      await result.current.verifyEmail('good-token');
    });

    expect(result.current.error).toBeNull();
  });

  it('handles empty token', async () => {
    mockPost.mockResolvedValue({
      data: { message: 'Token required' },
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    await act(async () => {
      await result.current.verifyEmail('');
    });

    expect(mockPost).toHaveBeenCalledWith('/verify-email', { token: '' });
  });

  it('handles response without message', async () => {
    mockPost.mockResolvedValue({
      data: {},
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyEmail('test-token');
    });

    expect(response.success).toBe(true);
    expect(response.message).toBeUndefined();
  });

  it('handles error without response data', async () => {
    mockPost.mockRejectedValue({
      message: 'Request failed',
    });

    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyEmail('test-token');
    });

    expect(response.success).toBe(false);
    expect(response.message).toBe('Verification failed');
  });

  it('can verify multiple tokens sequentially', async () => {
    const { result } = renderHook(() => useEmailVerification(), { wrapper });

    mockPost.mockResolvedValueOnce({
      data: { message: 'First verified' },
    });

    let firstResponse: any;
    await act(async () => {
      firstResponse = await result.current.verifyEmail('token1');
    });

    expect(firstResponse.success).toBe(true);
    expect(firstResponse.message).toBe('First verified');

    mockPost.mockResolvedValueOnce({
      data: { message: 'Second verified' },
    });

    let secondResponse: any;
    await act(async () => {
      secondResponse = await result.current.verifyEmail('token2');
    });

    expect(secondResponse.success).toBe(true);
    expect(secondResponse.message).toBe('Second verified');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});
