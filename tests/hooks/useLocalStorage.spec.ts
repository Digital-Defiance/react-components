import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';
import { localStorageMock } from '../setup';

const _mockGetValue = jest.fn();
const _mockSetValue = jest.fn();

jest.mock('@digitaldefiance/suite-core-lib', () => ({
  LocalStorageManager: {
    getValue: jest.fn(),
    setValue: jest.fn(),
  },
}));

import { LocalStorageManager } from '@digitaldefiance/suite-core-lib';
const mockedGetValue = LocalStorageManager.getValue as jest.MockedFunction<
  typeof LocalStorageManager.getValue
>;
const mockedSetValue = LocalStorageManager.setValue as jest.MockedFunction<
  typeof LocalStorageManager.setValue
>;

describe('useLocalStorage', () => {
  beforeEach(() => {
    mockedGetValue.mockClear();
    mockedSetValue.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  it('should initialize with default value when no stored value exists', () => {
    mockedGetValue.mockReturnValue('default');
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should initialize with stored value when it exists', () => {
    mockedGetValue.mockReturnValue('stored');
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('should update value and localStorage', () => {
    mockedGetValue.mockReturnValue('initial');
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(mockedSetValue).toHaveBeenCalledWith('testKey', 'updated');
  });

  it('should work with number values', () => {
    mockedGetValue.mockReturnValue(0);
    const { result } = renderHook(() => useLocalStorage('numberKey', 0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
    expect(mockedSetValue).toHaveBeenCalledWith('numberKey', 42);
  });

  it('should work with object values', () => {
    mockedGetValue.mockReturnValue({ count: 0 });
    const { result } = renderHook(() =>
      useLocalStorage('objectKey', { count: 0 })
    );

    act(() => {
      result.current[1]({ count: 5 });
    });

    expect(result.current[0]).toEqual({ count: 5 });
    expect(mockedSetValue).toHaveBeenCalledWith('objectKey', { count: 5 });
  });

  it('should work with array values', () => {
    mockedGetValue.mockReturnValue([]);
    const { result } = renderHook(() =>
      useLocalStorage<string[]>('arrayKey', [])
    );

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
    expect(mockedSetValue).toHaveBeenCalledWith('arrayKey', ['a', 'b', 'c']);
  });

  it('should handle multiple updates', () => {
    mockedGetValue.mockReturnValue(0);
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1](1);
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](2);
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      result.current[1](3);
    });
    expect(result.current[0]).toBe(3);
  });
});
