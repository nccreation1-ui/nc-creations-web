import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealityShowSection } from './components/RealityShowSection';
import { SoundRentalsSection } from './components/SoundRentalsSection';
import { AcademyCoursesSection } from './components/AcademyCoursesSection';
import { BookingContactSection } from './components/BookingContactSection';
import { ArtistProfileModal } from './components/ArtistProfileModal';
import { WatchAndVoteModal } from './components/WatchAndVoteModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SubscribeGateModal } from './components/SubscribeGateModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { Footer } from './components/Footer';
import { StorageService, AppData } from './services/storageService';
import { LiveSheetService, LiveSyncStatus } from './services/liveSheetService';
import { GoogleSheetsDatabaseService } from './services/googleSheetsDatabaseService';
import { initAuth } from './services/googleAuth';
import { Singer, SingerSong, SoundService, AcademyCourse } from './types/database';
import { isUserSubscribed } from './services/youtubeService';
import { RefreshCw, Database, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => StorageService.getAppData());
  const [activeTab, setActiveTab] = useState<'artists' | 'sounds' | 'classes' | 'contact'>('artists');
  const [isSubscribed, setIsSubscribed] = useState(isUserSubscribed());
  const [syncStatus, setSyncStatus] = useState<LiveSyncStatus>({
    isLive: true,
    source: 'Browser LocalStorage (Permanent Database)',
    lastSyncTime: new Date().toLocaleTimeString(),
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(
    Boolean(GoogleSheetsDatabaseService.getStoredSpreadsheetId())
  );

  // Modals state
  const [selectedSingerForProfile, setSelectedSingerForProfile] = useState<Singer | null>(null);
  const [votingSong, setVotingSong] = useState<SingerSong | null>(null);
  const [votingSinger, setVotingSinger] = useState<Singer | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSubscribeGateOpen, setIsSubscribeGateOpen] = useState(false);
  const [prefilledContactSubject, setPrefilledContactSubject] = useState('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshData = async (forceFresh = false) => {
    setIsSyncing(true);
    try {
      const res = await LiveSheetService.fetchLiveData(forceFresh);
      setAppData(res.data);
      setSyncStatus(res.status);
    } catch (e) {
      console.warn('Fetch live data notice', e);
      // Fallback to local storage directly
      setAppData(StorageService.getAppData());
    } finally {
      setIsSyncing(false);
      setIsSubscribed(isUserSubscribed());
    }
  };

  // Initial load and Real-Time Local-First Listener
  useEffect(() => {
    initAuth();
    
    // Immediate sync from localStorage
    setAppData(StorageService.getAppData());

    // Listen for custom immediate local storage mutations
    const handleDbUpdated = (e: any) => {
      if (e.detail) {
        setAppData(e.detail);
      } else {
        setAppData(StorageService.getAppData());
      }
    };

    // Listen for cross-tab or cross-window updates
    const handleStorageChange = () => {
      setAppData(StorageService.getAppData());
    };

    window.addEventListener('nc_db_updated', handleDbUpdated);
    window.addEventListener('storage', handleStorageChange);

    const unsubSheet = GoogleSheetsDatabaseService.subscribe(info => {
      setIsSheetConnected(Boolean(info.spreadsheetId));
    });

    // Background sync check
    refreshData(false);

    const interval = setInterval(() => {
      refreshData(false);
    }, 10000);

    const onFocus = () => refreshData(false);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('nc_db_updated', handleDbUpdated);
      window.removeEventListener('storage', handleStorageChange);
      unsubSheet();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleOpenSingerProfile = (singer: Singer) => {
    setSelectedSingerForProfile(singer);
  };

  const handleVoteSong = (song: SingerSong, singerObj?: Singer) => {
    const targetSinger = singerObj || appData.singers.find((s) => s.singerId === song.singerId) || null;
    setVotingSinger(targetSinger);
    setVotingSong(song);
  };

  const handleVoteSuccess = (songId: string, newCount: number) => {
    refreshData(true);
    triggerToast('🎉 Official Vote recorded in Google Spreadsheet and synced globally to all devices!');
  };

  const handleBookSound = (sound: SoundService) => {
    setPrefilledContactSubject(`Rental: ${sound.title} (${sound.rentalPricing})`);
    setActiveTab('contact');
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  const handleEnrollCourse = (course: AcademyCourse) => {
    setPrefilledContactSubject(`Enrollment: ${course.title} (${course.fee})`);
    setActiveTab('contact');
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  const totalVotesCount = appData.songs.reduce((acc, s) => acc + s.voteCount, 0);

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSubscribeGate={() => setIsSubscribeGateOpen(true)}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        isSheetConnected={isSheetConnected}
      />

      {/* Live Global Database Sync Status Banner */}
      <div className="w-full bg-[#090e1c] border-b border-blue-900/20 py-1.5 px-4 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <button
              onClick={() => setIsGoogleSheetsOpen(true)}
              className="font-semibold text-slate-200 flex items-center gap-1.5 hover:text-emerald-300 transition-colors cursor-pointer text-left"
              title="Click to manage Google Sheets database"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database: {syncStatus.source}</span>
              <span className="text-[10px] text-blue-400 underline font-normal ml-1">Configure Sheet ↗</span>
            </button>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="hidden sm:inline">Last Synced: {syncStatus.lastSyncTime}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-slate-400">Multi-User Global Real-Time Sync Active</span>
            <button
              onClick={() => refreshData(true)}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 transition-colors text-[10px] font-semibold border border-blue-700/40 cursor-pointer"
              title="Force sync data with live Google Sheet"
            >
              <RefreshCw className={`w-3 h-3 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Dynamic Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-xs sm:text-sm shadow-2xl border border-blue-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Body */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onExploreVoting={() => {
            setActiveTab('artists');
            const el = document.getElementById('reality-show-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onExploreSound={() => {
            setActiveTab('sounds');
            const el = document.getElementById('sounds-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          totalVotes={totalVotesCount}
        />

        {/* Tab 1: Reality Show Artists & Voting */}
        {activeTab === 'artists' && (
          <RealityShowSection
            singers={appData.singers}
            songs={appData.songs}
            onSelectSinger={handleOpenSingerProfile}
            onQuickVoteSong={(song, singer) => handleVoteSong(song, singer)}
            isSubscribed={isSubscribed}
            onOpenSubscribeGate={() => setIsSubscribeGateOpen(true)}
          />
        )}

        {/* Tab 2: Pro Sounds & Equipment Rentals */}
        {activeTab === 'sounds' && (
          <SoundRentalsSection
            sounds={appData.sounds}
            onBookService={handleBookSound}
          />
        )}

        {/* Tab 3: Academy Courses */}
        {activeTab === 'classes' && (
          <AcademyCoursesSection
            courses={appData.courses}
            onEnrollCourse={handleEnrollCourse}
          />
        )}

        {/* Tab 4: Bookings & Contact */}
        {activeTab === 'contact' && (
          <BookingContactSection prefilledSubject={prefilledContactSubject} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* MODAL 1: Artist Multi-Song Profile Modal */}
      <ArtistProfileModal
        singer={selectedSingerForProfile}
        songs={appData.songs}
        onClose={() => setSelectedSingerForProfile(null)}
        onSelectSongToVote={(song) => handleVoteSong(song, selectedSingerForProfile!)}
      />

      {/* MODAL 2: Watch & Vote Modal */}
      <WatchAndVoteModal
        song={votingSong}
        singer={votingSinger}
        onClose={() => {
          setVotingSong(null);
          setVotingSinger(null);
        }}
        onVoteSuccess={handleVoteSuccess}
      />

      {/* MODAL 3: Studio Admin Passcode Panel */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        singers={appData.singers}
        songs={appData.songs}
        sounds={appData.sounds}
        courses={appData.courses}
        settings={appData.settings}
        auditLogs={appData.auditLogs}
        onDataChanged={() => refreshData(true)}
      />

      {/* MODAL 4: YouTube Subscription Gate Modal */}
      <SubscribeGateModal
        isOpen={isSubscribeGateOpen}
        onClose={() => setIsSubscribeGateOpen(false)}
        onSubscriptionStatusChanged={() => refreshData(false)}
      />

      {/* MODAL 5: Google Sheets Live Database Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        appData={appData}
        onRefreshData={() => refreshData(true)}
      />

    </div>
  );
}
