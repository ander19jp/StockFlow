import { Download, FileWarning, Search, SlidersHorizontal } from 'lucide-react';
import type { FilterState } from '../types/inventory';

interface FilterBarProps {
  filters: FilterState;
  categories: string[];
  alertLine: number;
  onFiltersChange: (filters: FilterState) => void;
  onAlertLineChange: (value: number) => void;
  onExportFiltered: () => void;
  onExportAlerts: () => void;
}

export default function FilterBar({
  filters,
  categories,
  alertLine,
  onFiltersChange,
  onAlertLineChange,
  onExportFiltered,
  onExportAlerts,
}: FilterBarProps) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_14rem_18rem_auto] xl:items-center">
        <label className="relative block">
          <span className="sr-only">商品名・カテゴリ検索</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder="商品名・カテゴリ・商品コードを検索"
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>

        <label className="block">
          <span className="sr-only">カテゴリ</span>
          <select
            value={filters.category}
            onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })}
            className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100"
          >
            <option value="all">すべてのカテゴリ</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              アラートライン
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={alertLine}
              onChange={(event) => onAlertLineChange(Number(event.target.value))}
              className="h-8 w-20 rounded border border-slate-700 bg-slate-950 px-2 text-right font-mono text-sm text-cyan-100"
            />
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.min(alertLine, 100)}
            onChange={(event) => onAlertLineChange(Number(event.target.value))}
            className="mt-2 w-full accent-cyan-400"
            aria-label="アラートライン"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 text-sm font-medium text-orange-100">
            <input
              type="checkbox"
              checked={filters.alertOnly}
              onChange={(event) => onFiltersChange({ ...filters, alertOnly: event.target.checked })}
              className="h-4 w-4 accent-orange-400"
            />
            アラートのみ
          </label>
          <button
            type="button"
            onClick={onExportFiltered}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            表示CSV
          </button>
          <button
            type="button"
            onClick={onExportAlerts}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-400/30 bg-orange-500/10 px-3 text-sm font-semibold text-orange-100 hover:bg-orange-500/20"
          >
            <FileWarning className="h-4 w-4" aria-hidden="true" />
            アラートCSV
          </button>
        </div>
      </div>
    </section>
  );
}
