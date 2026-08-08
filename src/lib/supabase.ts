import { createClient } from '@supabase/supabase-js';
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
import { 
  initialCampaignConfig, 
  initialUsers, 
  initialVoters, 
  initialActivityReports, 
  initialUrgentEvents, 
  initialOpponents, 
  initialOwnerCommands,
  initialNotifications
} from '../data/initialData';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  CONFIG: 'pemenangan_config',
  USERS: 'pemenangan_users',
  VOTERS: 'pemenangan_voters',
  ACTIVITIES: 'pemenangan_activities',
  URGENT_EVENTS: 'pemenangan_urgent_events',
  OPPONENTS: 'pemenangan_opponents',
  COMMANDS: 'pemenangan_commands',
  NOTIFICATIONS: 'pemenangan_notifications',
  CURRENT_USER: 'pemenangan_current_user'
};

// Data Helper with LocalStorage Fallback & Real-time State
export class StorageService {
  // Campaign Config
  static getCampaignConfig(): CampaignConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialCampaignConfig));
      return initialCampaignConfig;
    }
    return JSON.parse(data);
  }

  static saveCampaignConfig(config: CampaignConfig): CampaignConfig {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    return config;
  }

  // Users
  static getUsers(): UserAccount[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialUsers;
    } catch {
      return initialUsers;
    }
  }

  static saveUsers(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static saveUser(user: UserAccount) {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    StorageService.saveUsers(users);
  }

  static updateUserStatus(userId: string, status: any, role?: any, assignedRegion?: string) {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].status = status;
      if (role) users[index].role = role;
      if (assignedRegion !== undefined) users[index].assignedRegion = assignedRegion;
      StorageService.saveUsers(users);
    }
  }

  static getCurrentUser(): UserAccount {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) {
      const defaultUser = initialUsers[1]; // Owner default
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(data);
  }

  static setCurrentUser(user: UserAccount) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  // Voters
  static getVoters(): Voter[] {
    const data = localStorage.getItem(STORAGE_KEYS.VOTERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(initialVoters));
      return initialVoters;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialVoters;
    } catch {
      return initialVoters;
    }
  }

  static saveVoters(voters: Voter[]) {
    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(voters));
  }

  static saveVoter(voter: Voter) {
    const voters = StorageService.getVoters();
    const index = voters.findIndex(v => v.id === voter.id);
    if (index >= 0) {
      voters[index] = voter;
    } else {
      voters.unshift(voter);
    }
    StorageService.saveVoters(voters);
  }

  static deleteVoter(id: string) {
    const voters = StorageService.getVoters().filter(v => v.id !== id);
    StorageService.saveVoters(voters);
  }

  // Activities
  static getActivities(): ActivityReport[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivityReports));
      return initialActivityReports;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialActivityReports;
    } catch {
      return initialActivityReports;
    }
  }

  static saveActivities(activities: ActivityReport[]) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  static saveActivity(act: ActivityReport) {
    const activities = StorageService.getActivities();
    const index = activities.findIndex(a => a.id === act.id);
    if (index >= 0) {
      activities[index] = act;
    } else {
      activities.unshift(act);
    }
    StorageService.saveActivities(activities);
  }

  static deleteActivity(id: string) {
    const activities = StorageService.getActivities().filter(a => a.id !== id);
    StorageService.saveActivities(activities);
  }

  // Urgent Events
  static getUrgentEvents(): UrgentEvent[] {
    const data = localStorage.getItem(STORAGE_KEYS.URGENT_EVENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.URGENT_EVENTS, JSON.stringify(initialUrgentEvents));
      return initialUrgentEvents;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialUrgentEvents;
    } catch {
      return initialUrgentEvents;
    }
  }

  static getEvents(): UrgentEvent[] {
    return StorageService.getUrgentEvents();
  }

  static saveUrgentEvents(events: UrgentEvent[]) {
    localStorage.setItem(STORAGE_KEYS.URGENT_EVENTS, JSON.stringify(events));
  }

  static saveUrgentEvent(event: UrgentEvent) {
    const events = StorageService.getUrgentEvents();
    const index = events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.unshift(event);
    }
    StorageService.saveUrgentEvents(events);
  }

  static saveEvent(event: UrgentEvent) {
    StorageService.saveUrgentEvent(event);
  }

  static deleteUrgentEvent(id: string) {
    const events = StorageService.getUrgentEvents().filter(e => e.id !== id);
    StorageService.saveUrgentEvents(events);
  }

  static deleteEvent(id: string) {
    StorageService.deleteUrgentEvent(id);
  }

  // Opponents
  static getOpponents(): Opponent[] {
    const data = localStorage.getItem(STORAGE_KEYS.OPPONENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.OPPONENTS, JSON.stringify(initialOpponents));
      return initialOpponents;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialOpponents;
    } catch {
      return initialOpponents;
    }
  }

  static saveOpponents(opponents: Opponent[]) {
    localStorage.setItem(STORAGE_KEYS.OPPONENTS, JSON.stringify(opponents));
  }

  static saveOpponent(opponent: Opponent) {
    const opponents = StorageService.getOpponents();
    const index = opponents.findIndex(o => o.id === opponent.id);
    if (index >= 0) {
      opponents[index] = opponent;
    } else {
      opponents.unshift(opponent);
    }
    StorageService.saveOpponents(opponents);
  }

  static deleteOpponent(id: string) {
    const opponents = StorageService.getOpponents().filter(o => o.id !== id);
    StorageService.saveOpponents(opponents);
  }

  // Commands
  static getOwnerCommands(): OwnerCommand[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMMANDS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.COMMANDS, JSON.stringify(initialOwnerCommands));
      return initialOwnerCommands;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialOwnerCommands;
    } catch {
      return initialOwnerCommands;
    }
  }

  static getCommands(): OwnerCommand[] {
    return StorageService.getOwnerCommands();
  }

  static saveOwnerCommands(commands: OwnerCommand[]) {
    localStorage.setItem(STORAGE_KEYS.COMMANDS, JSON.stringify(commands));
  }

  static saveOwnerCommand(cmd: OwnerCommand) {
    const commands = StorageService.getOwnerCommands();
    const index = commands.findIndex(c => c.id === cmd.id);
    if (index >= 0) {
      commands[index] = cmd;
    } else {
      commands.unshift(cmd);
    }
    StorageService.saveOwnerCommands(commands);
  }

  static saveCommand(cmd: OwnerCommand) {
    StorageService.saveOwnerCommand(cmd);
  }

  static deleteOwnerCommand(id: string) {
    const commands = StorageService.getOwnerCommands().filter(c => c.id !== id);
    StorageService.saveOwnerCommands(commands);
  }

  static deleteCommand(id: string) {
    StorageService.deleteOwnerCommand(id);
  }

  // Notifications
  static getNotifications(): AppNotification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
      return initialNotifications;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialNotifications;
    } catch {
      return initialNotifications;
    }
  }

  static saveNotifications(notifications: AppNotification[]) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  // Backup & Restore
  static exportBackupJSON(): string {
    const backup = {
      config: StorageService.getCampaignConfig(),
      users: StorageService.getUsers(),
      voters: StorageService.getVoters(),
      activities: StorageService.getActivities(),
      urgentEvents: StorageService.getUrgentEvents(),
      opponents: StorageService.getOpponents(),
      commands: StorageService.getOwnerCommands(),
      notifications: StorageService.getNotifications(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.config) StorageService.saveCampaignConfig(data.config);
      if (data.users) StorageService.saveUsers(data.users);
      if (data.voters) StorageService.saveVoters(data.voters);
      if (data.activities) StorageService.saveActivities(data.activities);
      if (data.urgentEvents) StorageService.saveUrgentEvents(data.urgentEvents);
      if (data.opponents) StorageService.saveOpponents(data.opponents);
      if (data.commands) StorageService.saveOwnerCommands(data.commands);
      if (data.notifications) StorageService.saveNotifications(data.notifications);
      return true;
    } catch (e) {
      return false;
    }
  }

  static resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(initialCampaignConfig));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(initialVoters));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(initialActivityReports));
    localStorage.setItem(STORAGE_KEYS.URGENT_EVENTS, JSON.stringify(initialUrgentEvents));
    localStorage.setItem(STORAGE_KEYS.OPPONENTS, JSON.stringify(initialOpponents));
    localStorage.setItem(STORAGE_KEYS.COMMANDS, JSON.stringify(initialOwnerCommands));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[1]));
  }

  // Instance methods delegating to static methods for instantiated usage (new StorageService())
  getCampaignConfig() { return StorageService.getCampaignConfig(); }
  saveCampaignConfig(config: CampaignConfig) { return StorageService.saveCampaignConfig(config); }
  getUsers() { return StorageService.getUsers(); }
  saveUsers(users: UserAccount[]) { return StorageService.saveUsers(users); }
  saveUser(user: UserAccount) { return StorageService.saveUser(user); }
  updateUserStatus(userId: string, status: any, role?: any, assignedRegion?: string) { return StorageService.updateUserStatus(userId, status, role, assignedRegion); }
  getCurrentUser() { return StorageService.getCurrentUser(); }
  setCurrentUser(user: UserAccount) { return StorageService.setCurrentUser(user); }
  getVoters() { return StorageService.getVoters(); }
  saveVoters(voters: Voter[]) { return StorageService.saveVoters(voters); }
  saveVoter(voter: Voter) { return StorageService.saveVoter(voter); }
  deleteVoter(id: string) { return StorageService.deleteVoter(id); }
  getActivities() { return StorageService.getActivities(); }
  saveActivities(activities: ActivityReport[]) { return StorageService.saveActivities(activities); }
  saveActivity(act: ActivityReport) { return StorageService.saveActivity(act); }
  deleteActivity(id: string) { return StorageService.deleteActivity(id); }
  getUrgentEvents() { return StorageService.getUrgentEvents(); }
  getEvents() { return StorageService.getEvents(); }
  saveUrgentEvents(events: UrgentEvent[]) { return StorageService.saveUrgentEvents(events); }
  saveUrgentEvent(event: UrgentEvent) { return StorageService.saveUrgentEvent(event); }
  saveEvent(event: UrgentEvent) { return StorageService.saveEvent(event); }
  deleteUrgentEvent(id: string) { return StorageService.deleteUrgentEvent(id); }
  deleteEvent(id: string) { return StorageService.deleteEvent(id); }
  getOpponents() { return StorageService.getOpponents(); }
  saveOpponents(opponents: Opponent[]) { return StorageService.saveOpponents(opponents); }
  saveOpponent(opp: Opponent) { return StorageService.saveOpponent(opp); }
  deleteOpponent(id: string) { return StorageService.deleteOpponent(id); }
  getOwnerCommands() { return StorageService.getOwnerCommands(); }
  getCommands() { return StorageService.getCommands(); }
  saveOwnerCommands(commands: OwnerCommand[]) { return StorageService.saveOwnerCommands(commands); }
  saveOwnerCommand(cmd: OwnerCommand) { return StorageService.saveOwnerCommand(cmd); }
  saveCommand(cmd: OwnerCommand) { return StorageService.saveOwnerCommand(cmd); }
  deleteOwnerCommand(id: string) { return StorageService.deleteOwnerCommand(id); }
  deleteCommand(id: string) { return StorageService.deleteCommand(id); }
  getNotifications() { return StorageService.getNotifications(); }
  saveNotifications(notifications: AppNotification[]) { return StorageService.saveNotifications(notifications); }
  exportBackupJSON() { return StorageService.exportBackupJSON(); }
  importBackupJSON(jsonStr: string) { return StorageService.importBackupJSON(jsonStr); }
  resetToDefault() { return StorageService.resetToDefault(); }
  resetToDemoData() { return StorageService.resetToDefault(); }
}
