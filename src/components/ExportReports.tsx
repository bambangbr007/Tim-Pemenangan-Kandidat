import React from 'react';
import { CampaignConfig, Voter, ActivityReport, UrgentEvent, Opponent } from '../types';
import { Printer, Download, FileText, CheckCircle2, ShieldAlert, Users, Award } from 'lucide-react';

interface ExportReportsProps {
  config: CampaignConfig;
  voters: Voter[];
  activities: ActivityReport[];
  events: UrgentEvent[];
  opponents: Opponent[];
}

export const ExportReports: React.FC<ExportReportsProps> = ({
  config,
  voters = [],
  activities = [],
  events = [],
  opponents = []
}) => {
  const safeVoters = Array.isArray(voters) ? voters : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeOpponents = Array.isArray(opponents) ? opponents : [];

  const totalPendukung = safeVoters.filter(v => v.status === 'pendukung').length;
  const swingVoters = safeVoters.filter(v => v.status === 'swing').length;
  const totalPenolak = safeVoters.filter(v => v.status === 'penolak').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Nama Pemilih', 'NIK', 'No HP', 'Desa/Kelurahan', 'TPS', 'Alamat', 'Status Dukungan', 'PIC Relawan'];
    const rows = voters.map(v => [
      `"${v.nama}"`,
      `"${v.nik}"`,
      `"${v.phone}"`,
      `"${v.subdistrict}"`,
      `"${v.tps}"`,
      `"${v.address}"`,
      `"${v.status}"`,
      `"${v.picName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Pemilih_DPT_${config.candidateName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Print Controls (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Cetak Laporan Eksekutif & Ekspor Data
          </h2>
          <p className="text-xs text-slate-400">
            Format resmi Laporan Ringkasan Pemenangan siap cetak A4/PDF atau ekspor file CSV Excel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Official Formatted Executive Summary Document */}
      <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl space-y-6 max-w-4xl mx-auto border border-slate-200 print:shadow-none print:border-none print:p-0">
        {/* Header Kop Laporan */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-cyan-700">Pusat Komando Strategis Pemenangan</span>
            <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">{config.candidateName}</h1>
            {config.viceCandidateName && (
              <p className="text-sm font-bold text-slate-700">& {config.viceCandidateName}</p>
            )}
            <p className="text-xs text-slate-600 mt-0.5">{config.electionType} - Wilayah {config.electionRegion}</p>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center font-black text-xl mb-1 ml-auto">
              BBR
            </div>
            <span className="text-[10px] font-mono text-slate-500">BBR @ SYNERGY smart system</span>
            <p className="text-[10px] text-slate-500 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>
        </div>

        {/* Executive Summary Stats */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-3">
            I. Ringkasan Eksekutif Peta Suara
          </h2>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Target Suara</span>
              <span className="text-base font-black text-slate-900">{config.targetVotes.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300">
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">Pendukung Siap</span>
              <span className="text-base font-black text-emerald-700">{totalPendukung.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300">
              <span className="text-[10px] text-amber-800 uppercase font-bold block">Swing Voters</span>
              <span className="text-base font-black text-amber-700">{swingVoters.toLocaleString('id-ID')}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-300">
              <span className="text-[10px] text-red-800 uppercase font-bold block">Penolak / Lawan</span>
              <span className="text-base font-black text-red-700">{totalPenolak.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Sample Voter Breakdown */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-3">
            II. Sampel Data Pemilih Terdaftar (DPT Lapangan)
          </h2>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-300">Nama Pemilih</th>
                <th className="p-2 border-r border-slate-300">NIK</th>
                <th className="p-2 border-r border-slate-300">Desa / TPS</th>
                <th className="p-2 border-r border-slate-300">Status</th>
                <th className="p-2">PIC Relawan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {voters.slice(0, 10).map((v) => (
                <tr key={v.id}>
                  <td className="p-2 font-bold border-r border-slate-200">{v.nama}</td>
                  <td className="p-2 font-mono border-r border-slate-200">{v.nik}</td>
                  <td className="p-2 border-r border-slate-200">{v.subdistrict} ({v.tps})</td>
                  <td className="p-2 font-bold uppercase border-r border-slate-200">
                    {v.status === 'pendukung' ? 'Pendukung' : v.status === 'swing' ? 'Swing' : 'Penolak'}
                  </td>
                  <td className="p-2">{v.picName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Urgent Events & Opponents Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
              III. Kejadian Lapangan & Darurat
            </h2>
            <div className="space-y-1.5 text-[11px]">
              {events.slice(0, 3).map(e => (
                <div key={e.id} className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="font-bold text-red-700 block">{e.title} [{e.level.toUpperCase()}]</span>
                  <span className="text-slate-600">{e.location} ({e.tps})</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-2">
              IV. Peta Kekuatan Paslon Pesaing
            </h2>
            <div className="space-y-1.5 text-[11px]">
              {opponents.map(o => (
                <div key={o.id} className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between">
                  <div>
                    <span className="font-bold block">{o.candidateName}</span>
                    <span className="text-slate-500">{o.party}</span>
                  </div>
                  <span className="font-bold text-slate-800">{o.estimatedVotes.toLocaleString('id-ID')} Suara</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-700">
          <div>
            <p className="mb-12 font-medium">Mengetahui,<br /><strong>Ketua Tim Pemenangan Lapangan</strong></p>
            <p className="font-bold underline">( .................................................... )</p>
          </div>
          <div>
            <p className="mb-12 font-medium">Disetujui Oleh,<br /><strong>Kandidat Utama / Owner</strong></p>
            <p className="font-bold underline">( {config.candidateName} )</p>
          </div>
        </div>

        {/* Mandatory Footer Branding in Report */}
        <div className="pt-6 border-t border-slate-200 text-center text-[11px] font-semibold text-slate-500">
          BBR @ SYNERGY smart system
        </div>
      </div>
    </div>
  );
};
