import React, { useState } from 'react';
import { Voter, VoterStatus, UserAccount } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  HelpCircle, 
  Phone, 
  MapPin, 
  X, 
  Check, 
  Download,
  CheckCircle2
} from 'lucide-react';

interface VoterManagementProps {
  voters: Voter[];
  currentUser: UserAccount;
  onAddVoter: (voter: Omit<Voter, 'id' | 'updatedAt'>) => void;
  onUpdateVoter: (voter: Voter) => void;
  onDeleteVoter: (id: string) => void;
}

export const VoterManagement: React.FC<VoterManagementProps> = ({
  voters,
  currentUser,
  onAddVoter,
  onUpdateVoter,
  onDeleteVoter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subdistrictFilter, setSubdistrictFilter] = useState<string>('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);

  // Form Fields
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('Desa Sukamaju');
  const [tps, setTps] = useState('TPS 01');
  const [status, setStatus] = useState<VoterStatus>('pendukung');
  const [notes, setNotes] = useState('');

  // Extract unique subdistricts for filter
  const safeVoters = Array.isArray(voters) ? voters : [];
  const uniqueSubdistricts = Array.from(new Set(safeVoters.map(v => v.subdistrict)));

  // Filtered Voters
  const filteredVoters = safeVoters.filter(voter => {
    const matchesSearch = 
      voter.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.nik.includes(searchTerm) ||
      voter.phone.includes(searchTerm) ||
      voter.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || voter.status === statusFilter;
    const matchesSubdistrict = subdistrictFilter === 'all' || voter.subdistrict === subdistrictFilter;

    return matchesSearch && matchesStatus && matchesSubdistrict;
  });

  const handleOpenAddModal = () => {
    setEditingVoter(null);
    setNik(`32010${Math.floor(100000000 + Math.random() * 900000000)}`);
    setNama('');
    setPhone('0812');
    setAddress('Dusun Krajan RT 01/02');
    setSubdistrict(currentUser.assignedRegion || 'Desa Sukamaju');
    setTps('TPS 01');
    setStatus('pendukung');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (voter: Voter) => {
    setEditingVoter(voter);
    setNik(voter.nik);
    setNama(voter.nama);
    setPhone(voter.phone);
    setAddress(voter.address);
    setSubdistrict(voter.subdistrict);
    setTps(voter.tps);
    setStatus(voter.status);
    setNotes(voter.notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editingVoter) {
      onUpdateVoter({
        ...editingVoter,
        nik,
        nama,
        phone,
        address,
        subdistrict,
        tps,
        status,
        notes,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddVoter({
        nik,
        nama,
        phone,
        address,
        subdistrict,
        tps,
        status,
        picId: currentUser.id,
        picName: currentUser.name,
        notes
      });
    }
    setShowModal(false);
  };

  const handleQuickStatusToggle = (voter: Voter, newStatus: VoterStatus) => {
    onUpdateVoter({
      ...voter,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const getStatusBadge = (st: VoterStatus) => {
    switch (st) {
      case 'pendukung':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            Pendukung (Siap)
          </span>
        );
      case 'swing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Swing Voter
          </span>
        );
      case 'penolak':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-800/80 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" />
            Penolak (Lawan)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Pencatatan Pemilih DPT ({safeVoters.length})
          </h2>
          <p className="text-xs text-slate-400">
            Kelola data calon pemilih, kualifikasi status dukungan, dan lokasi TPS
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pemilih Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, NIK, No HP, Alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Semua Status Pemilih</option>
          <option value="pendukung">Pendukung (Siap)</option>
          <option value="swing">Swing Voter</option>
          <option value="penolak">Penolak (Lawan)</option>
        </select>

        {/* Subdistrict Filter */}
        <select
          value={subdistrictFilter}
          onChange={(e) => setSubdistrictFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Semua Desa / Kelurahan</option>
          {uniqueSubdistricts.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Voter List - Card View for Mobile & Table View for Desktop */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama & NIK</th>
                <th className="py-3 px-4">Kontak & Alamat</th>
                <th className="py-3 px-4">Desa / TPS</th>
                <th className="py-3 px-4">Status Dukungan</th>
                <th className="py-3 px-4">PIC Relawan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada data pemilih yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredVoters.map((voter) => (
                  <tr key={voter.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-sm">{voter.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIK: {voter.nik}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="flex items-center gap-1 text-slate-300 font-mono">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        {voter.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{voter.address}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{voter.subdistrict}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 font-mono">
                        {voter.tps}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(voter.status)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-300">{voter.picName}</p>
                      <p className="text-[10px] text-slate-500">{new Date(voter.updatedAt).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(voter)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                          title="Edit Pemilih"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data pemilih ${voter.nama}?`)) {
                              onDeleteVoter(voter.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-red-400 transition-colors"
                          title="Hapus Pemilih"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="md:hidden divide-y divide-slate-800">
          {filteredVoters.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Tidak ada data pemilih yang ditemukan.
            </div>
          ) : (
            filteredVoters.map((voter) => (
              <div key={voter.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{voter.nama}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">NIK: {voter.nik}</p>
                  </div>
                  <div>
                    {getStatusBadge(voter.status)}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Lokasi:
                    </span>
                    <span className="font-semibold text-white">{voter.subdistrict} • {voter.tps}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-cyan-400" />
                      Telepon:
                    </span>
                    <span className="font-mono text-cyan-300">{voter.phone}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    Alamat: {voter.address}
                  </div>
                  {voter.notes && (
                    <div className="text-[11px] text-amber-300/90 italic pt-1">
                      Catatan: "{voter.notes}"
                    </div>
                  )}
                </div>

                {/* Quick Status Change Buttons & Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickStatusToggle(voter, 'pendukung')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        voter.status === 'pendukung'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Pendukung
                    </button>
                    <button
                      onClick={() => handleQuickStatusToggle(voter, 'swing')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        voter.status === 'swing'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Swing
                    </button>
                    <button
                      onClick={() => handleQuickStatusToggle(voter, 'penolak')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        voter.status === 'penolak'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Penolak
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(voter)}
                      className="p-1.5 rounded-lg bg-slate-800 text-cyan-400"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data ${voter.nama}?`)) {
                          onDeleteVoter(voter.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Voter Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                {editingVoter ? 'Edit Data Pemilih' : 'Tambah Pemilih DPT Baru'}
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
                <label className="block text-slate-300 font-medium mb-1">NIK (Nomor Induk Kependudukan)</label>
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="320101..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Lengkap Pemilih</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Nama Lengkap sesuai KTP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                    placeholder="0812..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori Dukungan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VoterStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="pendukung">Pendukung (Siap)</option>
                    <option value="swing">Swing Voter</option>
                    <option value="penolak">Penolak (Lawan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Desa / Kelurahan</label>
                  <input
                    type="text"
                    required
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Desa Sukamaju"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">TPS (Tempat Pemungutan Suara)</label>
                  <input
                    type="text"
                    required
                    value={tps}
                    onChange={(e) => setTps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    placeholder="TPS 01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alamat Lengkap (RT/RW/Dusun)</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Jl. Merdeka RT 02/01"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Catatan Khusus Pemilih</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Contoh: Tokoh masyarakat, butuh sembako, dll."
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pemilih</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
