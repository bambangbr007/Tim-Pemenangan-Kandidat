import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { User, Lock, Phone, MapPin, Check, X, Shield, Users, LogIn, UserPlus } from 'lucide-react';

interface LoginModalProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onRegisterUser: (name: string, email: string, phone: string, role: UserRole, assignedRegion: string) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUser,
  onSwitchUser,
  onRegisterUser,
  onClose
}) => {
  const [mode, setMode] = useState<'switch' | 'register'>('switch');

  // Register state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('0812');
  const [role, setRole] = useState<UserRole>('tim_pemenangan');
  const [assignedRegion, setAssignedRegion] = useState('Desa Sukamaju');
  const [registered, setRegistered] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onRegisterUser(name, email, phone, role, assignedRegion);
    setRegistered(true);
    setTimeout(() => {
      setRegistered(false);
      setMode('switch');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Akun & Sesi Pengguna</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setMode('switch')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'switch' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pilih Akun Demo (Simulasi)
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {mode === 'switch' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Pilih salah satu peran pengguna di bawah untuk menguji fitur Owner, Admin, atau Tim Pemenangan:
            </p>

            <div className="space-y-2 pt-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    currentUser.id === u.id
                      ? 'bg-cyan-950/60 border-cyan-500 shadow-lg'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{u.name}</span>
                      {currentUser.id === u.id && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                          AKTIF
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{u.email} • {u.assignedRegion || 'Akses Nasional'}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    u.role === 'owner' 
                      ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                      : u.role === 'admin'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                placeholder="Nama Lengkap"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                placeholder="email@pemenangan.com"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">No. WhatsApp</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                placeholder="0812..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Role / Peran</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="tim_pemenangan">Tim Pemenangan</option>
                  <option value="owner">Owner / Kandidat</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Wilayah Penugasan</label>
                <input
                  type="text"
                  required
                  value={assignedRegion}
                  onChange={(e) => setAssignedRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  placeholder="Desa Sukamaju"
                />
              </div>
            </div>

            {registered && (
              <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold">
                Pendaftaran berhasil! Akun anda dikirim ke Admin untuk persetujuan.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30"
            >
              Kirim Pendaftaran Akun
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
