/**
 * Custom React hooks barrel file
 * Export all custom hooks from this file
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage async operations with loading and error states
 */
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the function is not recreated on each render.
  const execute = useCallback(async (): Promise<void> => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
    } catch (err) {
      setError(err as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  // Call execute if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { execute, status, value, error };
}

/**
 * Hook to manage a boolean state with toggle function
 */
export function useToggle(initialState = false): [boolean, () => void] {
  const [state, setState] = useState<boolean>(initialState);
  const toggle = (): void => setState(prevState => !prevState);
  
  return [state, toggle];
}

/**
 * Hook to manage a value in AsyncStorage with automatic JSON parsing
 * Note: This is a simplified version for React Native using AsyncStorage
 */
export function useAsyncStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load initial value from AsyncStorage
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const item = await AsyncStorage.default.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error('Error loading from AsyncStorage:', error);
      }
    };
    
    loadStoredValue();
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to AsyncStorage.
  const setValue = (value: T): void => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save to state
      setStoredValue(valueToStore);
      // Save to AsyncStorage
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      });
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
    }
  };

  return [storedValue, setValue];
}