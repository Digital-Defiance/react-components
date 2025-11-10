import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useExpiringValue } from '../../src/hooks/useExpiringValue';
import { localStorageMock } from '../setup';

describe('useExpiringValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with undefined value', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60));
    expect(result.current.value).toBeUndefined();
    expect(result.current.isActive).toBe(false);
  });

  it('should set value and expire after duration', () => {
    const { result } = renderHook(() => useExpiringValue<string>(2));

    act(() => {
      result.current.setValue('test value', 2);
    });

    expect(result.current.value).toBe('test value');
    expect(result.current.isActive).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.value).toBeUndefined();
    expect(result.current.isActive).toBe(false);
  });

  it('should use custom duration when provided', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60));

    act(() => {
      result.current.setValue('test', 1);
    });

    expect(result.current.value).toBe('test');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.value).toBeUndefined();
  });

  it('should save duration to localStorage when saveToStorage is true', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60, 'testKey'));

    act(() => {
      result.current.setValue('test', 120, true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', '120');
  });

  it('should not save to localStorage when saveToStorage is false', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60, 'testKey'));

    act(() => {
      result.current.setValue('test', 120, false);
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('testKey', '120');
  });

  it('should load duration from localStorage on init', () => {
    localStorageMock.getItem.mockReturnValue('180');
    const { result } = renderHook(() => useExpiringValue<string>(60, 'testKey'));

    act(() => {
      result.current.setValue('test');
    });

    expect(result.current.value).toBe('test');

    act(() => {
      jest.advanceTimersByTime(179000);
    });

    expect(result.current.value).toBe('test');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.value).toBeUndefined();
  });

  it('should clear value and timer', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60));

    act(() => {
      result.current.setValue('test', 60);
    });

    expect(result.current.value).toBe('test');

    act(() => {
      result.current.clearValue();
    });

    expect(result.current.value).toBeUndefined();
    expect(result.current.isActive).toBe(false);
  });

  it('should calculate remaining time correctly', () => {
    const { result } = renderHook(() => useExpiringValue<string>(10));

    act(() => {
      result.current.setValue('test', 10);
    });

    expect(result.current.getRemainingTime()).toBe(10);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.getRemainingTime()).toBe(7);

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(result.current.getRemainingTime()).toBe(0);
  });

  it('should return 0 remaining time when no timer is active', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60));
    expect(result.current.getRemainingTime()).toBe(0);
  });

  it('should clear previous timer when setting new value', () => {
    const { result } = renderHook(() => useExpiringValue<string>(5));

    act(() => {
      result.current.setValue('first', 5);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      result.current.setValue('second', 5);
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(result.current.value).toBe('second');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.value).toBeUndefined();
  });

  it('should return cleanup function from setValue', () => {
    const { result } = renderHook(() => useExpiringValue<string>(60));

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.setValue('test', 60);
    });

    expect(result.current.value).toBe('test');
    expect(result.current.isActive).toBe(true);

    act(() => {
      cleanup?.();
    });

    // Cleanup only clears the timer, not the value
    expect(result.current.isActive).toBe(false);
  });
});
