import React, { useState } from 'react';
import { UrgentEvent, EventLevel, UserAccount, CampaignConfig } from '../types';
import { 
  AlertTriangle, 
  Plus, 
  Video, 
  Image as ImageIcon, 
  MessageSquare, 
  Send, 
  MapPin, 
  ShieldAlert, 
  X, 
  Check, 
  Trash2,
  ExternalLink
} from 'lucide-react';

interface UrgentEventsProps {
  events: UrgentEvent[];
  currentUser: UserAccount;
  config: CampaignConfig;
  onAddEvent: (event: Omit<UrgentEvent, 'id' | 'createdAt'>) => void;
  onDeleteEvent: (id: string) => void;
}

export const UrgentEvents: React.FC<UrgentEventsProps> = ({
  events = [],
  currentUser,
  config,
  onAddEvent,
  onDeleteEvent
}) => {
  const safeEvents = Array.isArray(events) ? events : [];
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<EventLevel>('tinggi');
  const [location, setLocation] = useState('');
  const [tps, setTps] = useState('TPS 01');
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleOpenAddModal = () => {
    setTitle('');
    setDescription('');
    setLevel('tinggi');
    setLocation(currentUser.assignedRegion || 'Desa Sukamaju');
    setTps('TPS 01');
    setPhotoUrl('https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80');
    setVideoUrl('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onAddEvent({
      title,
      description,
      level,
      location,
      tps,
      photoUrl: photoUrl || undefined,
      videoUrl: videoUrl || undefined,
      reportedById: currentUser.id,
      reportedByName: currentUser.name,
      whatsappSent: true
    });

    setShowModal(false);
  };

  // Generate Direct WhatsApp URL for Emergency Event
  const getWhatsAppLink = (event: UrgentEvent) => {
    const ownerPhone = config.ownerWhatsapp || '6281234567890';
    const message = `🚨 *LAPORAN KEJADIAN PENTING / EMERGENCY* 🚨\n\n` +
      `*Judul:* ${event.title}\n` +
      `*Tingkat Bahaya:* ${event.level.toUpperCase()}\n` +
      `*Lokasi:* ${event.location} (${event.tps})\n` +
      `*Pelapor:* ${event.reportedByName}\n\n` +
      `*Rincian Kejadian:*\n${event.description}\n\n` +
      (event.photoUrl ? `*Foto Bukti:* ${event.photoUrl}\n` : '') +
      (event.videoUrl ? `*Video Bukti:* ${event.videoUrl}\n` : '') +
      `Mohon Komando & Arahan dari Bapak ${config.candidateName}. Terima kasih.`;

    return `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const getLevelBadge = (lvl: EventLevel) => {
    switch (lvl) {
      case 'darurat':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">DARURAT TINGGI</span>;
      case 'tinggi':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">SANGAT PENTING</span>;
      case 'sedang':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">PERHATIAN SEDANG</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-red-900/50 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Laporan Kejadian Penting & Darurat ({safeEvents.length})
          </h2>
          <p className="text-xs text-slate-300">
            Pusat siaga kecurangan, pergerakan lawan, dan kejadian darurat langsung terhubung ke WhatsApp Owner
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Laporkan Kejadian Sekarang</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {safeEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
            Tidak ada laporan kejadian penting saat ini. Lapangan aman terkendali.
          </div>
        ) : (
          safeEvents.map((event) => (
            <div 
              key={event.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 hover:border-red-900/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  {getLevelBadge(event.level)}
                  <h3 className="font-bold text-white text-base">{event.title}</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(event.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} WIB
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {event.description}
              </p>

              {/* Photo & Video Links */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {event.photoUrl && (
                  <a
                    href={event.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Lihat Foto Bukti</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                {event.videoUrl && (
                  <a
                    href={event.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-medium border border-purple-800/50"
                  >
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <span>Putar Video Durasi Pendek</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                )}
              </div>

              {/* Footer Location & WhatsApp Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {event.location} ({event.tps})
                  </span>
                  <span>• Pelapor: <strong className="text-white">{event.reportedByName}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Teruskan ke WhatsApp Owner</span>
                  </a>

                  {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                    <button
                      onClick={() => {
                        if (confirm('Hapus laporan kejadian ini?')) {
                          onDeleteEvent(event.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-800 text-red-400 hover:bg-red-900/60"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Urgent Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Laporkan Kejadian Penting / Darurat
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
                <label className="block text-slate-300 font-medium mb-1">Judul Kejadian</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  placeholder="Contoh: Perusakan Baliho / Pembagian Sembako Gelap"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tingkat Urgensi</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as EventLevel)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 font-bold"
                  >
                    <option value="darurat">Darurat Tinggi</option>
                    <option value="tinggi">Sangat Penting</option>
                    <option value="sedang">Perhatian Sedang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target TPS / Dusun</label>
                  <input
                    type="text"
                    required
                    value={tps}
                    onChange={(e) => setTps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                    placeholder="TPS 02 Desa Sukamaju"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Lokasi Detail Kejadian</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  placeholder="Pertigaan RW 03 Kampung Krajan"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Deskripsi Lengkap Kejadian</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500"
                  placeholder="Jelaskan kronologi singkat, Siapa pelaku/tim lawan, Kapan terjadi..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">URL Foto Bukti (Opsional)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Link Video Pendek Bukti (Opsional)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
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
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim & Sambungkan WA Owner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
