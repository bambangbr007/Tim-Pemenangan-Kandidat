import React, { useState } from 'react';
import { Database, Copy, Check, X, Shield, ExternalLink, Server } from 'lucide-react';

interface DatabaseSetupModalProps {
  onClose: () => void;
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState((import.meta as any).env?.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
  const [saved, setSaved] = useState(false);

  const sqlSchema = `-- SKEMA DATABASE SUPABASE UNTUK PANTAUAN PEMENANGAN KANDIDAT
CREATE TABLE IF NOT EXISTS campaign_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    candidate_name TEXT NOT NULL,
    vice_candidate_name TEXT,
    election_type TEXT NOT NULL,
    election_region TEXT NOT NULL,
    target_votes INTEGER NOT NULL,
    total_dpt INTEGER NOT NULL,
    election_date DATE NOT NULL,
    owner_whatsapp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'tim_pemenangan')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    assigned_region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voters (
    id TEXT PRIMARY KEY,
    nik TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    subdistrict TEXT NOT NULL,
    tps TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendukung', 'penolak', 'swing')),
    pic_id TEXT REFERENCES users(id),
    pic_name TEXT NOT NULL,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    progress_percent INTEGER NOT NULL,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    tps TEXT NOT NULL,
    photo_url TEXT,
    notes TEXT NOT NULL,
    created_by_id TEXT REFERENCES users(id),
    created_by_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urgent_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('darurat', 'tinggi', 'sedang')),
    location TEXT NOT NULL,
    tps TEXT NOT NULL,
    photo_url TEXT,
    video_url TEXT,
    reported_by_id TEXT REFERENCES users(id),
    reported_by_name TEXT NOT NULL,
    whatsapp_sent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('VITE_SUPABASE_URL', supabaseUrl);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Koneksi Database Supabase Cloud</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Aplikasi ini berjalan dengan penyimpanan lokal otomatis (LocalStorage). Jika anda ingin menghubungkan ke database cloud Supabase, masukkan URL dan Anon Key anda di bawah ini:
        </p>

        <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">VITE_SUPABASE_URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">VITE_SUPABASE_ANON_KEY</label>
            <input
              type="text"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-[11px]"
            />
          </div>

          {saved && (
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold">
              Kredensial disimpan! Merefresh halaman...
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Simpan & Hubungkan Supabase
            </button>
          </div>
        </form>

        {/* SQL Schema Script Copy Section */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Skema SQL DDL Supabase (Tabel)</span>
            <button
              onClick={handleCopySql}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-cyan-300 max-h-48 overflow-y-auto">
            {sqlSchema}
          </pre>
        </div>
      </div>
    </div>
  );
};
