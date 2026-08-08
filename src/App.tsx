import React, { useState, useEffect } from 'react';
import { StorageService } from './lib/supabase';
import { 
  CampaignConfig, 
  UserAccount, 
  Voter, 
  ActivityReport, 
  UrgentEvent, 
  Opponent, 
  OwnerCommand,
  UserRole,
  UserStatus
} from './types';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { VoterManagement } from './components/VoterManagement';
import { ActivityReports } from './components/ActivityReports';
import { UrgentEvents } from './components/UrgentEvents';
import { AIAdvisor } from './components/AIAdvisor';
import { CommandCenter } from './components/CommandCenter';
import { OpponentMonitor } from './components/OpponentMonitor';
import { UserManagement } from './components/UserManagement';
import { ExportReports } from './components/ExportReports';
import { BackupRestore } from './components/BackupRestore';
import { DatabaseSetupModal } from './components/DatabaseSetupModal';
import { LoginModal } from './components/LoginModal';

const storage = new StorageService();

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // App State
  const [config, setConfig] = useState<CampaignConfig>(storage.getCampaignConfig());
  const [users, setUsers] = useState<UserAccount[]>(storage.getUsers());
  const [currentUser, setCurrentUser] = useState<UserAccount>(storage.getCurrentUser());
  const [voters, setVoters] = useState<Voter[]>(storage.getVoters());
  const [activities, setActivities] = useState<ActivityReport[]>(storage.getActivities());
  const [events, setEvents] = useState<UrgentEvent[]>(storage.getEvents());
  const [opponents, setOpponents] = useState<Opponent[]>(storage.getOpponents());
  const [commands, setCommands] = useState<OwnerCommand[]>(storage.getCommands());
  const [notifications, setNotifications] = useState<any[]>(storage.getNotifications());

  // Modal Controls
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Refresh helper
  const refreshAllData = () => {
    setConfig(storage.getCampaignConfig());
    setUsers(storage.getUsers());
    setCurrentUser(storage.getCurrentUser());
    setVoters(storage.getVoters());
    setActivities(storage.getActivities());
    setEvents(storage.getEvents());
    setOpponents(storage.getOpponents());
    setCommands(storage.getCommands());
    setNotifications(storage.getNotifications());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Voter Handlers
  const handleAddVoter = (newVoter: Omit<Voter, 'id' | 'updatedAt'>) => {
    const voter: Voter = {
      ...newVoter,
      id: `voter_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    storage.saveVoter(voter);
    setVoters(storage.getVoters());
  };

  const handleUpdateVoter = (updatedVoter: Voter) => {
    storage.saveVoter(updatedVoter);
    setVoters(storage.getVoters());
  };

  const handleDeleteVoter = (id: string) => {
    storage.deleteVoter(id);
    setVoters(storage.getVoters());
  };

  // Activity Handlers
  const handleAddActivity = (newAct: Omit<ActivityReport, 'id' | 'createdAt'>) => {
    const act: ActivityReport = {
      ...newAct,
      id: `act_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    storage.saveActivity(act);
    setActivities(storage.getActivities());
  };

  const handleDeleteActivity = (id: string) => {
    storage.deleteActivity(id);
    setActivities(storage.getActivities());
  };

  // Event Handlers
  const handleAddEvent = (newEvent: Omit<UrgentEvent, 'id' | 'createdAt'>) => {
    const ev: UrgentEvent = {
      ...newEvent,
      id: `ev_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    storage.saveEvent(ev);
    setEvents(storage.getEvents());
  };

  const handleDeleteEvent = (id: string) => {
    storage.deleteEvent(id);
    setEvents(storage.getEvents());
  };

  // Command Handlers
  const handleAddCommand = (title: string, message: string, targetRole: string, targetRegion?: string) => {
    const cmd: OwnerCommand = {
      id: `cmd_${Date.now()}`,
      title,
      message,
      senderId: currentUser.id,
      senderName: currentUser.name,
      targetRole,
      targetRegion,
      createdAt: new Date().toISOString()
    };
    storage.saveCommand(cmd);
    setCommands(storage.getCommands());
  };

  const handleDeleteCommand = (id: string) => {
    storage.deleteCommand(id);
    setCommands(storage.getCommands());
  };

  // Opponent Handlers
  const handleAddOpponent = (newOpp: Omit<Opponent, 'id' | 'updatedAt'>) => {
    const opp: Opponent = {
      ...newOpp,
      id: `opp_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    storage.saveOpponent(opp);
    setOpponents(storage.getOpponents());
  };

  const handleUpdateOpponent = (updatedOpp: Opponent) => {
    storage.saveOpponent(updatedOpp);
    setOpponents(storage.getOpponents());
  };

  const handleDeleteOpponent = (id: string) => {
    storage.deleteOpponent(id);
    setOpponents(storage.getOpponents());
  };

  // User & Config Handlers
  const handleUpdateUserStatus = (userId: string, status: UserStatus, role?: UserRole, assignedRegion?: string) => {
    storage.updateUserStatus(userId, status, role, assignedRegion);
    setUsers(storage.getUsers());
  };

  const handleSaveConfig = (newConfig: CampaignConfig) => {
    storage.saveCampaignConfig(newConfig);
    setConfig(storage.getCampaignConfig());
  };

  const handleSwitchUser = (user: UserAccount) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleRegisterUser = (name: string, email: string, phone: string, role: UserRole, assignedRegion: string) => {
    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      email,
      name,
      phone,
      role,
      status: 'pending',
      assignedRegion,
      createdAt: new Date().toISOString()
    };
    storage.saveUser(newUser);
    setUsers(storage.getUsers());
  };

  const ownTeamVotes = (voters || []).filter(v => v.status === 'pendukung').length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Header Bar */}
      <Header 
        config={config} 
        currentUser={currentUser}
        allUsers={users || []}
        notifications={notifications || []}
        isSupabaseConnected={false}
        onSwitchUser={handleSwitchUser}
        onOpenDatabaseModal={() => setShowDbModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onSelectTab={setActiveTab}
        onClearNotifications={() => {
          storage.saveNotifications([]);
          setNotifications([]);
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 pb-28 md:pb-8">
        {/* Navigation Tabs Bar for Desktop/Tablet */}
        <div className="mb-4">
          <MobileNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            currentUser={currentUser}
            eventsCount={(events || []).length}
          />
        </div>

        {/* Tab Content View Handler */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            config={config} 
            voters={voters} 
            activities={activities} 
            events={events} 
            opponents={opponents} 
            commands={commands}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'voters' && (
          <VoterManagement 
            voters={voters} 
            currentUser={currentUser}
            onAddVoter={handleAddVoter}
            onUpdateVoter={handleUpdateVoter}
            onDeleteVoter={handleDeleteVoter}
          />
        )}

        {activeTab === 'activities' && (
          <ActivityReports 
            activities={activities} 
            currentUser={currentUser}
            onAddActivity={handleAddActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {activeTab === 'events' && (
          <UrgentEvents 
            events={events} 
            currentUser={currentUser}
            config={config}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {activeTab === 'ai_advisor' && (
          <AIAdvisor 
            config={config} 
            currentUser={currentUser}
            voters={voters}
            onSendOwnerCommand={(title, message) => {
              handleAddCommand(title, message, 'Tim Pemenangan', 'Semua Desa');
              setActiveTab('commands');
            }}
          />
        )}

        {activeTab === 'commands' && (
          <CommandCenter 
            commands={commands} 
            currentUser={currentUser}
            allUsers={users}
            config={config}
            onAddCommand={handleAddCommand}
            onDeleteCommand={handleDeleteCommand}
          />
        )}

        {activeTab === 'opponents' && (
          <OpponentMonitor 
            opponents={opponents} 
            currentUser={currentUser}
            config={config}
            ownTeamVotes={ownTeamVotes}
            onAddOpponent={handleAddOpponent}
            onUpdateOpponent={handleUpdateOpponent}
            onDeleteOpponent={handleDeleteOpponent}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement 
            users={users} 
            config={config}
            currentUser={currentUser}
            onUpdateUserStatus={handleUpdateUserStatus}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'reports' && (
          <ExportReports 
            config={config}
            voters={voters}
            activities={activities}
            events={events}
            opponents={opponents}
          />
        )}

        {activeTab === 'backup' && (
          <BackupRestore 
            storage={storage} 
            onRefreshData={refreshAllData} 
          />
        )}
      </main>

      {/* Database Modal */}
      {showDbModal && (
        <DatabaseSetupModal onClose={() => setShowDbModal(false)} />
      )}

      {/* Login & Role Switcher Modal */}
      {showLoginModal && (
        <LoginModal 
          users={users}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onRegisterUser={handleRegisterUser}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Mandatory Branding Footer */}
      <Footer />
    </div>
  );
}

export default App;
