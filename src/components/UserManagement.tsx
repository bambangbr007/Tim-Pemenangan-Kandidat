import React, { useState } from 'react';
import { UserAccount, CampaignConfig, UserRole, UserStatus } from '../types';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck, 
  Settings, 
  Check, 
  X, 
  Edit3, 
  Phone, 
  MapPin, 
  Clock,
  Save,
  CheckCircle2
} from 'lucide-react';

interface UserManagementProps {
  users: UserAccount[];
  config: CampaignConfig;
  currentUser: UserAccount;
  onUpdateUserStatus: (userId: string, status: UserStatus, role?: UserRole, assignedRegion?: string) => void;
  onSaveConfig: (config: CampaignConfig) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  config,
  currentUser,
  onUpdateUserStatus,
  onSaveConfig
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'config'>('users');

  // Config Form State
  const [candidateName, setCandidateName] = useState(config.candidateName);
  const [viceCandidateName, setViceCandidateName] = useState(config.viceCandidateName);
  const [electionType, setElectionType] = useState(config.electionType);
  const [electionRegion, setElectionRegion] = useState(config.electionRegion);
  const [targetVotes, setTargetVotes] = useState<number>(config.targetVotes);
  const [totalDpt, setTotalDpt] = useState<number>(config.totalDpt);
  const [electionDate, setElectionDate] = useState(config.electionDate);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(config.ownerWhatsapp);
  const [configSaved, setConfigSaved] = useState(false);

  // Edit User Modal
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('tim_pemenangan');
  const [editRegion, setEditRegion] = useState('');

  const safeUsers = Array.isArray(users) ? users : [];
  const pendingUsers = safeUsers.filter(u => u.status === 'pending');
  const approvedUsers = safeUsers.filter(u => u.status === 'approved');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      candidateName,
      viceCandidateName,
      electionType,
      electionRegion,
      targetVotes,
      totalDpt,
      electionDate,
      ownerWhatsapp
    });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditRegion(user.assignedRegion || '');
  };

  const handleSaveUserModal = () => {
    if (!selectedUser) return;
    onUpdateUserStatus(selectedUser.id, 'approved', editRole, editRegion);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Pengaturan Aplikasi & Hak Akses Pengguna
          </h2>
          <p className="text-xs text-slate-400">
            Setujui pendaftaran tim pemenangan, atur peran, dan kelola target suara pemilihan
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pengguna ({safeUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'config' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Konfigurasi Kampanye
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Pending Registrations Section */}
          {pendingUsers.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Persetujuan Akun Tim Pemenangan Baru ({pendingUsers.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingUsers.map(user => (
                  <div key={user.id} className="p-3.5 rounded-xl bg-slate-900 border border-amber-800/80 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{user.name}</h4>
                        <p className="text-[11px] text-slate-400">{user.email} • {user.phone}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        MENUNGGU
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Wilayah Tugas: <strong className="text-cyan-300">{user.assignedRegion || 'Belum Ditentukan'}</strong>
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onUpdateUserStatus(user.id, 'approved')}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Setujui Akses</span>
                      </button>
                      <button
                        onClick={() => onUpdateUserStatus(user.id, 'rejected')}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-red-900/60 text-red-400 font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Users Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Daftar Pengguna Aktif ({approvedUsers.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama & Email</th>
                    <th className="py-3 px-4">Hak Akses / Role</th>
                    <th className="py-3 px-4">Wilayah Tugas</th>
                    <th className="py-3 px-4">Telepon WA</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {approvedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'admin' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : user.role === 'owner'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-medium">{user.assignedRegion || 'Akses Nasional'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {user.phone}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditUser(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          title="Edit Peran & Wilayah"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Config Tab Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Settings className="w-5 h-5 text-amber-400" />
            Pengaturan Utama Pemilihan & Target Suara
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nama Kandidat Utama</label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Nama Wakil Kandidat</label>
              <input
                type="text"
                value={viceCandidateName}
                onChange={(e) => setViceCandidateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Jenis Pemilihan</label>
                <input
                  type="text"
                  required
                  value={electionType}
                  onChange={(e) => setElectionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  placeholder="Pilbup / Pilkades / Pileg"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Wilayah Pemilihan</label>
                <input
                  type="text"
                  required
                  value={electionRegion}
                  onChange={(e) => setElectionRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Perolehan Suara</label>
                <input
                  type="number"
                  required
                  value={targetVotes}
                  onChange={(e) => setTargetVotes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-black focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Total DPT Wilayah</label>
                <input
                  type="number"
                  required
                  value={totalDpt}
                  onChange={(e) => setTotalDpt(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 font-bold focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Tanggal Hari Pemilihan</label>
                <input
                  type="date"
                  required
                  value={electionDate}
                  onChange={(e) => setElectionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">No. WhatsApp Utama Owner</label>
                <input
                  type="text"
                  required
                  value={ownerWhatsapp}
                  onChange={(e) => setOwnerWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="6281234567890"
                />
              </div>
            </div>

            {configSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan berhasil diperbarui dan disimpan!</span>
              </div>
            )}

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Pemilihan</span>
            </button>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Peran & Wilayah Pengguna</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 font-bold text-sm">{selectedUser.name}</p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Hak Akses / Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="tim_pemenangan">Tim Pemenangan (Relawan)</option>
                  <option value="owner">Owner (Kandidat Utama)</option>
                  <option value="admin">Admin Sistem</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Wilayah Penugasan (Desa/TPS)</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Desa Sukamaju / TPS 01"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveUserModal}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
