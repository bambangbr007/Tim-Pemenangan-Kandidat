import React, { useState } from 'react';
import { ActivityReport, ActivityType, UserAccount } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  CheckCircle, 
  Clock, 
  MapPin, 
  X, 
  Check, 
  Trash2,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface ActivityReportsProps {
  activities: ActivityReport[];
  currentUser: UserAccount;
  onAddActivity: (activity: Omit<ActivityReport, 'id' | 'createdAt'>) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivityReports: React.FC<ActivityReportsProps> = ({
  activities,
  currentUser,
  onAddActivity,
  onDeleteActivity
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('spanduk');
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [tps, setTps] = useState('TPS 01');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const safeActivities = Array.isArray(activities) ? activities : [];
  const filteredActivities = safeActivities.filter(act => {
    const matchesSearch = 
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.createdByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || act.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleOpenAddModal = () => {
    setTitle('');
    setType('spanduk');
    setProgressPercent(80);
    setDate(new Date().toISOString().split('T')[0]);
    setLocation(currentUser.assignedRegion || 'Desa Sukamaju');
    setTps('TPS 01');
    setPhotoUrl('https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddActivity({
      title,
      type,
      progressPercent,
      date,
      location,
      tps,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80',
      notes,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      status: 'approved'
    });

    setShowModal(false);
  };

  const getTypeLabel = (t: ActivityType) => {
    switch (t) {
      case 'spanduk': return 'Pemasangan Spanduk';
      case 'door_to_door': return 'Door to Door';
      case 'silaturahmi': return 'Silaturahmi Tokoh';
      case 'kampanye': return 'Kampanye / Rapat';
      case 'posko': return 'Pengelolaan Posko';
      case 'sosialisasi': return 'Sosialisasi Warga';
      default: return 'Kegiatan Lainnya';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            Laporan Kinerja Kegiatan Tim ({safeActivities.length})
          </h2>
          <p className="text-xs text-slate-400">
            Pencatatan kegiatan sosialisasi, spanduk, door-to-door, disertai bukti foto
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Lapor Kegiatan Hari Ini</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Judul Kegiatan, Lokasi, Relawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Semua Jenis Kegiatan</option>
          <option value="spanduk">Pemasangan Spanduk</option>
          <option value="door_to_door">Door to Door</option>
          <option value="silaturahmi">Silaturahmi Tokoh</option>
          <option value="kampanye">Kampanye / Rapat</option>
          <option value="posko">Posko Pemenangan</option>
          <option value="sosialisasi">Sosialisasi Warga</option>
        </select>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl">
            Belum ada laporan kegiatan yang sesuai.
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div 
              key={act.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                {/* Photo Header */}
                {act.photoUrl ? (
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden group">
                    <img 
                      src={act.photoUrl} 
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => setPreviewImage(act.photoUrl || null)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Lihat Foto Lengkap</span>
                    </button>
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-cyan-300 border border-slate-800 backdrop-blur">
                      {getTypeLabel(act.type)}
                    </span>
                  </div>
                ) : (
                  <div className="h-20 bg-slate-950 p-3 flex items-center justify-between border-b border-slate-800">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300">
                      {getTypeLabel(act.type)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      Disetujui
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm leading-snug">{act.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{act.notes}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{act.location} • {act.tps}</span>
                  </div>
                </div>
              </div>

              {/* Footer Progress & Relawan */}
              <div className="p-4 pt-0 border-t border-slate-800/80 mt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 pt-2">
                  <span>Capaian Kinerja</span>
                  <span className="font-bold text-cyan-400">{act.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${act.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Oleh: <strong className="text-white">{act.createdByName}</strong></span>
                  {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                    <button
                      onClick={() => {
                        if (confirm('Hapus laporan kegiatan ini?')) {
                          onDeleteActivity(act.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Activity Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
                Input Laporan Kegiatan Tim
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
                <label className="block text-slate-300 font-medium mb-1">Judul / Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Contoh: Pemasangan 50 Spanduk di Jalan Utama"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Kegiatan</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="spanduk">Pemasangan Spanduk</option>
                    <option value="door_to_door">Door to Door</option>
                    <option value="silaturahmi">Silaturahmi Tokoh</option>
                    <option value="kampanye">Kampanye / Rapat</option>
                    <option value="posko">Pengelolaan Posko</option>
                    <option value="sosialisasi">Sosialisasi Warga</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Capaian Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target TPS / Dusun</label>
                  <input
                    type="text"
                    required
                    value={tps}
                    onChange={(e) => setTps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                    placeholder="TPS 01 / Dusun Krajan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Lokasi Detail</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Jl. Utama Desa Sukamaju RW 02"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">URL Foto Bukti Kegiatan (Unsplash / Cloud)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Rincian Hasil & Catatan Lapangan</label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Jelaskan respon warga, kendala, atau pencapaian kegiatan..."
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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim Laporan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullsize Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Bukti Foto Kegiatan" 
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
