import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Music,
  UserPlus,
  Settings,
  ShieldAlert,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Database,
  Download,
  Upload,
  HardDrive,
  FileSpreadsheet,
  Edit2,
  Speaker,
  GraduationCap,
} from 'lucide-react';
import { Singer, SingerSong, SoundService, AcademyCourse, SiteSettings, VoteAuditLog } from '../types/database';
import { StorageService } from '../services/storageService';
import { LiveSheetService } from '../services/liveSheetService';
import { GoogleSheetsDatabaseService } from '../services/googleSheetsDatabaseService';
import { extractYouTubeVideoId, getYouTubeThumbnails } from '../services/youtubeService';
import { CODE_GS_FULL } from '../data/gasCodeSnippets';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  singers: Singer[];
  songs: SingerSong[];
  sounds: SoundService[];
  courses: AcademyCourse[];
  settings: SiteSettings;
  auditLogs: VoteAuditLog[];
  onDataChanged: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  singers,
  songs,
  sounds,
  courses,
  settings,
  auditLogs,
  onDataChanged,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'singers_songs' | 'sounds_courses' | 'settings' | 'audit_logs' | 'code_center' | 'migration'>('singers_songs');

  // Form states
  const [newSingerName, setNewSingerName] = useState('');
  const [newSingerBio, setNewSingerBio] = useState('');
  const [selectedSingerIdForSong, setSelectedSingerIdForSong] = useState(singers[0]?.singerId || '');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongVideoIdInput, setNewSongVideoIdInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Migration states
  const [migrationJson, setMigrationJson] = useState(() => {
    return JSON.stringify(
      {
        singers: singers.map((s) => ({
          singerId: s.singerId,
          name: s.name,
          bio: s.bio,
          avatarVideoId: s.avatarVideoId || '',
          createdTimestamp: s.createdTimestamp || new Date().toISOString(),
        })),
        songs: songs.map((sg) => ({
          songId: sg.songId,
          singerId: sg.singerId,
          songTitle: sg.songTitle,
          youtubeVideoId: sg.youtubeVideoId,
          voteCount: sg.voteCount,
          isActive: sg.isActive,
          addedTimestamp: sg.addedTimestamp || new Date().toISOString(),
        })),
        settings: {
          businessName: settings.businessName,
          ownerDirector: settings.ownerDirector,
          location: settings.location,
          hotline1: settings.hotline1,
          hotline2: settings.hotline2,
          realityShowName: settings.realityShowName,
          officialBio: settings.officialBio,
        },
      },
      null,
      2
    );
  });
  const [migrationStatus, setMigrationStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Settings form
  const [settingHotline1, setSettingHotline1] = useState(settings.hotline1);
  const [settingHotline2, setSettingHotline2] = useState(settings.hotline2);
  const [settingLocation, setSettingLocation] = useState(settings.location);
  const [settingBio, setSettingBio] = useState(settings.officialBio);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState((settings as any).appsScriptUrl || '');
  const [gasTestResult, setGasTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sound Equipment CRUD State
  const [soundFormId, setSoundFormId] = useState<string | null>(null);
  const [soundTitle, setSoundTitle] = useState('');
  const [soundCategory, setSoundCategory] = useState('PA Systems');
  const [soundRentalPricing, setSoundRentalPricing] = useState('');
  const [soundSpecsText, setSoundSpecsText] = useState('');
  const [soundIsAvailable, setSoundIsAvailable] = useState(true);
  const [soundFeatured, setSoundFeatured] = useState(false);
  const [isSavingSound, setIsSavingSound] = useState(false);

  // Academy Course CRUD State
  const [courseFormId, setCourseFormId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSinhalaTitle, setCourseSinhalaTitle] = useState('');
  const [courseInstructor, setCourseInstructor] = useState('Keerthi Senkadagala (Music Director)');
  const [courseSchedule, setCourseSchedule] = useState('');
  const [courseFee, setCourseFee] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseSyllabusText, setCourseSyllabusText] = useState('');
  const [courseIsEnrolling, setCourseIsEnrolling] = useState(true);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 3500);
  };

  if (!isOpen) return null;

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await LiveSheetService.verifyAdminLogin(pinInput);
      if (res.success) {
        setIsAuthenticated(true);
        setAuthError('');
        if (!selectedSingerIdForSong && singers.length > 0) {
          setSelectedSingerIdForSong(singers[0].singerId);
        }
      } else {
        setAuthError('Access Denied: Invalid Security Passcode.');
      }
    } catch (err) {
      setAuthError('Authentication service unreachable.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAddSinger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSingerName.trim()) return;

    const res = await LiveSheetService.saveSingerProfile(
      {
        name: newSingerName.trim(),
        bio: newSingerBio.trim(),
      },
      pinInput
    );

    if (res.success) {
      setNewSingerName('');
      setNewSingerBio('');
      onDataChanged();
      if (res.singerId) setSelectedSingerIdForSong(res.singerId);
      triggerMsg('Singer Profile created and saved permanently in database!');
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleDeleteSinger = async (singerId: string) => {
    const res = await LiveSheetService.deleteSingerProfile(singerId, pinInput);
    if (res.success) {
      onDataChanged();
      triggerMsg(`Singer ${singerId} deleted permanently.`);
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSingerIdForSong || !newSongTitle.trim() || !newSongVideoIdInput.trim()) {
      triggerMsg('Please fill in Singer, Song Title, and YouTube Video ID.', 'error');
      return;
    }

    const res = await LiveSheetService.addSongToSingerProfile(
      selectedSingerIdForSong,
      newSongTitle.trim(),
      newSongVideoIdInput.trim(),
      pinInput
    );

    if (res.success) {
      setNewSongTitle('');
      setNewSongVideoIdInput('');
      onDataChanged();
      triggerMsg('Competition song added and saved permanently in database!');
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleDeleteSong = async (songId: string) => {
    const res = await LiveSheetService.deleteSong(songId, pinInput);
    if (res.success) {
      onDataChanged();
      triggerMsg(`Song ${songId} deleted permanently.`);
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      hotline1: settingHotline1,
      hotline2: settingHotline2,
      location: settingLocation,
      officialBio: settingBio,
      appsScriptUrl: appsScriptUrlInput.trim(),
    };
    if (newAdminPin.trim()) {
      payload.adminPin = newAdminPin.trim();
    }
    const res = await LiveSheetService.updateSiteSettings(payload, pinInput);

    if (res.success) {
      if (newAdminPin.trim()) {
        setPinInput(newAdminPin.trim());
        setNewAdminPin('');
      }
      onDataChanged();
      triggerMsg('Settings and credentials saved permanently in database!');
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  // SOUND CRUD HANDLERS
  const handleSaveSound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soundTitle.trim()) {
      triggerMsg('Please enter sound equipment title', 'error');
      return;
    }
    setIsSavingSound(true);
    const specs = soundSpecsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await LiveSheetService.saveSoundService(
      {
        itemId: soundFormId || undefined,
        title: soundTitle.trim(),
        category: soundCategory.trim() as SoundService['category'],
        rentalPricing: soundRentalPricing.trim() || 'Contact Studio',
        specifications: specs.length > 0 ? specs : ['Contact studio for custom technical requirements'],
        isAvailable: soundIsAvailable,
        featured: soundFeatured,
      },
      pinInput
    );
    setIsSavingSound(false);

    if (res.success) {
      setSoundFormId(null);
      setSoundTitle('');
      setSoundRentalPricing('');
      setSoundSpecsText('');
      setSoundIsAvailable(true);
      setSoundFeatured(false);
      onDataChanged();
      triggerMsg('Sound equipment saved permanently in database!');
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleEditSound = (sound: SoundService) => {
    setSoundFormId(sound.itemId);
    setSoundTitle(sound.title);
    setSoundCategory(sound.category);
    setSoundRentalPricing(sound.rentalPricing);
    setSoundSpecsText((sound.specifications || []).join('\n'));
    setSoundIsAvailable(sound.isAvailable !== false);
    setSoundFeatured(Boolean(sound.featured));
  };

  const handleCancelSoundEdit = () => {
    setSoundFormId(null);
    setSoundTitle('');
    setSoundRentalPricing('');
    setSoundSpecsText('');
    setSoundIsAvailable(true);
    setSoundFeatured(false);
  };

  const handleDeleteSound = async (itemId: string) => {
    const res = await LiveSheetService.deleteSoundService(itemId, pinInput);
    if (res.success) {
      if (soundFormId === itemId) handleCancelSoundEdit();
      onDataChanged();
      triggerMsg(`Sound equipment ${itemId} deleted permanently.`);
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  // ACADEMY COURSE CRUD HANDLERS
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      triggerMsg('Please enter course title', 'error');
      return;
    }
    setIsSavingCourse(true);
    const syllabus = courseSyllabusText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await LiveSheetService.saveAcademyCourse(
      {
        courseId: courseFormId || undefined,
        title: courseTitle.trim(),
        sinhalaTitle: courseSinhalaTitle.trim(),
        instructor: courseInstructor.trim(),
        schedule: courseSchedule.trim() || 'Flexible Scheduling',
        fee: courseFee.trim() || 'Contact Studio',
        duration: courseDuration.trim() || 'Certificate Course',
        description: courseDescription.trim(),
        syllabusHighlights: syllabus.length > 0 ? syllabus : ['Comprehensive practical and theory curriculum'],
        isEnrolling: courseIsEnrolling,
      },
      pinInput
    );
    setIsSavingCourse(false);

    if (res.success) {
      setCourseFormId(null);
      setCourseTitle('');
      setCourseSinhalaTitle('');
      setCourseInstructor('Keerthi Senkadagala (Music Director)');
      setCourseSchedule('');
      setCourseFee('');
      setCourseDuration('');
      setCourseDescription('');
      setCourseSyllabusText('');
      setCourseIsEnrolling(true);
      onDataChanged();
      triggerMsg('Academy course saved permanently in database!');
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleEditCourse = (course: AcademyCourse) => {
    setCourseFormId(course.courseId);
    setCourseTitle(course.title);
    setCourseSinhalaTitle(course.sinhalaTitle || '');
    setCourseInstructor(course.instructor);
    setCourseSchedule(course.schedule);
    setCourseFee(course.fee);
    setCourseDuration(course.duration);
    setCourseDescription(course.description);
    setCourseSyllabusText((course.syllabusHighlights || []).join('\n'));
    setCourseIsEnrolling(course.isEnrolling !== false);
  };

  const handleCancelCourseEdit = () => {
    setCourseFormId(null);
    setCourseTitle('');
    setCourseSinhalaTitle('');
    setCourseInstructor('Keerthi Senkadagala (Music Director)');
    setCourseSchedule('');
    setCourseFee('');
    setCourseDuration('');
    setCourseDescription('');
    setCourseSyllabusText('');
    setCourseIsEnrolling(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const res = await LiveSheetService.deleteAcademyCourse(courseId, pinInput);
    if (res.success) {
      if (courseFormId === courseId) handleCancelCourseEdit();
      onDataChanged();
      triggerMsg(`Academy course ${courseId} deleted permanently.`);
    } else {
      triggerMsg(res.message, 'error');
    }
  };

  const handleTestGasConnection = async () => {
    if (!appsScriptUrlInput.trim()) {
      triggerMsg('Please enter your Google Apps Script Web App URL first.', 'error');
      return;
    }
    setIsTestingGas(true);
    setGasTestResult(null);
    const result = await LiveSheetService.testGasConnection(appsScriptUrlInput.trim());
    setIsTestingGas(false);
    setGasTestResult(result);
  };

  const handleRunMigration = async () => {
    try {
      const parsed = JSON.parse(migrationJson);
      setIsMigrating(true);
      setMigrationStatus(null);
      const res = await LiveSheetService.migrateData(parsed, pinInput);
      setIsMigrating(false);
      setMigrationStatus(res);
      if (res.success) {
        onDataChanged();
      }
    } catch (err: any) {
      setIsMigrating(false);
      setMigrationStatus({ success: false, message: 'Invalid JSON format: ' + err.message });
    }
  };

  const handleResetMigrationEditor = () => {
    const currentDump = {
      singers: singers.map((s) => ({
        singerId: s.singerId,
        name: s.name,
        bio: s.bio,
        avatarVideoId: s.avatarVideoId || '',
        createdTimestamp: s.createdTimestamp || new Date().toISOString(),
      })),
      songs: songs.map((sg) => ({
        songId: sg.songId,
        singerId: sg.singerId,
        songTitle: sg.songTitle,
        youtubeVideoId: sg.youtubeVideoId,
        voteCount: sg.voteCount,
        isActive: sg.isActive,
        addedTimestamp: sg.addedTimestamp || new Date().toISOString(),
      })),
      settings: {
        businessName: settings.businessName,
        ownerDirector: settings.ownerDirector,
        location: settings.location,
        hotline1: settings.hotline1,
        hotline2: settings.hotline2,
        realityShowName: settings.realityShowName,
        officialBio: settings.officialBio,
      },
    };
    setMigrationJson(JSON.stringify(currentDump, null, 2));
    setMigrationStatus({ success: true, message: 'Loaded latest active records into editor!' });
  };

  const handleExportBackupJson = () => {
    const dataToExport = {
      exportedAt: new Date().toISOString(),
      business: "The NC Creation's Academy + Sound + Studio",
      director: 'Keerthi Senkadagala',
      singers,
      songs,
      sounds,
      courses,
      settings,
      auditLogs,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nc-creations-live-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async (snippet: string, label: string) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (e) {
      alert('Failed to copy to clipboard.');
    }
  };

  const previewCleanId = extractYouTubeVideoId(newSongVideoIdInput);
  const previewThumbs = previewCleanId ? getYouTubeThumbnails(previewCleanId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c101d] border border-white/10 rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-blue-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Google Spreadsheet Live Backend & Admin Panel</h2>
              <p className="text-xs text-slate-400">
                Connected to Google Apps Script (Code.gs) · Real-time Multi-User Global Database Sync
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPinInput('');
              }}
              className="text-xs text-red-400 hover:underline flex items-center gap-1"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Lock Panel</span>
            </button>
          )}
        </div>

        {/* Action Feedback Banner */}
        {actionMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
              actionMsg.type === 'error'
                ? 'bg-red-950/60 border-red-500/40 text-red-200'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button
              onClick={() => setActionMsg(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5"
            >
              ×
            </button>
          </div>
        )}

        {/* Auth Barrier */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto w-full my-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Studio Director Security Barrier</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized access only. Enter your master administrator passcode to manage singers, reality show voting, rental equipment, and academy classes.
            </p>

            <form onSubmit={handleAuthenticate} className="space-y-3 pt-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Administrator Passcode"
                autoFocus
                disabled={isAuthenticating}
                className="w-full text-center text-lg tracking-widest bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-500"
              />
              {authError && <p className="text-xs text-red-400 bg-red-500/10 py-1.5 px-3 rounded-lg border border-red-500/20">{authError}</p>}
              <button
                type="submit"
                disabled={isAuthenticating || !pinInput.trim()}
                className={`w-full py-3 bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-500 hover:to-blue-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg ${
                  isAuthenticating || !pinInput.trim() ? 'opacity-50 cursor-not-allowed' : 'glow-blue-red cursor-pointer shadow-red-600/25'
                }`}
              >
                {isAuthenticating ? 'Verifying Secure Passcode...' : 'Unlock Studio Control Panel'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Admin Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-blue-900/30 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('singers_songs')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'singers_songs'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 text-red-500" />
                <span>Singers & Songs Management</span>
              </button>

              <button
                onClick={() => setActiveTab('sounds_courses')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'sounds_courses'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Speaker className="w-4 h-4 text-blue-400" />
                <span>Sounds & Courses</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-red-400" />
                <span>Site Settings & Live Sheet Connection</span>
              </button>

              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'audit_logs'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Votes Audit Log ({auditLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('code_center')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'code_center'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Google Apps Script Code.gs (Full Code)</span>
              </button>

              <button
                onClick={() => setActiveTab('migration')}
                className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === 'migration'
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">Data Migration & Permanent Backup</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 space-y-8">
              
              {/* TAB 1: SINGERS & SONGS MANAGEMENT */}
              {activeTab === 'singers_songs' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add Singer */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-white">Create New Singer Base Profile</h3>
                      </div>
                      <form onSubmit={handleAddSinger} className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Singer Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newSingerName}
                            onChange={(e) => setNewSingerName(e.target.value)}
                            placeholder="e.g. Ruwanthi Perera (රුවන්ති)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Bio / Profile Info</label>
                          <textarea
                            rows={2}
                            value={newSingerBio}
                            onChange={(e) => setNewSingerBio(e.target.value)}
                            placeholder="Vocal background, performance style, experience..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-colors"
                        >
                          Save Singer Profile to Google Sheet
                        </button>
                      </form>
                    </div>

                    {/* Add Song */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Add Song to Artist in Google Sheet</h3>
                      </div>
                      <form onSubmit={handleAddSong} className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Select Artist *</label>
                          <select
                            value={selectedSingerIdForSong}
                            onChange={(e) => setSelectedSingerIdForSong(e.target.value)}
                            className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          >
                            {singers.map((s) => (
                              <option key={s.singerId} value={s.singerId}>
                                {s.singerId} - {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Song Title *</label>
                          <input
                            type="text"
                            required
                            value={newSongTitle}
                            onChange={(e) => setNewSongTitle(e.target.value)}
                            placeholder="e.g. මල් සුවඳ (Mal Suwanda - Live)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            YouTube Video ID or Link (Automatic CDN Thumbnail) *
                          </label>
                          <input
                            type="text"
                            required
                            value={newSongVideoIdInput}
                            onChange={(e) => setNewSongVideoIdInput(e.target.value)}
                            placeholder="e.g. kJQP7kiw5Fk or https://youtu.be/..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {previewThumbs && (
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                            <img
                              src={previewThumbs.hq}
                              alt="Thumbnail preview"
                              className="w-24 h-14 object-cover rounded-lg shrink-0"
                            />
                            <div className="text-xs">
                              <span className="text-emerald-400 font-semibold block">✓ Auto Thumbnail Detected</span>
                              <span className="text-slate-400 font-mono text-[11px]">ID: {previewCleanId}</span>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors"
                        >
                          Save Song to Google Sheet & Profile
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Registered Artists List */}
                  <div>
                    <h3 className="text-base font-bold text-white mb-4">
                      Current Registered Artists & Associated Songs in Google Sheet
                    </h3>
                    <div className="space-y-4">
                      {singers.map((singer) => {
                        const artistSongs = songs.filter((s) => s.singerId === singer.singerId);
                        return (
                          <div
                            key={singer.singerId}
                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {singer.singerId}
                                </span>
                                <h4 className="font-bold text-white text-sm">{singer.name}</h4>
                                <span className="text-xs text-slate-400">({artistSongs.length} songs)</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSinger(singer.singerId)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Artist</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {artistSongs.map((song) => {
                                const thumbs = getYouTubeThumbnails(song.youtubeVideoId);
                                return (
                                  <div
                                    key={song.songId}
                                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <img
                                      src={thumbs.hq}
                                      alt={song.songTitle}
                                      className="w-16 h-10 object-cover rounded shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-white truncate">{song.songTitle}</p>
                                      <span className="text-amber-400 font-mono text-[11px] tabular-nums">
                                        {song.voteCount.toLocaleString()} votes
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteSong(song.songId)}
                                      className="text-slate-500 hover:text-red-400 p-1"
                                      title="Delete Song"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SOUNDS & COURSES (DYNAMIC FULL CRUD) */}
              {activeTab === 'sounds_courses' && (
                <div className="space-y-10">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Dynamic Management: All additions, edits, and deletions are permanently written to Google Sheet tabs <strong>Services_Sounds</strong> and <strong>Classes_Courses</strong> in real time.
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono">Live Google Cloud Synced</span>
                  </div>

                  {/* 1. SPEAKER & SOUND EQUIPMENT RENTING SECTION */}
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Speaker className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Speaker & Sound Equipment Renting Details</h3>
                          <p className="text-xs text-slate-400">Add, edit pricing, update specs, or remove rental packages</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {sounds.length} Active Items
                      </span>
                    </div>

                    {/* Sound Edit / Create Form */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-400" />
                          <span>{soundFormId ? `Edit Equipment: ${soundFormId}` : 'Add New Sound / Speaker Rental Item'}</span>
                        </h4>
                        {soundFormId && (
                          <button
                            type="button"
                            onClick={handleCancelSoundEdit}
                            className="text-xs text-slate-400 hover:text-white underline"
                          >
                            Cancel Edit Mode
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveSound} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-400 mb-1">Equipment / Package Title *</label>
                            <input
                              type="text"
                              required
                              value={soundTitle}
                              onChange={(e) => setSoundTitle(e.target.value)}
                              placeholder="e.g. JBL Dual 15-inch Active Stage Speakers + Subs"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Category *</label>
                            <select
                              value={soundCategory}
                              onChange={(e) => setSoundCategory(e.target.value)}
                              className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            >
                              <option value="PA Systems">PA Systems</option>
                              <option value="Live Sound">Live Sound</option>
                              <option value="Studio Recording">Studio Recording</option>
                              <option value="Lighting & Stage">Lighting & Stage</option>
                              <option value="Speakers & Amplifiers">Speakers & Amplifiers</option>
                              <option value="Microphones & Wireless">Microphones & Wireless</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Rental Pricing *</label>
                            <input
                              type="text"
                              required
                              value={soundRentalPricing}
                              onChange={(e) => setSoundRentalPricing(e.target.value)}
                              placeholder="e.g. LKR 40,000 / Event or LKR 3,500 / Hr"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs text-slate-400 mb-1">
                              Specifications / Features (One per line)
                            </label>
                            <textarea
                              rows={2}
                              value={soundSpecsText}
                              onChange={(e) => setSoundSpecsText(e.target.value)}
                              placeholder="e.g.&#10;2x 15-inch 1200W active tops&#10;Digital Bluetooth & XLR inputs&#10;Includes stands and heavy-duty cables"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-xs text-slate-300">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={soundIsAvailable}
                              onChange={(e) => setSoundIsAvailable(e.target.checked)}
                              className="rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0"
                            />
                            <span>Available for Rent</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={soundFeatured}
                              onChange={(e) => setSoundFeatured(e.target.checked)}
                              className="rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0"
                            />
                            <span>Featured Package Badge</span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSavingSound}
                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-colors shadow-md"
                          >
                            {isSavingSound ? 'Saving to Google Sheet...' : soundFormId ? 'Update Sound Equipment' : 'Add Sound Equipment to Catalog'}
                          </button>
                          {soundFormId && (
                            <button
                              type="button"
                              onClick={handleCancelSoundEdit}
                              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Sound Equipment Cards List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sounds.map((sound) => (
                        <div
                          key={sound.itemId}
                          className={`p-4 rounded-2xl border transition-all ${
                            soundFormId === sound.itemId
                              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {sound.itemId}
                                </span>
                                <span className="text-xs text-slate-400">{sound.category}</span>
                                {sound.featured && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    ★ Featured
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-white text-sm mt-1">{sound.title}</h5>
                            </div>

                            <span className="text-xs font-bold text-amber-400 tabular-nums shrink-0">
                              {sound.rentalPricing}
                            </span>
                          </div>

                          {sound.specifications && sound.specifications.length > 0 && (
                            <ul className="text-[11px] text-slate-400 space-y-0.5 my-2 border-t border-white/5 pt-2">
                              {sound.specifications.slice(0, 3).map((sp, idx) => (
                                <li key={idx} className="truncate">• {sp}</li>
                              ))}
                              {sound.specifications.length > 3 && (
                                <li className="text-slate-500 italic">+ {sound.specifications.length - 3} more specs</li>
                              )}
                            </ul>
                          )}

                          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                            <span className={`text-[11px] ${sound.isAvailable !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                              {sound.isAvailable !== false ? '● In Stock / Available' : '○ Currently Booked'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditSound(sound)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg flex items-center gap-1 text-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3 text-amber-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSound(sound.itemId)}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1 text-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. ACADEMY COURSES & CLASSES SECTION */}
                  <div className="space-y-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Music Academy Classes & Courses Details</h3>
                          <p className="text-xs text-slate-400">Add, edit schedules, instructor info, fees, and syllabus</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {courses.length} Active Courses
                      </span>
                    </div>

                    {/* Course Edit / Create Form */}
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-400" />
                          <span>{courseFormId ? `Edit Course: ${courseFormId}` : 'Add New Music Academy Course'}</span>
                        </h4>
                        {courseFormId && (
                          <button
                            type="button"
                            onClick={handleCancelCourseEdit}
                            className="text-xs text-slate-400 hover:text-white underline"
                          >
                            Cancel Edit Mode
                          </button>
                        )}
                      </div>

                      <form onSubmit={handleSaveCourse} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Course Title (English) *</label>
                            <input
                              type="text"
                              required
                              value={courseTitle}
                              onChange={(e) => setCourseTitle(e.target.value)}
                              placeholder="e.g. Vocal Culturing & Reality Show Performance"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Sinhala Course Title (Optional)</label>
                            <input
                              type="text"
                              value={courseSinhalaTitle}
                              onChange={(e) => setCourseSinhalaTitle(e.target.value)}
                              placeholder="e.g. ගායන පුහුණුව හා හඬ පාලනය"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Instructor *</label>
                            <input
                              type="text"
                              required
                              value={courseInstructor}
                              onChange={(e) => setCourseInstructor(e.target.value)}
                              placeholder="e.g. Keerthi Senkadagala (Music Director)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Schedule / Timing *</label>
                            <input
                              type="text"
                              required
                              value={courseSchedule}
                              onChange={(e) => setCourseSchedule(e.target.value)}
                              placeholder="e.g. Saturdays | 10:00 AM - 1:00 PM"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Tuition Fee *</label>
                            <input
                              type="text"
                              required
                              value={courseFee}
                              onChange={(e) => setCourseFee(e.target.value)}
                              placeholder="e.g. LKR 6,500 / Month"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Course Duration</label>
                            <input
                              type="text"
                              value={courseDuration}
                              onChange={(e) => setCourseDuration(e.target.value)}
                              placeholder="e.g. 6 Months Certificate Course"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Course Description</label>
                            <input
                              type="text"
                              value={courseDescription}
                              onChange={(e) => setCourseDescription(e.target.value)}
                              placeholder="Overview of techniques, training goals, target audience..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Syllabus Highlights / Modules (One per line)
                          </label>
                          <textarea
                            rows={2}
                            value={courseSyllabusText}
                            onChange={(e) => setCourseSyllabusText(e.target.value)}
                            placeholder="e.g.&#10;Diaphragm breath control & posture&#10;Eastern ragas & microtone calibration&#10;Stage TV camera confidence & microphone dynamics"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="flex items-center text-xs text-slate-300">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseIsEnrolling}
                              onChange={(e) => setCourseIsEnrolling(e.target.checked)}
                              className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-0"
                            />
                            <span>Currently Accepting New Enrollments</span>
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSavingCourse}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
                          >
                            {isSavingCourse ? 'Saving to Google Sheet...' : courseFormId ? 'Update Academy Course' : 'Add Course to Curriculum'}
                          </button>
                          {courseFormId && (
                            <button
                              type="button"
                              onClick={handleCancelCourseEdit}
                              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Course Cards List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {courses.map((course) => (
                        <div
                          key={course.courseId}
                          className={`p-4 rounded-2xl border transition-all ${
                            courseFormId === course.courseId
                              ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
                              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  {course.courseId}
                                </span>
                                {course.sinhalaTitle && (
                                  <span className="text-xs text-amber-300/80 font-medium">
                                    {course.sinhalaTitle}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-white text-sm mt-1">{course.title}</h5>
                              <p className="text-xs text-slate-400 mt-0.5">Instructor: {course.instructor}</p>
                            </div>

                            <span className="text-xs font-bold text-amber-400 tabular-nums shrink-0">
                              {course.fee}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 my-2 space-y-1 border-t border-white/5 pt-2">
                            <div>Schedule: <strong className="text-slate-200">{course.schedule}</strong></div>
                            {course.duration && <div>Duration: <span className="text-slate-300">{course.duration}</span></div>}
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                            <span className={`text-[11px] ${course.isEnrolling !== false ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {course.isEnrolling !== false ? '● Enrollments Open' : '○ Cohort Closed'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg flex items-center gap-1 text-xs transition-colors"
                              >
                                <Edit2 className="w-3 h-3 text-blue-400" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.courseId)}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-1 text-xs transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS & LIVE SHEET CONNECTION */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-5">
                  <h3 className="text-sm font-bold text-white">Google Sheet Connection & Site Metadata</h3>

                  {/* Google Sheets API Direct Database Connection Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-blue-950/30 to-black/40 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Google Sheets Live Cloud Database</span>
                      </div>
                      {GoogleSheetsDatabaseService.getStoredSpreadsheetId() && (
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${GoogleSheetsDatabaseService.getStoredSpreadsheetId()}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-300 underline font-semibold flex items-center gap-1 hover:text-emerald-200"
                        >
                          <span>Open Connected Sheet ↗</span>
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {GoogleSheetsDatabaseService.getStoredSpreadsheetId()
                        ? `Connected Sheet ID: ${GoogleSheetsDatabaseService.getStoredSpreadsheetId()}. All votes, artists, sounds, and courses sync live.`
                        : 'Connect or generate your dedicated Google Sheet from the top navigation bar to enable direct real-time read and write synchronization.'}
                    </p>
                  </div>

                  {/* Apps Script Web App Connection Box */}
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Globe className="w-4 h-4" />
                      <span>Alternative: Google Apps Script Web App URL (Live Database Endpoint)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Enter the published Google Apps Script Web App URL from your Google Sheet (e.g. <code>https://script.google.com/macros/s/.../exec</code>). When configured, all votes, singers, and updates sync directly to your live Google Sheet in real time!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={appsScriptUrlInput}
                        onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestGasConnection}
                        disabled={isTestingGas}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl whitespace-nowrap transition-colors"
                      >
                        {isTestingGas ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>

                    {gasTestResult && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium border ${
                          gasTestResult.success
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/15 border-red-500/30 text-red-300'
                        }`}
                      >
                        {gasTestResult.message}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Hotline 1</label>
                      <input
                        type="text"
                        value={settingHotline1}
                        onChange={(e) => setSettingHotline1(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Hotline 2</label>
                      <input
                        type="text"
                        value={settingHotline2}
                        onChange={(e) => setSettingHotline2(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Studio Location</label>
                    <input
                      type="text"
                      value={settingLocation}
                      onChange={(e) => setSettingLocation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Official Sinhala Channel Bio</label>
                    <textarea
                      rows={3}
                      value={settingBio}
                      onChange={(e) => setSettingBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <label className="block text-xs font-bold text-white mb-1">Update Administrator Passcode (Optional)</label>
                    <p className="text-[11px] text-slate-400">
                      Leave blank to keep your current security passcode unchanged. Your passcode is verified securely on the server and is never exposed in browser code.
                    </p>
                    <input
                      type="password"
                      value={newAdminPin}
                      onChange={(e) => setNewAdminPin(e.target.value)}
                      placeholder="Enter new passcode to update..."
                      className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-colors"
                  >
                    Save Settings & Google Sheet Endpoint
                  </button>
                </form>
              )}

              {/* TAB 4: VOTES AUDIT LOG */}
              {activeTab === 'audit_logs' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Votes Audit Trail (Synced with Google Sheet: Votes_Audit_Log)</h3>
                    <p className="text-xs text-slate-400">
                      Every recorded vote includes the Vote ID, Singer ID, Song ID, Subscriber Verification Status, and Client Fingerprint.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="p-3 font-semibold">Vote ID</th>
                          <th className="p-3 font-semibold">Singer</th>
                          <th className="p-3 font-semibold">Song ID</th>
                          <th className="p-3 font-semibold">Verification Status</th>
                          <th className="p-3 font-semibold">Timestamp</th>
                          <th className="p-3 font-semibold">Client Fingerprint</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500">
                              No votes logged yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.voteId} className="hover:bg-white/[0.02]">
                              <td className="p-3 font-mono text-amber-400 font-bold">{log.voteId}</td>
                              <td className="p-3 font-mono text-slate-300">{log.singerId}</td>
                              <td className="p-3 font-mono text-slate-300">{log.songId}</td>
                              <td className="p-3">
                                <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {log.subscriberVerificationStatus}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 tabular-nums">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3 text-slate-500 truncate max-w-xs">{log.userIpAgent}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: GOOGLE APPS SCRIPT CODE.GS CENTER */}
              {activeTab === 'code_center' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Full Google Apps Script (Code.gs) Source Code
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Copy and paste this exact script into your Google Sheet's Apps Script editor (<strong>Extensions &gt; Apps Script</strong>).
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyCode(CODE_GS_FULL, 'Code.gs')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0"
                    >
                      {copiedCode === 'Code.gs' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode === 'Code.gs' ? 'Code Copied to Clipboard!' : 'Copy Full Code.gs'}</span>
                    </button>
                  </div>

                  {/* Code View Block */}
                  <div className="relative rounded-2xl bg-black/80 border border-white/10 p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{CODE_GS_FULL}</pre>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-3">
                    <h4 className="font-bold text-amber-400">First-Time Deployment Steps:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Create or open your Google Spreadsheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-400 underline">sheets.new</a>.</li>
                      <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>Delete all existing code in <code>Code.gs</code> and paste the copied code above.</li>
                      <li>Click <strong>Deploy &gt; New deployment &gt; Select type: Web app</strong>.</li>
                      <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                      <li>Click <strong>Deploy</strong>, copy the resulting Web App URL, and paste it in the <strong>Site Settings</strong> tab.</li>
                    </ol>

                    <h4 className="font-bold text-emerald-400 pt-2 border-t border-white/10">Important: How to Redeploy as a "New Version" (Without Resetting Data or Changing URL):</h4>
                    <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                      <li>Whenever you update the Apps Script code, open your Apps Script editor.</li>
                      <li>Click <strong>Deploy &gt; Manage deployments</strong> (do NOT create a new deployment!).</li>
                      <li>Click the <strong>Pencil (Edit) icon</strong> next to your active Web App deployment.</li>
                      <li>Under the <strong>Version</strong> dropdown, select <strong>"New version"</strong>.</li>
                      <li>(Optional) Type a description like <em>"Permanent ID sync & migration"</em>.</li>
                      <li>Click <strong>Deploy</strong>.</li>
                      <li><strong>Your Web App URL stays exactly the same</strong>, and all existing Google Sheet rows and votes remain 100% intact!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 6: DATA MIGRATION & PERMANENT BACKUP */}
              {activeTab === 'migration' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                        <span>Data Migration & Permanent Storage Center</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Import your previous IDs and records into Google Sheets and disk storage. Matches on <code className="text-amber-300 font-mono">Singer_ID</code> and <code className="text-amber-300 font-mono">Song_ID</code> so previous data and live vote counts are never reset.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleResetMigrationEditor}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                        title="Reload currently active records into editor"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Load Active Records</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportBackupJson}
                        className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs flex items-center gap-1.5 transition-colors font-semibold"
                        title="Download backup JSON file to your computer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Full JSON Backup</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRunMigration}
                        disabled={isMigrating}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-lg shadow-emerald-500/20"
                      >
                        {isMigrating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        <span>{isMigrating ? 'Migrating Records...' : 'Migrate & Save to Google Sheet'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Migration Status Alert */}
                  {migrationStatus && (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                        migrationStatus.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      {migrationStatus.success ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{migrationStatus.message}</p>
                        {migrationStatus.success && (
                          <p className="text-[11px] text-emerald-400/80 mt-1">
                            Records have been permanently committed to both Google Sheets (via SpreadsheetApp.flush) and server storage.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* JSON Migration Data Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">
                        Migration Payload Editor (JSON format):
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Paste your previous records or customize IDs below, then click "Migrate &amp; Save"
                      </span>
                    </div>

                    <div className="relative rounded-2xl bg-black/90 border border-white/10 p-4 font-mono text-xs">
                      <textarea
                        rows={16}
                        value={migrationJson}
                        onChange={(e) => setMigrationJson(e.target.value)}
                        className="w-full bg-transparent text-emerald-400 focus:outline-none resize-y font-mono text-xs leading-relaxed"
                        placeholder="Paste JSON migration records here..."
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {/* Migration Safety Explanation Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <h5 className="font-bold text-amber-400">1. ID-Based Matching</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Every artist and song is matched by its unique ID (<code className="text-amber-300">Singer_ID</code>, <code className="text-amber-300">Song_ID</code>). If an ID already exists, its votes and history remain 100% untouched.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <h5 className="font-bold text-blue-400">2. Cloud Flush Guarantee</h5>
                      <p className="text-slate-400 leading-relaxed">
                        Google Apps Script calls <code className="text-blue-300">SpreadsheetApp.flush()</code> after every record insertion, committing updates directly to Google's cloud servers before completing.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                      <h5 className="font-bold text-emerald-400">3. Non-Destructive Seeding</h5>
                      <p className="text-slate-400 leading-relaxed">
                        When you redeploy Apps Script as a <em>"New version"</em>, the initial seeding code inspects the sheet and skips already existing rows, preventing data resets or duplicates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
