import React, { useState } from 'react';
import { Opponent, UserAccount, CampaignConfig } from '../types';
import { 
  Swords, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Users, 
  MapPin, 
  X, 
  Check, 
  ShieldAlert 
} from 'lucide-react';

interface OpponentMonitorProps {
  opponents: Opponent[];
  currentUser: UserAccount;
  config: CampaignConfig;
  ownTeamVotes: number;
  onAddOpponent: (opponent: Omit<Opponent, 'id' | 'updatedAt'>) => void;
  onUpdateOpponent: (opponent: Opponent) => void;
  onDeleteOpponent: (id: string) => void;
}

export const OpponentMonitor: React.FC<OpponentMonitorProps> = ({
  opponents = [],
  currentUser,
  config,
  ownTeamVotes = 0,
  onAddOpponent,
  onUpdateOpponent,
  onDeleteOpponent
}) => {
  const safeOpponents = Array.isArray(opponents) ? opponents : [];
  const [showModal, setShowModal] = useState(false);
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);

  // Form State
  const [candidateName, setCandidateName] = useState('');
  const [party, setParty] = useState('');
  const [strength, setStrength] = useState<'tinggi' | 'sedang' | 'rendah'>('tinggi');
  const [estimatedVotes, setEstimatedVotes] = useState<number>(15000);
  const [dominantRegions, setDominantRegions] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAddModal = () => {
    setEditingOpponent(null);
    setCandidateName('');
    setParty('');
    setStrength('tinggi');
    setEstimatedVotes(15000);
    setDominantRegions('Desa Kencana (TPS 01)');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (opp: Opponent) => {
    setEditingOpponent(opp);
    setCandidateName(opp.candidateName);
    setParty(opp.party);
    setStrength(opp.strength);
    setEstimatedVotes(opp.estimatedVotes);
    setDominantRegions(opp.dominantRegions.join(', '));
    setNotes(opp.notes);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    const regionsArray = dominantRegions.split(',').map(s => s.trim()).filter(Boolean);

    if (editingOpponent) {
      onUpdateOpponent({
        ...editingOpponent,
        candidateName,
        party,
        strength,
        estimatedVotes,
        dominantRegions: regionsArray,
        notes,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddOpponent({
        candidateName,
        party,
        strength,
        estimatedVotes,
        dominantRegions: regionsArray,
        notes
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            Pantauan Tim Lawan & Peta Kekuatan ({safeOpponents.length})
          </h2>
          <p className="text-xs text-slate-400">
            Intelijen kekuatan kandidat pesaing, basis wilayah dominan, dan analisis potensi perolehan suara
          </p>
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tim Lawan</span>
          </button>
        )}
      </div>

      {/* Own Candidate Strength Comparison Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-800/60 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            Posisi Tim Kita ({config.candidateName})
          </span>
          <span className="font-bold text-emerald-400">
            {ownTeamVotes.toLocaleString('id-ID')} Pendukung Terkunci
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
            style={{ width: `${Math.min(100, (ownTeamVotes / (config.targetVotes || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Opponents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeOpponents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
            Belum ada data tim lawan yang diinput.
          </div>
        ) : (
          safeOpponents.map((opp) => (
            <div 
              key={opp.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 hover:border-amber-700/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{opp.candidateName}</h3>
                    <p className="text-[11px] text-slate-400">{opp.party}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    opp.strength === 'tinggi' 
                      ? 'bg-red-950 text-red-400 border border-red-800' 
                      : opp.strength === 'sedang'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    KEKUATAN {opp.strength.toUpperCase()}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Estimasi Perolehan Suara:</span>
                    <span className="font-bold text-amber-400">{opp.estimatedVotes.toLocaleString('id-ID')} Suara</span>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-slate-400 text-[11px] block mb-1 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Wilayah Dominan Lawan:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {opp.dominantRegions.map((reg, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {reg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                  Catatan Pergerakan: "{opp.notes}"
                </p>
              </div>

              {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEditModal(opp)}
                    className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data ${opp.candidateName}?`)) {
                        onDeleteOpponent(opp.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-900/60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Opponent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                {editingOpponent ? 'Edit Data Tim Lawan' : 'Tambah Tim Lawan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Paslon / Kandidat Pesaing</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Paslon 01 - Drs. H. Suryadi..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Partai / Koalisi Pengusung</label>
                  <input
                    type="text"
                    required
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="Koalisi Bersama"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tingkat Kekuatan</label>
                  <select
                    value={strength}
                    onChange={(e) => setStrength(e.target.value as 'tinggi' | 'sedang' | 'rendah')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="tinggi">Tinggi (Kuat)</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah (Lemah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Estimasi Perolehan Suara</label>
                <input
                  type="number"
                  required
                  value={estimatedVotes}
                  onChange={(e) => setEstimatedVotes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Wilayah Dominan Lawan (Pisahkan koma)</label>
                <input
                  type="text"
                  required
                  value={dominantRegions}
                  onChange={(e) => setDominantRegions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Desa Kencana (TPS 01), Desa Pasar Rebo"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Catatan Intelijen & Pergerakan Lawan</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Taktik utama lawan, figur kunci pendukung..."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Tim Lawan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
