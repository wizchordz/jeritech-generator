import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AamvaFields, buildAamvaString, defaultAamvaFields, STATE_IIN } from '@/constants/aamva';

const STORAGE_KEY = '@aamva_fields_v1';

interface BarcodeContextValue {
  fields: AamvaFields;
  setField: <K extends keyof AamvaFields>(key: K, value: AamvaFields[K]) => void;
  resetFields: () => void;
  aamvaString: string;
  isLoaded: boolean;
}

const BarcodeContext = createContext<BarcodeContextValue | null>(null);

export function BarcodeProvider({ children }: { children: React.ReactNode }) {
  const [fields, setFields] = useState<AamvaFields>(defaultAamvaFields);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AamvaFields>;
          setFields((prev) => ({ ...prev, ...saved }));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setField = useCallback(<K extends keyof AamvaFields>(key: K, value: AamvaFields[K]) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-populate IIN when state changes
      if (key === 'state' && typeof value === 'string' && STATE_IIN[value.toUpperCase()]) {
        next.iin = STATE_IIN[value.toUpperCase()];
      }

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetFields = useCallback(() => {
    setFields(defaultAamvaFields);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const aamvaString = buildAamvaString(fields);

  return (
    <BarcodeContext.Provider value={{ fields, setField, resetFields, aamvaString, isLoaded }}>
      {children}
    </BarcodeContext.Provider>
  );
}

export function useBarcodeContext(): BarcodeContextValue {
  const ctx = useContext(BarcodeContext);
  if (!ctx) throw new Error('useBarcodeContext must be used inside BarcodeProvider');
  return ctx;
}
