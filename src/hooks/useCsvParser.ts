import Papa from 'papaparse';
import type { InventoryItem } from '../types/inventory';
import { DEFAULT_ALERT_LINE } from '../utils/stockAlert';

type RawInventoryRow = Record<string, string | number | undefined>;

const headerCandidates = {
  code: ['SKUコード', '商品コード', 'sku', 'SKU', 'code', 'product_code'],
  name: ['商品名', 'name', 'product_name'],
  category: ['カテゴリ', 'カテゴリー', 'category'],
  price: ['販売価格', '売価', '通常価', '価格', 'price', 'selling_price'],
  stock: ['在庫数', '在庫', 'stock', 'quantity'],
  reorderPoint: ['発注点', 'アラート閾値', 'reorder_point', 'threshold'],
};

const ignorableParseErrorCodes = new Set(['TooFewFields', 'TooManyFields']);

const normalizeHeader = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

const readField = (row: RawInventoryRow, candidates: string[]) => {
  const entries = Object.entries(row);
  const normalizedCandidates = candidates.map(normalizeHeader);
  const match = entries.find(([key]) => normalizedCandidates.includes(normalizeHeader(key)));

  return match?.[1];
};

const readFields = (row: RawInventoryRow, candidates: string[]) => {
  const entries = Object.entries(row);
  const normalizedCandidates = candidates.map(normalizeHeader);

  return normalizedCandidates
    .map((candidate) => entries.find(([key]) => normalizeHeader(key) === candidate)?.[1])
    .filter((value): value is string | number => value !== undefined);
};

const parseNumber = (value: string | number | undefined, fallback = 0) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = value.replace(/[,\s円]/g, '');
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOptionalNumber = (value: string | number | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const cleaned = value.replace(/[,\s円]/g, '');
  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const readPrice = (row: RawInventoryRow) => {
  const preferredPrice = parseOptionalNumber(readField(row, ['販売価格', '売価', 'price', 'selling_price', '価格']));

  if (preferredPrice !== undefined) {
    return preferredPrice;
  }

  const candidates = readFields(row, headerCandidates.price)
    .map(parseOptionalNumber)
    .filter((value): value is number => value !== undefined);

  return candidates.find((value) => value > 0) ?? candidates[0] ?? 0;
};

const getBlockingParseError = (errors: Array<{ type: string; code: string; message: string }>) =>
  errors.find((error) => error.type !== 'FieldMismatch' || !ignorableParseErrorCodes.has(error.code));

const decodeFileBuffer = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    const japaneseEncodingLabels = ['shift_jis', 'windows-31j', 'ms932'];

    for (const label of japaneseEncodingLabels) {
      try {
        return new TextDecoder(label).decode(bytes);
      } catch {
        // Try the next browser-supported label.
      }
    }
  }

  return new TextDecoder().decode(bytes);
};

const toInventoryItems = (
  rows: RawInventoryRow[],
  previousItems: InventoryItem[],
  defaultReorderPoint: number,
): InventoryItem[] => {
  const previousByCode = new Map(previousItems.map((item) => [item.code, item]));
  const importedAt = new Date().toISOString();

  return rows
    .map<InventoryItem | null>((row) => {
      const code = String(readField(row, headerCandidates.code) ?? '').trim();
      const name = String(readField(row, headerCandidates.name) ?? '').trim();
      const category = String(readField(row, headerCandidates.category) ?? '未分類').trim() || '未分類';
      const price = readPrice(row);
      const stock = parseNumber(readField(row, headerCandidates.stock));
      const reorderPoint = parseNumber(
        readField(row, headerCandidates.reorderPoint),
        defaultReorderPoint || DEFAULT_ALERT_LINE,
      );
      const previous = previousByCode.get(code);

      if (!code || !name) {
        return null;
      }

      return {
        code,
        name,
        category,
        price,
        stock,
        reorderPoint,
        stockDiff: previous ? stock - previous.stock : undefined,
        priceDiff: previous ? price - previous.price : undefined,
        comment: previous?.comment,
        importedAt,
      };
    })
    .filter((item): item is InventoryItem => item !== null);
};

export const parseInventoryCsvText = (
  csvText: string,
  previousItems: InventoryItem[] = [],
  defaultReorderPoint = DEFAULT_ALERT_LINE,
) => {
  const result = Papa.parse<RawInventoryRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    const firstError = getBlockingParseError(result.errors);

    if (firstError) {
      throw new Error(`CSV解析に失敗しました: ${firstError.message}`);
    }
  }

  const items = toInventoryItems(result.data, previousItems, defaultReorderPoint);

  if (items.length === 0) {
    throw new Error('有効な商品行が見つかりませんでした。商品コードと商品名を確認してください。');
  }

  return items;
};

export const parseInventoryCsvFile = (
  file: File,
  previousItems: InventoryItem[] = [],
  defaultReorderPoint = DEFAULT_ALERT_LINE,
) =>
  new Promise<InventoryItem[]>((resolve, reject) => {
    file
      .arrayBuffer()
      .then((buffer) => decodeFileBuffer(buffer))
      .then((csvText) => resolve(parseInventoryCsvText(csvText, previousItems, defaultReorderPoint)))
      .catch((error) => reject(error));
  });

export const useCsvParser = () => ({
  parseFile: parseInventoryCsvFile,
  parseText: parseInventoryCsvText,
});
