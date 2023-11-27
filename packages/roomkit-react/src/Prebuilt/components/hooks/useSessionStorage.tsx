import { useState } from 'react';
import { useSessionStorage as useRawSessionStorage } from 'react-use';

export const useSessionStorage = <T,>(key: string, defaultPreference?: T) => {
  const [sessionStorageValue, setStorageValue] = useRawSessionStorage(key, defaultPreference);
  const [preference, setPreference] = useState(sessionStorageValue || defaultPreference);
  const changePreference = (value: T) => {
    setPreference(value);
    setStorageValue(value);
  };
  return [preference, changePreference];
};
