import { 
  CampaignConfig, 
  UserAccount, 
  Voter, 
  ActivityReport, 
  UrgentEvent, 
  Opponent, 
  OwnerCommand,
  AppNotification
} from '../types';

export const initialCampaignConfig: CampaignConfig = {
  candidateName: 'H. Ahmad Fauzi, S.E.',
  viceCandidateName: 'Dr. Ir. Budi Santoso, M.Si.',
  electionType: 'Pilbup (Pemilihan Bupati)',
  electionRegion: 'Kabupaten Suka Makmur',
  targetVotes: 45000,
  totalDpt: 78500,
  electionDate: '2026-11-27',
  ownerWhatsapp: '6281234567890'
};

export const initialUsers: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Administrator Sistem',
    email: 'admin@pemenangan.id',
    role: 'admin',
    status: 'approved',
    phone: '081122334455',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'usr-2',
    name: 'H. Ahmad Fauzi (Kandidat / Owner)',
    email: 'owner@pemenangan.id',
    role: 'owner',
    status: 'approved',
    phone: '081234567890',
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'usr-3',
    name: 'Rian Hidayat (Korlap Sukamaju)',
    email: 'rian@pemenangan.id',
    role: 'tim_pemenangan',
    status: 'approved',
    phone: '085298765432',
    assignedRegion: 'Desa Sukamaju',
    createdAt: '2026-01-12T10:30:00Z'
  },
  {
    id: 'usr-4',
    name: 'Siti Aminah (Korlap Kencana)',
    email: 'siti@pemenangan.id',
    role: 'tim_pemenangan',
    status: 'approved',
    phone: '081987654321',
    assignedRegion: 'Desa Kencana',
    createdAt: '2026-01-14T09:15:00Z'
  },
  {
    id: 'usr-5',
    name: 'Hendra Wijaya (Relawan TPS 03)',
    email: 'hendra@pemenangan.id',
    role: 'tim_pemenangan',
    status: 'pending',
    phone: '087711223344',
    assignedRegion: 'Desa Sukamaju - TPS 03',
    createdAt: '2026-02-01T14:20:00Z'
  }
];

export const initialVoters: Voter[] = [
  {
    id: 'vtr-1',
    nik: '3201011508820001',
    nama: 'Bambang Sudrajat',
    phone: '081299887766',
    address: 'Jl. Pemuda No. 12 RT 02/01',
    subdistrict: 'Desa Sukamaju',
    tps: 'TPS 01',
    status: 'pendukung',
    picId: 'usr-3',
    picName: 'Rian Hidayat',
    notes: 'Tokoh pemuda setempat, siap menggalang 15 anggota keluarga',
    updatedAt: '2026-02-05T10:00:00Z'
  },
  {
    id: 'vtr-2',
    nik: '3201012304850002',
    nama: 'Hj. Endang Rahayu',
    phone: '085611223344',
    address: 'Rt 01/03 Dusun Krajan',
    subdistrict: 'Desa Sukamaju',
    tps: 'TPS 01',
    status: 'pendukung',
    picId: 'usr-3',
    picName: 'Rian Hidayat',
    notes: 'Ketua Pengajian Ibu-Ibu, sepakat mendukung Paslon Fauzi-Budi',
    updatedAt: '2026-02-05T11:30:00Z'
  },
  {
    id: 'vtr-3',
    nik: '3201010911790003',
    nama: 'Suwandi Marjuki',
    phone: '081388776655',
    address: 'Jl. Merdeka RT 04/02',
    subdistrict: 'Desa Sukamaju',
    tps: 'TPS 02',
    status: 'swing',
    picId: 'usr-3',
    picName: 'Rian Hidayat',
    notes: 'Masih ragu, menunggu program bantuan modal UMKM',
    updatedAt: '2026-02-06T09:00:00Z'
  },
  {
    id: 'vtr-4',
    nik: '3201021402910004',
    nama: 'Agus Setiawan',
    phone: '081722334455',
    address: 'Kampung Baru RT 02/04',
    subdistrict: 'Desa Kencana',
    tps: 'TPS 01',
    status: 'penolak',
    picId: 'usr-4',
    picName: 'Siti Aminah',
    notes: 'Kader aktif tim lawan Paslon 01',
    updatedAt: '2026-02-06T13:45:00Z'
  },
  {
    id: 'vtr-5',
    nik: '3201021907880005',
    nama: 'Dewi Kartika',
    phone: '085233445566',
    address: 'Perum Kencana Indah Blok B5',
    subdistrict: 'Desa Kencana',
    tps: 'TPS 02',
    status: 'pendukung',
    picId: 'usr-4',
    picName: 'Siti Aminah',
    notes: 'Sudah dipasang stiker di depan rumah',
    updatedAt: '2026-02-07T08:20:00Z'
  },
  {
    id: 'vtr-6',
    nik: '3201022205930006',
    nama: 'Eko Prasetyo',
    phone: '087844556677',
    address: 'Dusun Cempaka RT 03/01',
    subdistrict: 'Desa Kencana',
    tps: 'TPS 03',
    status: 'swing',
    picId: 'usr-4',
    picName: 'Siti Aminah',
    notes: 'Ingin tatap muka langsung dengan kandidat',
    updatedAt: '2026-02-07T14:10:00Z'
  },
  {
    id: 'vtr-7',
    nik: '3201031010800007',
    nama: 'H. Mustangin',
    phone: '081255667788',
    address: 'Jl. Pesantren No. 8',
    subdistrict: 'Desa Murni',
    tps: 'TPS 01',
    status: 'pendukung',
    picId: 'usr-3',
    picName: 'Rian Hidayat',
    notes: 'Mantan Kades, punya pengaruh besar di 3 TPS',
    updatedAt: '2026-02-07T16:00:00Z'
  }
];

export const initialActivityReports: ActivityReport[] = [
  {
    id: 'act-1',
    title: 'Pemasangan Baliho Utama & Spanduk Jalan Protokol',
    type: 'spanduk',
    progressPercent: 85,
    date: '2026-02-06',
    location: 'Sepanjang Jl. Utama Desa Sukamaju',
    tps: 'TPS 01, TPS 02',
    photoUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=600&q=80',
    notes: 'Sebanyak 25 spanduk ukuran 3x1m telah terpasang rapi di titik strategis.',
    createdById: 'usr-3',
    createdByName: 'Rian Hidayat',
    status: 'approved',
    createdAt: '2026-02-06T15:30:00Z'
  },
  {
    id: 'act-2',
    title: 'Door-to-Door Sosialisasi Kartu Tani & UMKM',
    type: 'door_to_door',
    progressPercent: 60,
    date: '2026-02-07',
    location: 'RW 02 & RW 03 Desa Kencana',
    tps: 'TPS 02',
    photoUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    notes: 'Mendatangi 40 rumah warga, membagikan brosur Visi Misi dan stiker kandidat.',
    createdById: 'usr-4',
    createdByName: 'Siti Aminah',
    status: 'approved',
    createdAt: '2026-02-07T12:00:00Z'
  },
  {
    id: 'act-3',
    title: 'Silaturahmi Tokoh Agama & Pengurus Majelis Taklim',
    type: 'silaturahmi',
    progressPercent: 100,
    date: '2026-02-07',
    location: 'Majelis Taklim Nurul Huda',
    tps: 'TPS 01 Desa Sukamaju',
    photoUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
    notes: 'Diterima hangat oleh KH. Abdul Shomad. Jamaah siap mendukung program keagamaan kandidat.',
    createdById: 'usr-3',
    createdByName: 'Rian Hidayat',
    status: 'approved',
    createdAt: '2026-02-07T18:20:00Z'
  }
];

export const initialUrgentEvents: UrgentEvent[] = [
  {
    id: 'urg-1',
    title: 'Spanduk Perusakan Oleh Oknum Tidak Dikenal',
    description: 'Sebanyak 4 buah spanduk kandidat kita di pertigaan TPS 02 dirusak dan ditimpa stiker tim lawan Paslon 01.',
    level: 'sedang',
    location: 'Pertigaan RT 03 Dusun Krajan',
    tps: 'TPS 02 Desa Sukamaju',
    photoUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
    reportedById: 'usr-3',
    reportedByName: 'Rian Hidayat',
    whatsappSent: true,
    createdAt: '2026-02-07T07:15:00Z'
  },
  {
    id: 'urg-2',
    title: 'Dugaan Aksi Pembagian Sembako Gelap Tim Lawan',
    description: 'Tim lawan Paslon 03 terlihat mendatangi rumah warga swing voter pada malam hari membawa kantong sembako tanpa izin.',
    level: 'tinggi',
    location: 'Kampung Baru RT 04',
    tps: 'TPS 03 Desa Kencana',
    photoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
    reportedById: 'usr-4',
    reportedByName: 'Siti Aminah',
    whatsappSent: true,
    createdAt: '2026-02-07T21:40:00Z'
  }
];

export const initialOpponents: Opponent[] = [
  {
    id: 'opp-1',
    candidateName: 'Paslon 01 - Drs. H. Suryadi & Drs. M. Yusuf',
    party: 'Koalisi Maju Bersama',
    strength: 'tinggi',
    estimatedVotes: 28500,
    dominantRegions: ['Desa Kencana (TPS 01, 03)', 'Desa Sumber Sari'],
    notes: 'Kuat di kalangan birokrasi tua dan petahana, gencar door-to-door.',
    updatedAt: '2026-02-05T12:00:00Z'
  },
  {
    id: 'opp-2',
    candidateName: 'Paslon 03 - Hj. Ratna Juwita & A. Ridwan',
    party: 'Independen / Jalur Perseorangan',
    strength: 'sedang',
    estimatedVotes: 14200,
    dominantRegions: ['Desa Pasar Rebo', 'Desa Sukamaju (TPS 03)'],
    notes: 'Mendapat dukungan jaringan pedagang pasar dan pemilih milenial.',
    updatedAt: '2026-02-06T10:00:00Z'
  }
];

export const initialOwnerCommands: OwnerCommand[] = [
  {
    id: 'cmd-1',
    title: 'Fokus Penggalangan Swing Voter di TPS 02 & 03',
    message: 'Seluruh Korlap dan Relawan dimohon memperketat pendataan swing voter. Sosialisasikan program modal UMKM 0% dan jaminan kesehatan keluarga.',
    targetRole: 'Tim Pemenangan',
    targetRegion: 'Semua Desa',
    senderName: 'H. Ahmad Fauzi (Owner)',
    createdAt: '2026-02-06T08:00:00Z'
  },
  {
    id: 'cmd-2',
    title: 'Penambahan Spanduk Pengganti di Desa Sukamaju',
    message: 'Tim Logistik segera kirim 10 spanduk baru pengganti ke Mas Rian Hidayat. Laporkan foto pemasangan malam ini.',
    targetRole: 'Tim Pemenangan',
    targetRegion: 'Desa Sukamaju',
    senderName: 'H. Ahmad Fauzi (Owner)',
    createdAt: '2026-02-07T09:00:00Z'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Peringatan Kejadian Penting!',
    message: 'Laporan dugaan pembagian sembako tim lawan di Desa Kencana (TPS 03)',
    type: 'urgent',
    read: false,
    createdAt: '2026-02-07T21:40:00Z',
    linkTab: 'urgent-events'
  },
  {
    id: 'notif-2',
    title: 'Instruksi Baru dari Owner',
    message: 'Fokus Penggalangan Swing Voter di TPS 02 & 03',
    type: 'command',
    read: false,
    createdAt: '2026-02-06T08:00:00Z',
    linkTab: 'command-center'
  }
];
