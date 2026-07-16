import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AamvaFields, buildAamvaString, defaultAamvaFields, STATE_IIN, STATE_JURISDICTION_DATA } from '@/constants/aamva';

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

  // Load saved data on mount, then auto-correct IIN if it's stale
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AamvaFields>;
          setFields((prev) => {
            const merged = { ...prev, ...saved };
            // Auto-correct IIN whenever state is set — ensures that an
            // old stored IIN (from before an IIN table update) is always
            // replaced with the current correct value.
            const s = merged.state?.toUpperCase() ?? '';
            if (s && STATE_IIN[s]) {
              merged.iin = STATE_IIN[s];
            }
            return merged;
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setField = useCallback(<K extends keyof AamvaFields>(key: K, value: AamvaFields[K]) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-populate IIN + jurisdiction data when state changes
      if (key === 'state' && typeof value === 'string') {
        const s = value.toUpperCase();
        if (STATE_IIN[s]) next.iin = STATE_IIN[s];
        // Only auto-fill jurisdiction if the user hasn't customised it yet
        if (prev.jurisdictionData === '' || STATE_JURISDICTION_DATA[prev.state?.toUpperCase() ?? ''] === prev.jurisdictionData) {
          next.jurisdictionData = STATE_JURISDICTION_DATA[s] ?? '';
        }
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
