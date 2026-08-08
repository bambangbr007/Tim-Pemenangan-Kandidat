import React from 'react';
import { 
  Voter, 
  ActivityReport, 
  UrgentEvent, 
  Opponent, 
  CampaignConfig,
  UserAccount 
} from '../types';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  UserX, 
  HelpCircle, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Plus, 
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';

interface DashboardProps {
  config: CampaignConfig;
  voters?: Voter[];
  activities?: ActivityReport[];
  urgentEvents?: UrgentEvent[];
  events?: UrgentEvent[];
  opponents?: Opponent[];
  commands?: any[];
  currentUser?: UserAccount;
  onSelectTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onOpenAddVoterModal?: () => void;
  onOpenAddActivityModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  config,
  voters = [],
  activities = [],
  urgentEvents,
  events,
  opponents = [],
  currentUser,
  onSelectTab,
  setActiveTab,
  onOpenAddVoterModal,
  onOpenAddActivityModal
}) => {
  const safeVoters = Array.isArray(voters) ? voters : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeEvents = Array.isArray(urgentEvents) ? urgentEvents : (Array.isArray(events) ? events : []);
  const safeOpponents = Array.isArray(opponents) ? opponents : [];

  const handleTabChange = (tab: string) => {
    if (onSelectTab) onSelectTab(tab);
    else if (setActiveTab) setActiveTab(tab);
  };

  // Statistical Pure Functions & Pure Calculations
  const totalVoters = safeVoters.length;
  const pendukungCount = safeVoters.filter(v => v.status === 'pendukung').length;
  const penolakCount = safeVoters.filter(v => v.status === 'penolak').length;
  const swingCount = safeVoters.filter(v => v.status === 'swing').length;

  const targetAchievedPercent = config.targetVotes > 0 
    ? Math.min(100, Math.round((pendukungCount / config.targetVotes) * 100)) 
    : 0;

  const swingPercent = totalVoters > 0 
    ? Math.round((swingCount / totalVoters) * 100) 
    : 0;

  // Pie Chart Data
  const pieData = [
    { name: 'Pendukung (Siap)', value: pendukungCount, color: '#10b981' },
    { name: 'Swing Voter', value: swingCount, color: '#f59e0b' },
    { name: 'Penolak (Tidak Mau)', value: penolakCount, color: '#ef4444' }
  ];

  // Bar Chart Data: Group Voters by Subdistrict / Desa
  const subdistricts = Array.from(new Set(safeVoters.map(v => v.subdistrict)));
  const barData = subdistricts.map(sub => {
    const subVoters = safeVoters.filter(v => v.subdistrict === sub);
    const pendukung = subVoters.filter(v => v.status === 'pendukung').length;
    const swing = subVoters.filter(v => v.status === 'swing').length;
    const penolak = subVoters.filter(v => v.status === 'penolak').length;
    return {
      desa: sub,
      Pendukung: pendukung,
      Swing: swing,
      Penolak: penolak
    };
  });

  // Area Chart Data: Trend Simulation from Activity Dates
  const activityDates = Array.from(new Set(safeActivities.map(a => a.date))).sort();
  let cumulativeVotes = 0;
  const trendData = activityDates.map(date => {
    const countOnDate = safeVoters.filter(v => v.updatedAt.startsWith(date) && v.status === 'pendukung').length;
    cumulativeVotes += countOnDate || 2; // baseline progression
    return {
      tanggal: new Date(String(date)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      'Target Akumulasi': Math.min(config.targetVotes, cumulativeVotes + 20)
    };
  });

  if (trendData.length === 0) {
    trendData.push(
      { tanggal: '1 Feb', 'Target Akumulasi': 5 },
      { tanggal: '3 Feb', 'Target Akumulasi': 12 },
      { tanggal: '5 Feb', 'Target Akumulasi': 25 },
      { tanggal: '7 Feb', 'Target Akumulasi': pendukungCount }
    );
  }

  return (
    <div className="space-y-4 pb-8 font-sans">
      {/* Top Banner / Welcome Callout in Bento Style */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] border border-white/5 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold border border-amber-500/20">
                Pusat Pemantauan Real-Time
              </span>
              <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-full text-[10px] border border-white/10">
                Live GPS & Real-time Data
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {config.candidateName || 'PANTAUAN PEMENANGAN'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Target Suara Wilayah: <strong className="text-white font-bold">{config.targetVotes.toLocaleString('id-ID')}</strong> Suara dari Total DPT {config.totalDpt.toLocaleString('id-ID')}.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onOpenAddVoterModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pemilih</span>
            </button>
            <button
              onClick={onOpenAddActivityModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Lapor Kegiatan</span>
            </button>
          </div>
        </div>

        {/* Progress Bar To Target */}
        <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              Capaian Riil Target Suara
            </span>
            <span className="text-amber-500 font-bold">{pendukungCount.toLocaleString('id-ID')} / {config.targetVotes.toLocaleString('id-ID')} ({targetAchievedPercent}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${Math.max(3, targetAchievedPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Bento Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pendukung / Locked Votes */}
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pendukung (Siap)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{pendukungCount.toLocaleString('id-ID')}</h2>
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            +{targetAchievedPercent}% Target Suara
          </p>
        </div>

        {/* KPI 2: Swing Voters */}
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Swing Voter</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-500">{swingCount.toLocaleString('id-ID')}</h2>
          <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {swingPercent}% Potensi Penggalangan
          </p>
        </div>

        {/* KPI 3: Penolak */}
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Penolak (Lawan)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{penolakCount.toLocaleString('id-ID')}</h2>
          <p className="text-[10px] text-slate-400 mt-2">
            Terdata di basis lawan
          </p>
        </div>

        {/* KPI 4: Total Pemilih Terdata */}
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Pemilih Terdata</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{totalVoters.toLocaleString('id-ID')}</h2>
          <p className="text-[10px] text-indigo-300 mt-2">
            Dari {config.totalDpt.toLocaleString('id-ID')} DPT Wilayah
          </p>
        </div>
      </div>

      {/* Main Charts Section - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 1: Voter Classification Pie Chart */}
        <div className="lg:col-span-4 bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Klasifikasi Suara
            </h3>
            <button
              onClick={() => handleTabChange('voters')}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-0.5"
            >
              <span>Detail</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-2 pt-3 border-t border-white/5">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Regional / Sub-district Voter Comparison Bar Chart */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-amber-500" />
                Sebaran Pemilih Per Wilayah
              </h3>
              <p className="text-[11px] text-slate-400">Distribusi Pendukung, Swing Voter, dan Penolak per Desa</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="desa" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Pendukung" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Swing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Penolak" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Grid: AI Strategy Assistant Card & Urgent Field Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* AI Strategy Assistant Bento Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-indigo-900 to-[#0f172a] border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 shadow-[0_0_30px_rgba(79,70,229,0.15)] justify-between">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-indigo-200 uppercase tracking-tight text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                AI Strategy Assistant
              </h3>
              <span className="text-[10px] bg-white/10 text-white px-2.5 py-0.5 rounded font-medium">Command Panel</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed italic">
              "Konsultasi situasi lapangan, respon taktis pergerakan lawan, dan otomatisasi pembuatan pesan komando WhatsApp ke Korlap Desa."
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={() => handleTabChange('ai_advisor')}
                className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-full transition-all shadow-md active:scale-95"
              >
                Kirim Perintah ke Tim
              </button>
              <button
                onClick={() => handleTabChange('ai_advisor')}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-all"
              >
                Cek Data Dasar AI
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Field Events Bento Card */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Laporan Kejadian Penting ({safeEvents.length})
            </h4>
            <button
              onClick={() => handleTabChange('events')}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {safeEvents.slice(0, 2).map((event) => (
              <div 
                key={event.id}
                onClick={() => handleTabChange('events')}
                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white truncate max-w-[180px]">{event.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    event.level === 'darurat' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {event.level.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-1">{event.description}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{event.location} • {event.tps}</span>
                  <span>Oleh: {event.reportedByName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities Feed */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Laporan Lapangan Terakhir
          </h3>
          <button
            onClick={() => handleTabChange('activities')}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-0.5"
          >
            <span>Lihat Semua Kegiatan</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activities.slice(0, 3).map((act) => (
            <div key={act.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-amber-400 uppercase">{act.type}</span>
                  <span>{new Date(act.date).toLocaleDateString('id-ID')}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 mb-1">{act.title}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 mb-2">{act.notes}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Capaian Lapangan</span>
                  <span className="font-bold text-amber-500">{act.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${act.progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">Oleh: {act.createdByName}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
