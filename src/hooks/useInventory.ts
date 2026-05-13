import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InventoryItem } from '../types/inventory';
import { DEFAULT_ALERT_LINE } from '../utils/stockAlert';
import { useCsvParser } from './useCsvParser';

const STORAGE_KEY = 'inventory-console-state';
const STORAGE_VERSION = 3;

interface StoredInventoryState {
  parserVersion?: number;
  items: InventoryItem[];
  alertLine: number;
  lastImportLabel: string;
}

const createEmptyState = (): StoredInventoryState => ({
  parserVersion: STORAGE_VERSION,
  items: [],
  alertLine: DEFAULT_ALERT_LINE,
  lastImportLabel: 'CSV未取込',
});

const readStoredState = (): StoredInventoryState => {
  if (typeof window === 'undefined') {
    return createEmptyState();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return createEmptyState();
  }

  try {
    const parsed = JSON.parse(stored) as StoredInventoryState;

    if (parsed.parserVersion !== STORAGE_VERSION) {
      return createEmptyState();
    }

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      alertLine: Number.isFinite(parsed.alertLine) ? parsed.alertLine : DEFAULT_ALERT_LINE,
      lastImportLabel: parsed.lastImportLabel || '保存データ',
    };
  } catch {
    return createEmptyState();
  }
};

export const useInventory = () => {
  const initialState = useMemo(readStoredState, []);
  const [items, setItems] = useState<InventoryItem[]>(initialState.items);
  const [alertLine, setAlertLine] = useState(initialState.alertLine);
  const [lastImportLabel, setLastImportLabel] = useState(initialState.lastImportLabel);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { parseFile } = useCsvParser();

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        parserVersion: STORAGE_VERSION,
        items,
        alertLine,
        lastImportLabel,
      }),
    );
  }, [alertLine, items, lastImportLabel]);

  const importFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        const parsedItems = await parseFile(file, items, alertLine);

        if (parsedItems.length === 0) {
          throw new Error('有効な商品行が見つかりませんでした。');
        }

        setItems(parsedItems);
        setLastImportLabel(`${file.name} / ${new Date().toLocaleString('ja-JP')}`);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'CSVの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    },
    [alertLine, items, parseFile],
  );

  const updateAlertLine = useCallback((value: number) => {
    const nextValue = Math.min(200, Math.max(1, Math.round(value)));
    setAlertLine(nextValue);
  }, []);

  const updateComment = useCallback((code: string, comment: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.code === code ? { ...item, comment } : item)),
    );
  }, []);

  return {
    items,
    alertLine,
    lastImportLabel,
    isLoading,
    error,
    importFile,
    updateAlertLine,
    updateComment,
  };
};
