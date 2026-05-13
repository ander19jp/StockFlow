import type { InventoryItem } from '../types/inventory';
import { getAlertThreshold, getStatusLabel, getStockStatus } from './stockAlert';

const escapeCsvValue = (value: string | number | undefined) => {
  const text = value === undefined ? '' : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

export const createInventoryCsv = (items: InventoryItem[], alertLine: number) => {
  const headers = [
    '商品コード',
    '商品名',
    'カテゴリ',
    '販売価格',
    '在庫数',
    '発注点',
    '判定ライン',
    '在庫差分',
    'ステータス',
    'コメント',
  ];

  const rows = items.map((item) => [
    item.code,
    item.name,
    item.category,
    item.price,
    item.stock,
    item.reorderPoint,
    getAlertThreshold(item, alertLine),
    item.stockDiff,
    getStatusLabel(getStockStatus(item, alertLine)),
    item.comment,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
};

export const downloadInventoryCsv = (items: InventoryItem[], filename: string, alertLine: number) => {
  const csv = `\uFEFF${createInventoryCsv(items, alertLine)}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};
