import { AlertTriangle, CheckCircle2, OctagonAlert } from 'lucide-react';
import type { InventoryItem, StockStatus } from '../types/inventory';
import { getStatusLabel, getStockStatus } from '../utils/stockAlert';

interface StockBadgeProps {
  item: InventoryItem;
  alertLine: number;
}

const statusClassName: Record<StockStatus, string> = {
  out: 'border-red-400/40 bg-red-500/15 text-red-200',
  low: 'border-orange-400/40 bg-orange-500/15 text-orange-200',
  ok: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
};

const statusIcon: Record<StockStatus, typeof OctagonAlert> = {
  out: OctagonAlert,
  low: AlertTriangle,
  ok: CheckCircle2,
};

export default function StockBadge({ item, alertLine }: StockBadgeProps) {
  const status = getStockStatus(item, alertLine);
  const Icon = statusIcon[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClassName[status]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  );
}
