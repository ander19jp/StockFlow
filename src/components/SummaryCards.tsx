import { AlertTriangle, Boxes, CircleDollarSign, PackageX } from 'lucide-react';
import type { InventorySummary } from '../types/inventory';
import { formatNumber, formatYen } from '../utils/stockAlert';

interface SummaryCardsProps {
  summary: InventorySummary;
  isLoading: boolean;
}

const cards = [
  {
    key: 'totalProducts',
    label: '総商品数',
    getValue: (summary: InventorySummary) => `${formatNumber(summary.totalProducts)} 点`,
    icon: Boxes,
    className: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100',
  },
  {
    key: 'outOfStock',
    label: '在庫切れ',
    getValue: (summary: InventorySummary) => `${formatNumber(summary.outOfStock)} 点`,
    icon: PackageX,
    className: 'border-red-400/30 bg-red-500/10 text-red-100',
  },
  {
    key: 'lowStock',
    label: '残りわずか',
    getValue: (summary: InventorySummary) => `${formatNumber(summary.lowStock)} 点`,
    icon: AlertTriangle,
    className: 'border-orange-400/30 bg-orange-500/10 text-orange-100',
  },
  {
    key: 'totalValue',
    label: '在庫総額',
    getValue: (summary: InventorySummary) => formatYen(summary.totalValue),
    icon: CircleDollarSign,
    className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
  },
];

export default function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="在庫サマリー">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className={`rounded-lg border p-4 shadow-glow backdrop-blur ${card.className}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                {isLoading ? (
                  <div className="skeleton mt-3 h-8 w-32 rounded" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-white">{card.getValue(summary)}</p>
                )}
              </div>
              <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
