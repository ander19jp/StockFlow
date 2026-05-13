import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InventoryItem, SortKey, SortState } from '../types/inventory';
import { formatNumber, formatYen } from '../utils/stockAlert';
import StockBadge from './StockBadge';

interface InventoryTableProps {
  items: InventoryItem[];
  sort: SortState;
  page: number;
  pageSize: number;
  alertLine: number;
  isLoading: boolean;
  onSortChange: (sort: SortState) => void;
  onPageChange: (page: number) => void;
  onItemClick: (item: InventoryItem) => void;
}

const sortableColumns: Partial<Record<SortKey, string>> = {
  price: '販売価格',
  stock: '在庫数',
};

const getDiffClassName = (diff: number | undefined) => {
  if (diff === undefined || diff === 0) {
    return 'text-slate-500';
  }

  return diff > 0 ? 'text-emerald-300' : 'text-red-300';
};

const renderDiff = (diff: number | undefined) => {
  if (diff === undefined) {
    return '初回';
  }

  if (diff === 0) {
    return '±0';
  }

  return `${diff > 0 ? '+' : ''}${formatNumber(diff)}`;
};

function SortButton({
  column,
  sort,
  onSortChange,
}: {
  column: SortKey;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}) {
  const isActive = sort.key === column;
  const direction = isActive && sort.direction === 'asc' ? 'desc' : 'asc';
  const Icon = !isActive ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left font-semibold text-slate-300 hover:text-cyan-200"
      onClick={() => onSortChange({ key: column, direction })}
    >
      {sortableColumns[column]}
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

export default function InventoryTable({
  items,
  sort,
  page,
  pageSize,
  alertLine,
  isLoading,
  onSortChange,
  onPageChange,
  onItemClick,
}: InventoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);
  const rangeStart = items.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, items.length);

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/50">
      <div className="flex flex-col gap-2 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Inventory Table</p>
          <h2 className="mt-1 text-lg font-semibold text-white">商品一覧</h2>
        </div>
        <p className="text-sm text-slate-400">
          {formatNumber(rangeStart)}-{formatNumber(rangeEnd)} / {formatNumber(items.length)} 件
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[940px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">商品コード</th>
              <th className="px-4 py-3 font-semibold">商品名</th>
              <th className="px-4 py-3 font-semibold">カテゴリ</th>
              <th className="px-4 py-3">
                <SortButton column="price" sort={sort} onSortChange={onSortChange} />
              </th>
              <th className="px-4 py-3">
                <SortButton column="stock" sort={sort} onSortChange={onSortChange} />
              </th>
              <th className="px-4 py-3 font-semibold">差分</th>
              <th className="px-4 py-3 font-semibold">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="skeleton h-5 w-full max-w-32 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleItems.map((item) => (
                  <tr
                    key={item.code}
                    className="cursor-pointer bg-slate-950/20 transition hover:bg-cyan-500/10"
                    onClick={() => onItemClick(item)}
                  >
                    <td className="px-4 py-4 font-mono text-xs font-medium text-cyan-200">{item.code}</td>
                    <td className="px-4 py-4 font-semibold text-slate-100">{item.name}</td>
                    <td className="px-4 py-4 text-slate-300">{item.category}</td>
                    <td className="px-4 py-4 font-mono text-slate-100">{formatYen(item.price)}</td>
                    <td className="px-4 py-4 font-mono text-slate-100">{formatNumber(item.stock)}</td>
                    <td className={`px-4 py-4 font-mono text-xs font-semibold ${getDiffClassName(item.stockDiff)}`}>
                      {renderDiff(item.stockDiff)}
                    </td>
                    <td className="px-4 py-4">
                      <StockBadge item={item} alertLine={alertLine} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && visibleItems.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-slate-400">条件に一致する商品がありません。</div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">1ページ {pageSize} 件</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            前へ
          </button>
          <span className="min-w-24 text-center font-mono text-sm text-slate-400">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            次へ
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
