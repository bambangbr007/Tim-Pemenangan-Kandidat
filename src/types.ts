export type UserRole = 'admin' | 'owner' | 'tim_pemenangan';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  assignedRegion?: string;
  createdAt: string;
}

export type VoterStatus = 'pendukung' | 'penolak' | 'swing';

export interface Voter {
  id: string;
  nik: string;
  nama: string;
  phone: string;
  address: string;
  subdistrict: string; // Desa/Kelurahan
  tps: string; // e.g., "TPS 01", "TPS 02"
  status: VoterStatus;
  picId: string;
  picName: string;
  notes?: string;
  updatedAt: string;
}

export type ActivityType = 
  | 'spanduk' 
  | 'door_to_door' 
  | 'silaturahmi' 
  | 'kampanye' 
  | 'posko' 
  | 'sosialisasi'
  | 'lainnya';

export interface ActivityReport {
  id: string;
  title: string;
  type: ActivityType;
  progressPercent: number; // 0 - 100
  date: string;
  location: string;
  tps: string;
  photoUrl?: string;
  videoUrl?: string;
  notes: string;
  createdById: string;
  createdByName: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

export type EventLevel = 'darurat' | 'tinggi' | 'sedang';

export interface UrgentEvent {
  id: string;
  title: string;
  description: string;
  level: EventLevel;
  location: string;
  tps: string;
  photoUrl?: string;
  videoUrl?: string;
  reportedById: string;
  reportedByName: string;
  whatsappSent?: boolean;
  createdAt: string;
}

export interface Opponent {
  id: string;
  candidateName: string;
  party: string;
  strength: 'tinggi' | 'sedang' | 'rendah';
  estimatedVotes: number;
  dominantRegions: string[];
  notes: string;
  updatedAt: string;
}

export interface OwnerCommand {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  targetRegion?: string;
  senderId?: string;
  senderName: string;
  createdAt: string;
}

export interface AIAdviceRequest {
  problemType: string;
  customQuery: string;
  selectedRegion?: string;
}

export interface AIAdviceResponse {
  analysis: string;
  tacticalSteps: string[];
  commandMessage: string;
  createdAt: string;
}

export interface CampaignConfig {
  candidateName: string;
  viceCandidateName: string;
  electionType: string; // 'Pilkades' | 'Pilbup' | 'Pilwalkot' | 'Pileg' | 'Pilgub'
  electionRegion: string;
  targetVotes: number;
  totalDpt: number;
  electionDate: string;
  ownerWhatsapp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'command';
  read: boolean;
  createdAt: string;
  linkTab?: string;
}
