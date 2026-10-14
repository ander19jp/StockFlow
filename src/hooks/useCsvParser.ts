import Papa from 'papaparse';
import type { InventoryItem } from '../types/inventory';
import { DEFAULT_ALERT_LINE } from '../utils/stockAlert';

type RawInventoryRow = Record<string, string | number | undefined>;

const headerCandidates = {
  code: ['品番（SKU）', '品番', 'SKUコード', '商品コード', 'sku', 'SKU', 'code', 'product_code'],
  name: ['商品名', 'name', 'product_name'],
  variant: ['バリエーション', 'variant', 'variation'],
  category: ['カテゴリ', 'カテゴリー', 'category'],
  price: ['販売価格', '売価', '通常価', '価格', 'price', 'selling_price'],
  stock: ['販売可能数', '在庫数', '在庫', 'stock', 'quantity'],
  reorderPoint: ['発注点', 'アラート閾値', 'reorder_point', 'threshold'],
};

// Shopifyなどで単一バリエーション商品に付く既定のバリエーション名
const defaultVariantLabels = new Set(['defaulttitle']);

const ignorableParseErrorCodes = new Set(['TooFewFields', 'TooManyFields']);

const excelFilePattern = /\.(xlsx|xlsm|xls)$/i;

const normalizeHeader = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, '').toLowerCase();

const readFields = (row: RawInventoryRow, candidates: string[]) => {
  const entries = Object.entries(row);
  const normalizedCandidates = candidates.map(normalizeHeader);

  return normalizedCandidates
    .map((candidate) => entries.find(([key]) => normalizeHeader(key) === candidate)?.[1])
    .filter((value): value is string | number => value !== undefined);
};

// 候補の並び順を優先度として扱う（販売可能数と在庫数が両方ある場合は販売可能数を採用）
const readField = (row: RawInventoryRow, candidates: string[]) => readFields(row, candidates)[0];

const composeName = (name: string, variant: string) =>
  !variant || defaultVariantLabels.has(normalizeHeader(variant)) ? name : `${name} / ${variant}`;

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
      const baseName = String(readField(row, headerCandidates.name) ?? '').trim();
      const variant = String(readField(row, headerCandidates.variant) ?? '').trim();
      const name = baseName ? composeName(baseName, variant) : '';
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

  return toValidInventoryItems(result.data, previousItems, defaultReorderPoint);
};

const toValidInventoryItems = (
  rows: RawInventoryRow[],
  previousItems: InventoryItem[],
  defaultReorderPoint: number,
) => {
  const items = toInventoryItems(rows, previousItems, defaultReorderPoint);

  if (items.length === 0) {
    throw new Error('有効な商品行が見つかりませんでした。商品コードと商品名を確認してください。');
  }

  return items;
};

const toCellValue = (value: unknown): string | number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? value : String(value);
};

const findHeaderRowIndex = (rows: unknown[][]) => {
  const codeHeaders = headerCandidates.code.map(normalizeHeader);

  return rows.findIndex((row) =>
    row.some((cell) => typeof cell === 'string' && codeHeaders.includes(normalizeHeader(cell))),
  );
};

const brokenWorkbookMessage =
  'Excelファイルを読み込めませんでした。ファイルが壊れているか、ダウンロードが途中で止まっている可能性があります。';

// xlsxはZIP形式。末尾の終端レコードが無い（途中で切れた）ファイルはSheetJSが応答しなくなるため事前に弾く
const isTruncatedZip = (bytes: Uint8Array) => {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;

  if (!isZip) {
    return false;
  }

  const searchStart = Math.max(0, bytes.length - 65557);

  for (let index = bytes.length - 22; index >= searchStart; index -= 1) {
    if (bytes[index] === 0x50 && bytes[index + 1] === 0x4b && bytes[index + 2] === 0x05 && bytes[index + 3] === 0x06) {
      return false;
    }
  }

  return true;
};

export const parseInventoryWorkbook = async (
  buffer: ArrayBuffer,
  previousItems: InventoryItem[] = [],
  defaultReorderPoint = DEFAULT_ALERT_LINE,
) => {
  // Excel取込時のみ読み込み、初期表示のバンドルを軽く保つ
  const { read, utils } = await import('xlsx');
  const bytes = new Uint8Array(buffer);

  if (isTruncatedZip(bytes)) {
    throw new Error(brokenWorkbookMessage);
  }

  let workbook: ReturnType<typeof read>;

  try {
    workbook = read(bytes, { type: 'array' });
  } catch {
    throw new Error(brokenWorkbookMessage);
  }

  for (const sheetName of workbook.SheetNames) {
    const rows = utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    });
    const headerIndex = findHeaderRowIndex(rows);

    if (headerIndex < 0) {
      continue;
    }

    const headers = rows[headerIndex].map((cell) => String(cell ?? '').trim());
    const records = rows.slice(headerIndex + 1).map((row) =>
      headers.reduce<RawInventoryRow>((record, header, index) => {
        if (header) {
          record[header] = toCellValue(row[index]);
        }

        return record;
      }, {}),
    );

    return toValidInventoryItems(records, previousItems, defaultReorderPoint);
  }

  throw new Error('在庫シートが見つかりませんでした。「品番（SKU）」などの商品コード列があるか確認してください。');
};

export const isExcelFile = (file: File) => excelFilePattern.test(file.name);

export const parseInventoryCsvFile = (
  file: File,
  previousItems: InventoryItem[] = [],
  defaultReorderPoint = DEFAULT_ALERT_LINE,
) =>
  new Promise<InventoryItem[]>((resolve, reject) => {
    file
      .arrayBuffer()
      .then((buffer) =>
        resolve(
          isExcelFile(file)
            ? parseInventoryWorkbook(buffer, previousItems, defaultReorderPoint)
            : parseInventoryCsvText(decodeFileBuffer(buffer), previousItems, defaultReorderPoint),
        ),
      )
      .catch((error) => reject(error));
  });

export const useCsvParser = () => ({
  parseFile: parseInventoryCsvFile,
  parseText: parseInventoryCsvText,
});
