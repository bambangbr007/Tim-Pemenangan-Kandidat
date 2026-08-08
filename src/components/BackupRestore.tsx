import React, { useState } from 'react';
import { StorageService } from '../lib/supabase';
import { Database, Download, Upload, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface BackupRestoreProps {
  storage: StorageService;
  onRefreshData: () => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  storage,
  onRefreshData
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExportBackup = () => {
    try {
      const backupData = storage.exportBackupJSON();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup_Pantauan_Kandidat_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('File cadangan JSON berhasil diunduh ke komputer/HP anda!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setErrorMessage('Gagal mengunduh file cadangan.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = storage.importBackupJSON(content);
        if (success) {
          onRefreshData();
          setSuccessMessage('Data cadangan berhasil dipulihkan!');
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setErrorMessage('Format file JSON tidak valid.');
        }
      } catch (err) {
        setErrorMessage('Gagal membaca file cadangan.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('APAKAH ANDA YAKIN? Seluruh data akan dikembalikan ke data awal demo.')) {
      storage.resetToDemoData();
      onRefreshData();
      setSuccessMessage('Data berhasil dikembalikan ke mode data awal demo.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Cadangkan (Backup) & Pulihkan (Restore) Data
          </h2>
          <p className="text-xs text-slate-400">
            Simpan seluruh data pemilih, laporan kegiatan, dan instruksi dalam format file JSON aman
          </p>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Download Backup */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-cyan-400" />
              1. Unduh Cadangan (JSON)
            </h3>
            <p className="text-[11px] text-slate-400">
              Simpan berkas cadangan seluruh database ke penyimpanan perangkat HP / Laptop.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Unduh Backup JSON
            </button>
          </div>

          {/* Import Restore */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-400" />
              2. Pulihkan File (Restore)
            </h3>
            <p className="text-[11px] text-slate-400">
              Upload file `.json` cadangan yang sebelumnya pernah anda unduh.
            </p>
            <label className="block w-full text-center py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all">
              Pilih File Backup JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-red-400">Kembalikan ke Data Demo Awal</h4>
            <p className="text-[10px] text-slate-500">Gunakan jika ingin mereset seluruh simulasi ke kondisi awal</p>
          </div>
          <button
            onClick={handleResetDemo}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-red-400 text-xs font-bold flex items-center gap-1 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
