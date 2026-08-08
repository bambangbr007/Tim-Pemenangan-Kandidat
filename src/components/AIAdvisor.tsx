import React, { useState } from 'react';
import { CampaignConfig, UserAccount, Voter } from '../types';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  HelpCircle, 
  AlertCircle, 
  Target, 
  ShieldAlert, 
  RefreshCw,
  Brain,
  MessageSquare
} from 'lucide-react';

interface AIAdvisorProps {
  config: CampaignConfig;
  currentUser: UserAccount;
  voters: Voter[];
  onSendOwnerCommand: (title: string, message: string) => void;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({
  config,
  currentUser,
  voters = [],
  onSendOwnerCommand
}) => {
  const safeVoters = Array.isArray(voters) ? voters : [];
  const [problemType, setProblemType] = useState<string>('Aksi Money Politics & Sembako Tim Lawan');
  const [customQuery, setCustomQuery] = useState<string>('Tim lawan membagikan sembako dan minyak goreng kepada swing voter di Desa Sukamaju pada malam hari. Apa langkah taktis cepat yang harus dilakukan tim pemenangan kita?');
  const [selectedRegion, setSelectedRegion] = useState<string>('Desa Sukamaju');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [commandSent, setCommandSent] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<{
    analysis: string;
    tacticalSteps: string[];
    commandMessage: string;
  } | null>({
    analysis: `Berdasarkan analisis situasi di Desa Sukamaju untuk Paslon ${config.candidateName}: \n\nAksi tim lawan membagikan sembako merupakan taktik jangka pendek untuk menggoyang pemilih ragu (swing voter). Hal ini menunjukkan kepanikan tim lawan terhadap penguatan basis massa kita. Respon tim kita tidak boleh konfrontatif secara fisik, melainkan harus fokus mengunci emosional pemilih dengan memperkuat komitmen program nyata dan kehadiran sosial yang santun.`,
    tacticalSteps: [
      "Bentuk 'Tim Sisir Kilat' Korlap Desa Sukamaju: Lakukan kunjungan silaturahmi balasan ke rumah-rumah swing voter dalam 24 jam ke depan.",
      "Sosialisasikan Program Unggulan Jangka Panjang: Tekankan bahwa bantuan modal UMKM dan Kartu Tani dari kandidat jauh lebih bernilai dibanding sembako 1 hari.",
      "Pemasangan Baliho / Mini Banner di Rumah Pendukung: Minta izin warga pendukung untuk memasang stiker/banner kecil di depan rumah sebagai sinyal dominasi wilayah.",
      "Patroli Simpatik Relawan Lapangan: Tingkatkan ronda malam di titik TPS rawan (TPS 01 & TPS 02) untuk mendokumentasikan aksi kecurangan lawan secara tertib.",
      "Edukasi Politik Santun: Himbau warga tetap menerima jika diberi, namun saat pencoblosan di bilik suara tetap mencoblos Paslon No. 2 demi masa depan desa."
    ],
    commandMessage: `PANGGILAN AKSI UNTUK TIM PEMENANGAN DESA SUKAMAJU!\n\nInstruksi Langsung dari Bapak ${config.candidateName}:\n\n1. Seluruh Korlap & Relawan Sukamaju segera rapat konsolidasi singkat malam ini.\n2. Lakukan kunjungan rumah ke rumah (Door-to-Door) menyapa warga swing voter secara santun.\n3. Tegaskan komitmen Program Bantuan Modal UMKM & Kartu Tani Paslon Kita.\n4. Tetap tenang, jangan terpancing provokasi, laporkan setiap pergerakan lawan!\n\nTetap Solid & Fokus Menuju Kemenangan! BISMILLAH.`
  });

  const uniqueRegions = Array.from(new Set(safeVoters.map(v => v.subdistrict)));

  const handleGenerateAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCommandSent(false);

    const totalPendukung = safeVoters.filter(v => v.status === 'pendukung').length;
    const swingVoters = safeVoters.filter(v => v.status === 'swing').length;

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemType,
          customQuery,
          selectedRegion,
          candidateName: config.candidateName,
          electionType: config.electionType,
          totalPendukung,
          swingVoters
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Server');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error fetching AI advice:', err);
      // Fallback result
      setResult({
        analysis: `Analisis AI untuk isu '${problemType}' di ${selectedRegion}: Paslon ${config.candidateName} perlu menjaga konsistensi tim relawan di TPS kunci dan memperkuat komunikasi program unggulan.`,
        tacticalSteps: [
          `Instruksikan tim lapangan di ${selectedRegion} memperketat pengawasan pergerakan tim lawan.`,
          `Sosialisasikan visi misi utama kandidat melalui media cetak dan tatap muka tokoh.`,
          `Dekati pemilih swing voter dengan pendekatan kekeluargaan dan dialog terbuka.`
        ],
        commandMessage: `Instruksi Komando dari ${config.candidateName}: Seluruh tim pemenangan di ${selectedRegion} harap tingkatkan koordinasi dan jaga soliditas relawan!`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCommand = () => {
    if (!result?.commandMessage) return;
    navigator.clipboard.writeText(result.commandMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBroadcastCommand = () => {
    if (!result?.commandMessage) return;
    onSendOwnerCommand(
      `Instruksi AI Strategy: ${problemType} (${selectedRegion})`,
      result.commandMessage
    );
    setCommandSent(true);
  };

  const handleSendWhatsApp = () => {
    if (!result?.commandMessage) return;
    const ownerPhone = config.ownerWhatsapp || '6281234567890';
    const waUrl = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(result.commandMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/60 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                INTELLIGENCE STRATEGY ENGINE
              </span>
              <span className="text-[10px] text-purple-300">Powered by Gemini AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pertimbangan & Strategi AI Pemenangan
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Asisten kecerdasan buatan untuk Owner & Kandidat. Dapatkan analisis taktis, rekomendasi aksi relawan, dan draf instruksi komando ke WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Query Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <form onSubmit={handleGenerateAdvice} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Kategori Masalah Lapangan</label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="Aksi Money Politics & Sembako Tim Lawan">Aksi Money Politics / Sembako Tim Lawan</option>
                <option value="Penurunan Suara Pendukung & Keraguan Pemilih">Penurunan Suara Pendukung & Keraguan Pemilih</option>
                <option value="Banyak Swing Voter di TPS Kunci">Tingginya Swing Voter di TPS Kunci</option>
                <option value="Perusakan Alat Peraga Kampanye (Spanduk/Baliho)">Perusakan Alat Peraga Kampanye (Spanduk/Baliho)</option>
                <option value="Isu Black Campaign / Fitnah Terhadap Kandidat">Isu Black Campaign / Fitnah Terhadap Kandidat</option>
                <option value="Persiapan Debat & Penguasaan Isu Daerah">Persiapan Debat & Penguasaan Isu Daerah</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Wilayah Fokus / Target Desa</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="Seluruh Wilayah">Seluruh Wilayah Pemilihan</option>
                {uniqueRegions.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Rincian Masalah Spesifik dari Owner / Kandidat</label>
            <textarea
              rows={3}
              required
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="Ceritakan kejadian spesifik di lapangan..."
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Analisis AI Pemenangan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span>Hasilkan Pertimbangan & Strategi AI</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Cards Display */}
      {result && (
        <div className="space-y-4">
          {/* Section 1: Situation Analysis */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-purple-300">
              <Brain className="w-4 h-4" />
              1. Analisis Situasi Pemetaan Lapangan
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 whitespace-pre-line">
              {result.analysis}
            </p>
          </div>

          {/* Section 2: Tactical Steps */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-emerald-400">
              <Target className="w-4 h-4" />
              2. Rekomendasi Langkah Taktis Tim Pemenangan
            </h3>
            <div className="space-y-2">
              {result.tacticalSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px] border border-emerald-800">
                    {idx + 1}
                  </span>
                  <p className="text-slate-200 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: WhatsApp Command Message */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-purple-800/60 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 text-purple-300">
                <MessageSquare className="w-4 h-4" />
                3. Draf Pesan Komando Siap Kirim ke WhatsApp Korlap
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCommand}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-200 whitespace-pre-line leading-relaxed">
              {result.commandMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleBroadcastCommand}
                disabled={commandSent}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{commandSent ? 'Tersimpan di Pusat Komando!' : 'Simpan ke Pusat Komando Aplikasi'}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Buka & Kirim via WhatsApp WA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
