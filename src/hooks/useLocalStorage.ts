import { useCallback, useState } from 'react';
import { LocalStorageManager } from '@digitaldefiance/suite-core-lib';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return LocalStorageManager.getValue(key, defaultValue);
  });

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    LocalStorageManager.setValue(key, value);
  }, [key]);

  return [storedValue, setValue];
}
