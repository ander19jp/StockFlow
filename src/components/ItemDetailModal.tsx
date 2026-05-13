import { useEffect, useState } from 'react';
import { Package, Save, X } from 'lucide-react';
import type { InventoryItem } from '../types/inventory';
import { formatNumber, formatYen, getAlertThreshold } from '../utils/stockAlert';
import StockBadge from './StockBadge';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  alertLine: number;
  onClose: () => void;
  onSaveComment: (code: string, comment: string) => void;
}

export default function ItemDetailModal({ item, alertLine, onClose, onSaveComment }: ItemDetailModalProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    setComment(item?.comment ?? '');
  }, [item]);

  if (!item) {
    return null;
  }

  const importedAt = new Date(item.importedAt).toLocaleString('ja-JP');
  const threshold = getAlertThreshold(item, alertLine);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
              <Package className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-cyan-300">{item.code}</p>
              <h3 className="mt-1 truncate text-xl font-bold text-white">{item.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="カテゴリ" value={item.category} />
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">ステータス</p>
              <div className="mt-2">
                <StockBadge item={item} alertLine={alertLine} />
              </div>
            </div>
            <Detail label="販売価格" value={formatYen(item.price)} />
            <Detail label="在庫数" value={`${formatNumber(item.stock)} 点`} />
            <Detail label="CSV発注点" value={`${formatNumber(item.reorderPoint)} 点`} />
            <Detail label="アラートライン" value={`${formatNumber(alertLine)} 点`} />
            <Detail label="判定ライン" value={`${formatNumber(threshold)} 点`} />
            <Detail
              label="前回比"
              value={item.stockDiff === undefined ? '初回' : `${item.stockDiff > 0 ? '+' : ''}${formatNumber(item.stockDiff)} 点`}
            />
            <Detail label="最終取込" value={importedAt} />
          </div>

          <label className="mt-4 block">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">在庫推移コメント</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              placeholder="補充予定、季節要因、発注メモなど"
              className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </label>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onSaveComment(item.code, comment);
                onClose();
              }}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              コメント保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
