import { useCallback, useState } from 'react';

export interface TimerInfo {
  timeout: NodeJS.Timeout;
  startTime: number;
  durationMs: number;
}

export interface ExpiringValueReturn<T> {
  value: T | undefined;
  setValue: (newValue: T, durationSeconds?: number, saveToStorage?: boolean) => () => void;
  clearValue: () => void;
  getRemainingTime: () => number;
  isActive: boolean;
}

export function useExpiringValue<T>(
  defaultDurationSeconds: number,
  localStorageKey?: string
): ExpiringValueReturn<T> {
  const [value, _setValue] = useState<T | undefined>(undefined);
  const [timer, setTimer] = useState<TimerInfo | undefined>(undefined);
  const [durationSeconds, _setDurationSeconds] = useState<number>(() => {
    if (localStorageKey) {
      const stored = localStorage.getItem(localStorageKey);
      return stored ? parseInt(stored, 10) : defaultDurationSeconds;
    }
    return defaultDurationSeconds;
  });

  const getRemainingTime = useCallback((): number => {
    if (!timer) return 0;
    const elapsed = Date.now() - timer.startTime;
    const remaining = Math.max(0, timer.durationMs - elapsed);
    return Math.ceil(remaining / 1000);
  }, [timer]);

  const setValue = useCallback((newValue: T, customDurationSeconds?: number, saveToStorage?: boolean) => {
    const finalDurationSeconds = customDurationSeconds ?? durationSeconds;
    
    if (saveToStorage && customDurationSeconds !== undefined && localStorageKey) {
      _setDurationSeconds(customDurationSeconds);
      localStorage.setItem(localStorageKey, customDurationSeconds.toString());
    }
    
    _setValue(newValue);
    
    if (timer) {
      clearTimeout(timer.timeout);
    }
    
    const startTime = Date.now();
    const durationMs = finalDurationSeconds * 1000;
    const timeout = setTimeout(() => {
      _setValue(undefined);
      setTimer(undefined);
    }, durationMs);
    
    setTimer({ timeout, startTime, durationMs });
    
    return () => {
      clearTimeout(timeout);
      setTimer(undefined);
    };
  }, [durationSeconds, timer, localStorageKey]);

  const clearValue = useCallback(() => {
    if (timer) {
      clearTimeout(timer.timeout);
      setTimer(undefined);
    }
    _setValue(undefined);
  }, [timer]);

  const isActive = Boolean(timer && value !== undefined);

  return { value, setValue, clearValue, getRemainingTime, isActive };
}
