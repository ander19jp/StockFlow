import type { InventoryItem, InventorySummary, StockStatus } from '../types/inventory';

export const DEFAULT_ALERT_LINE = 20;

export const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat('ja-JP').format(value);

export const getAlertThreshold = (_item: InventoryItem, alertLine = DEFAULT_ALERT_LINE) => {
  const globalAlertLine = Number.isFinite(alertLine) ? alertLine : DEFAULT_ALERT_LINE;

  return globalAlertLine;
};

export const getStockStatus = (item: InventoryItem, alertLine = DEFAULT_ALERT_LINE): StockStatus => {
  if (item.stock <= 0) {
    return 'out';
  }

  return item.stock <= getAlertThreshold(item, alertLine) ? 'low' : 'ok';
};

export const getStatusLabel = (status: StockStatus) => {
  if (status === 'out') {
    return '在庫切れ';
  }

  if (status === 'low') {
    return '残りわずか';
  }

  return '在庫あり';
};

export const isAlertItem = (item: InventoryItem, alertLine = DEFAULT_ALERT_LINE) =>
  getStockStatus(item, alertLine) !== 'ok';

export const getInventorySummary = (
  items: InventoryItem[],
  alertLine = DEFAULT_ALERT_LINE,
): InventorySummary => {
  return items.reduce<InventorySummary>(
    (summary, item) => {
      const status = getStockStatus(item, alertLine);

      summary.totalProducts += 1;
      summary.totalValue += item.price * item.stock;

      if (status === 'out') {
        summary.outOfStock += 1;
      } else if (status === 'low') {
        summary.lowStock += 1;
      }

      return summary;
    },
    {
      totalProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      totalValue: 0,
    },
  );
};
