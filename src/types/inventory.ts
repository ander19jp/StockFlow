export type StockStatus = 'out' | 'low' | 'ok';

export type SortKey = 'code' | 'name' | 'category' | 'price' | 'stock';

export type SortDirection = 'asc' | 'desc';

export interface InventoryItem {
  code: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderPoint: number;
  stockDiff?: number;
  priceDiff?: number;
  comment?: string;
  importedAt: string;
}

export interface InventorySummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
}

export interface FilterState {
  search: string;
  category: string;
  alertOnly: boolean;
}

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}
