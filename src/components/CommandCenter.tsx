import React, { useState } from 'react';
import { OwnerCommand, UserAccount, CampaignConfig } from '../types';
import { 
  Send, 
  Plus, 
  Trash2, 
  Sparkles, 
  MessageSquare, 
  Check, 
  X, 
  Users, 
  Share2 
} from 'lucide-react';

interface CommandCenterProps {
  commands: OwnerCommand[];
  currentUser: UserAccount;
  allUsers: UserAccount[];
  config: CampaignConfig;
  onAddCommand: (title: string, message: string, targetRole: string, targetRegion?: string) => void;
  onDeleteCommand: (id: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  commands,
  currentUser,
  allUsers,
  config,
  onAddCommand,
  onDeleteCommand
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('Tim Pemenangan');
  const [targetRegion, setTargetRegion] = useState('Semua Desa');

  const safeUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeCommands = Array.isArray(commands) ? commands : [];
  const teamLeads = safeUsers.filter(u => u.role === 'tim_pemenangan' && u.status === 'approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onAddCommand(title, message, targetRole, targetRegion);
    setShowModal(false);
    setTitle('');
    setMessage('');
  };

  const getWhatsAppLink = (cmd: OwnerCommand, phone?: string) => {
    const targetPhone = phone || config.ownerWhatsapp || '6281234567890';
    const text = `📢 *INSTRUKSI KOMANDO OWNER - ${config.candidateName.toUpperCase()}* 📢\n\n` +
      `*Judul:* ${cmd.title}\n` +
      `*Target Wilayah:* ${cmd.targetRegion || 'Semua Wilayah'}\n\n` +
      `*Pesan Komando:*\n${cmd.message}\n\n` +
      `Mohon seluruh Korlap & Relawan segera menindaklanjuti. Terima kasih!`;

    return `https://wa.me/${targetPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-purple-900/50 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-400" />
            Pusat Komando Owner ({safeCommands.length})
          </h2>
          <p className="text-xs text-slate-400">
            Kirim instruksi komando ke seluruh tim pemenangan lapangan dan terhubung langsung ke WhatsApp
          </p>
        </div>

        {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Instruksi Baru</span>
          </button>
        )}
      </div>

      {/* Team Leads Direct Contact Quick List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-purple-400" />
          Kontak WhatsApp Langsung Korlap Tim Lapangan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {teamLeads.map(lead => (
            <div key={lead.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{lead.name}</p>
                <p className="text-[10px] text-slate-400">{lead.assignedRegion || 'Korlap Wilayah'}</p>
              </div>
              <a
                href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${lead.name}, mohon update laporan terkini tim pemenangan di ${lead.assignedRegion || 'wilayah anda'}. Terima kasih.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WA Korlap</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Commands List */}
      <div className="space-y-3">
        {safeCommands.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
            Belum ada instruksi komando yang dibuat.
          </div>
        ) : (
          safeCommands.map((cmd) => (
            <div 
              key={cmd.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 hover:border-purple-800/50 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {cmd.targetRole.toUpperCase()} • {cmd.targetRegion || 'SEMUA WILAYAH'}
                  </span>
                  <h3 className="font-bold text-white text-base">{cmd.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(cmd.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono whitespace-pre-line">
                {cmd.message}
              </p>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400 text-[11px]">Oleh: <strong className="text-white">{cmd.senderName}</strong></span>

                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(cmd)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Sebarkan via WhatsApp</span>
                  </a>

                  {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                    <button
                      onClick={() => {
                        if (confirm('Hapus instruksi komando ini?')) {
                          onDeleteCommand(cmd.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 text-red-400 hover:bg-red-900/60"
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

      {/* Add Command Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                Buat Instruksi Komando Baru
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
                <label className="block text-slate-300 font-medium mb-1">Judul Instruksi</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  placeholder="Contoh: Fokus Penggalangan Swing Voter di TPS 02"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Penerima</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Tim Pemenangan">Tim Pemenangan (Korlap & Relawan)</option>
                    <option value="Korlap Desa">Khusus Korlap Desa</option>
                    <option value="Tim Logistik">Khusus Tim Logistik / APK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Wilayah</label>
                  <input
                    type="text"
                    value={targetRegion}
                    onChange={(e) => setTargetRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    placeholder="Semua Desa / Desa Sukamaju"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Isi Pesan Komando Lengkap</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="Tuliskan arahan taktis yang jelas untuk dilaksanakan tim di lapangan..."
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Kirim Instruksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
