import { useState } from "react";

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading ${key} from ${storage}:`, error);
      return defaultValue;
    }
  });

  const setPersistentState = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      storage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting ${key} in ${storage}:`, error);
    }
  };

  return [state, setPersistentState];
}

export function useSessionStorage<T>(key: string, defaultValue: T) {
  return usePersistentState(key, defaultValue, sessionStorage);
}

export function useLocalStorage<T>(key: string, defaultValue: T) {
  return usePersistentState(key, defaultValue, localStorage);
}
