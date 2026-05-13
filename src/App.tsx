import { useMemo, useState } from 'react';
import { Boxes, Factory } from 'lucide-react';
import FilterBar from './components/FilterBar';
import InventoryTable from './components/InventoryTable';
import ItemDetailModal from './components/ItemDetailModal';
import SummaryCards from './components/SummaryCards';
import UploadZone from './components/UploadZone';
import { useInventory } from './hooks/useInventory';
import type { FilterState, InventoryItem, SortState } from './types/inventory';
import { downloadInventoryCsv } from './utils/csvExport';
import { getInventorySummary, isAlertItem } from './utils/stockAlert';

const PAGE_SIZE = 20;

const getDownloadDate = () => new Date().toISOString().slice(0, 10);

function App() {
  const {
    items,
    alertLine,
    lastImportLabel,
    isLoading,
    error,
    importFile,
    updateAlertLine,
    updateComment,
  } = useInventory();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    alertOnly: false,
  });
  const [sort, setSort] = useState<SortState>({ key: 'stock', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'ja')),
    [items],
  );

  const summary = useMemo(() => getInventorySummary(items, alertLine), [alertLine, items]);

  const baseFilteredItems = useMemo(() => {
    const normalizeSearchText = (value: string) =>
      value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/\s+/g, '');
    const keyword = normalizeSearchText(filters.search);

    return items.filter((item) => {
      const searchableText = normalizeSearchText(
        [item.code, item.name, item.category].join(' '),
      );
      const matchesSearch =
        keyword.length === 0 || searchableText.includes(keyword);
      const matchesCategory = filters.category === 'all' || item.category === filters.category;

      return matchesSearch && matchesCategory;
    });
  }, [filters.category, filters.search, items]);

  const filteredItems = useMemo(() => {
    const alertFiltered = filters.alertOnly
      ? baseFilteredItems.filter((item) => isAlertItem(item, alertLine))
      : baseFilteredItems;

    return [...alertFiltered].sort((a, b) => {
      const first = a[sort.key];
      const second = b[sort.key];
      const direction = sort.direction === 'asc' ? 1 : -1;

      if (typeof first === 'number' && typeof second === 'number') {
        return (first - second) * direction;
      }

      return String(first).localeCompare(String(second), 'ja') * direction;
    });
  }, [alertLine, baseFilteredItems, filters.alertOnly, sort.direction, sort.key]);

  const alertExportItems = useMemo(
    () => baseFilteredItems.filter((item) => isAlertItem(item, alertLine)),
    [alertLine, baseFilteredItems],
  );

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSortChange = (nextSort: SortState) => {
    setSort(nextSort);
    setPage(1);
  };

  const exportFiltered = () => {
    downloadInventoryCsv(filteredItems, `inventory-filtered-${getDownloadDate()}.csv`, alertLine);
  };

  const exportAlerts = () => {
    downloadInventoryCsv(alertExportItems, `inventory-alerts-${getDownloadDate()}.csv`, alertLine);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-cyan-200">
              <Factory className="h-4 w-4" aria-hidden="true" />
              Inventory Control
            </div>
            <h1 className="text-3xl font-black tracking-normal text-white sm:text-4xl">
              在庫管理コンソール
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              週次CSVマスタを読み込み、在庫アラート、差分、カテゴリ別の在庫量を一画面で確認できます。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3">
            <Boxes className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Alert Line</p>
              <p className="text-lg font-bold text-white">{alertLine} 点以下</p>
            </div>
          </div>
        </header>

        <UploadZone
          onFileUpload={importFile}
          isLoading={isLoading}
          error={error}
          lastImportLabel={lastImportLabel}
        />

        <SummaryCards summary={summary} isLoading={isLoading} />

        <FilterBar
          filters={filters}
          categories={categories}
          alertLine={alertLine}
          onFiltersChange={handleFiltersChange}
          onAlertLineChange={updateAlertLine}
          onExportFiltered={exportFiltered}
          onExportAlerts={exportAlerts}
        />

        <InventoryTable
          items={filteredItems}
          sort={sort}
          page={page}
          pageSize={PAGE_SIZE}
          alertLine={alertLine}
          isLoading={isLoading}
          onSortChange={handleSortChange}
          onPageChange={setPage}
          onItemClick={setSelectedItem}
        />

      </div>

      <ItemDetailModal
        item={selectedItem}
        alertLine={alertLine}
        onClose={() => setSelectedItem(null)}
        onSaveComment={updateComment}
      />
    </main>
  );
}

export default App;
