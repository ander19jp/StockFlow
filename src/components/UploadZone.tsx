import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { AlertCircle, FileSpreadsheet, UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  lastImportLabel: string;
}

const isCsvFile = (file: File) =>
  file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv') || file.type === 'application/vnd.ms-excel';

export default function UploadZone({ onFileUpload, isLoading, error, lastImportLabel }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];

    if (!file || !isCsvFile(file)) {
      return;
    }

    onFileUpload(file);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <label
        className={`flex cursor-pointer flex-col justify-center rounded-lg border border-dashed p-5 transition ${
          isDragging
            ? 'border-cyan-300 bg-cyan-500/15 text-cyan-50'
            : 'border-slate-600 bg-slate-950/50 text-slate-300 hover:border-cyan-400/70 hover:bg-cyan-500/10'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleInputChange} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-sm font-medium uppercase tracking-[0.18em] text-cyan-200">
              CSV Upload
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              CSVをドラッグ＆ドロップ、またはクリックして選択
            </p>
            <p className="mt-1 text-sm text-slate-400">
              商品コード、商品名、カテゴリ、販売価格、在庫数、発注点のヘッダーに対応します。
            </p>
          </div>
        </div>
      </label>

      <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-1 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Current Source</p>
            {isLoading ? (
              <div className="skeleton mt-3 h-5 w-48 rounded" />
            ) : (
              <p className="mt-2 break-words text-sm font-medium text-slate-200">{lastImportLabel}</p>
            )}
          </div>
        </div>
        {error ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
