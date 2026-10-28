import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  Link as LinkIcon,
  Sparkles,
  LogOut,
  Layers,
} from 'lucide-react';
import {
  GoogleSheetsDatabaseService,
  SheetConnectionInfo,
} from '../services/googleSheetsDatabaseService';
import {
  googleSignIn,
  logoutGoogle,
  getCurrentUser,
  isGoogleAuthenticated,
  subscribeToAuth,
  getAccessToken,
} from '../services/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LiveSheetService } from '../services/liveSheetService';
import { AppData } from '../services/storageService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onRefreshData: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  appData,
  onRefreshData,
}) => {
  const [sheetInfo, setSheetInfo] = useState<SheetConnectionInfo>(
    GoogleSheetsDatabaseService.getConnectionInfo()
  );
  const [user, setUser] = useState(getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(isGoogleAuthenticated());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((currUser, token) => {
      setUser(currUser);
      setIsAuthenticated(Boolean(currUser && token));
    });

    const unsubSheet = GoogleSheetsDatabaseService.subscribe(info => {
      setSheetInfo(info);
      if (info.spreadsheetId) {
        setManualSheetInput(info.spreadsheetId);
      }
    });

    return () => {
      unsubAuth();
      unsubSheet();
    };
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setMessage({
          text: `Signed in as ${res.user.email}. Connecting to Google Drive...`,
          type: 'success',
        });
        // Auto-discover existing sheet in drive
        const existing = await GoogleSheetsDatabaseService.findExistingDatabaseSpreadsheet();
        if (existing) {
          setMessage({
            text: `Found existing database "${existing.name}" in your Google Drive!`,
            type: 'success',
          });
          await onRefreshData();
        }
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to authenticate with Google.',
        type: 'error',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setMessage({ text: 'Signed out of Google Workspace.', type: 'info' });
  };

  const handleCreateNewSheet = async () => {
    if (!isAuthenticated) {
      setMessage({ text: 'Please sign in with Google first.', type: 'error' });
      return;
    }

    setIsCreatingSheet(true);
    setMessage(null);
    try {
      const result = await GoogleSheetsDatabaseService.createDatabaseSpreadsheet();
      setMessage({
        text: `New Google Sheet created successfully! Title: "${result.title}"`,
        type: 'success',
      });
      await onRefreshData();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Error creating Google Sheet database.',
        type: 'error',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSearchDrive = async () => {
    if (!isAuthenticated) {
      setMessage({ text: 'Please sign in with Google first.', type: 'error' });
      return;
    }

    setIsSearching(true);
    setMessage(null);
    try {
      const found = await GoogleSheetsDatabaseService.findExistingDatabaseSpreadsheet();
      if (found) {
        setMessage({
          text: `Connected to "${found.name}" from your Google Drive!`,
          type: 'success',
        });
        await onRefreshData();
      } else {
        setMessage({
          text: 'No NC Creation spreadsheet found in Drive. You can click "Create New Google Sheet" below.',
          type: 'info',
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Error searching Google Drive.',
        type: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveManualSheetId = async () => {
    if (!manualSheetInput.trim()) {
      GoogleSheetsDatabaseService.setStoredSpreadsheetId(null);
      setMessage({ text: 'Disconnected from Google Sheet.', type: 'info' });
      return;
    }

    // Extract ID if user pasted full URL (e.g. /d/SPREADSHEET_ID/edit)
    let extractedId = manualSheetInput.trim();
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    GoogleSheetsDatabaseService.setStoredSpreadsheetId(extractedId);
    setManualSheetInput(extractedId);
    setMessage({ text: 'Google Sheet ID updated. Fetching live data...', type: 'info' });

    setIsSyncing(true);
    try {
      await onRefreshData();
      setMessage({ text: 'Connected and synchronized with Google Sheet!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Could not sync with Sheet: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      await onRefreshData();
      setMessage({ text: 'Live data synchronized with Google Sheet!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Sync error: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSeedSheet = async () => {
    const sheetId = sheetInfo.spreadsheetId;
    if (!sheetId) {
      setMessage({ text: 'No active Google Sheet connected.', type: 'error' });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setMessage({ text: 'Google authentication required.', type: 'error' });
      return;
    }

    const confirmed = window.confirm(
      'This will populate/reset the connected Google Sheet with the current singers, songs, sounds, and academy courses. Continue?'
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      await GoogleSheetsDatabaseService.seedSpreadsheetData(sheetId, token);
      await onRefreshData();
      setMessage({ text: 'Google Sheet successfully populated with all current records!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Error seeding sheet: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d1a] border border-blue-500/30 shadow-2xl text-slate-100 p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-600/20 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Google Sheets Live Database</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 uppercase tracking-wider">
                  Live Cloud DB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct read & write synchronization via Google Workspace API & Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : message.type === 'error'
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span className="flex-1 leading-relaxed">{message.text}</span>
          </div>
        )}

        {/* Section 1: Google Account Authentication */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1. Google Workspace Connection</span>
                {isAuthenticated ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                    Sign-in Required
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAuthenticated && user
                  ? `Authenticated as: ${user.email || user.displayName}`
                  : 'Sign in to grant permission to read and write live records to your Google Sheet.'}
              </p>
            </div>

            <div className="shrink-0">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <GoogleSignInButton onClick={handleSignIn} isLoading={isSigningIn} />
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Active Spreadsheet Connection */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>2. Active Database Spreadsheet</span>
            </h3>

            {sheetInfo.spreadsheetUrl && (
              <a
                href={sheetInfo.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-600/20 text-green-300 border border-green-500/40 text-xs font-semibold hover:bg-green-600/30 transition-colors"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCreateNewSheet}
              disabled={!isAuthenticated || isCreatingSheet}
              className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCreatingSheet ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>Create New NC Creation Sheet</span>
            </button>

            <button
              onClick={handleSearchDrive}
              disabled={!isAuthenticated || isSearching}
              className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-blue-400" />
              )}
              <span>Find Existing Sheet in Drive</span>
            </button>
          </div>

          {/* Manual ID Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Or connect by Spreadsheet ID / URL:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualSheetInput}
                onChange={e => setManualSheetInput(e.target.value)}
                placeholder="Paste Spreadsheet ID or full Google Sheets link"
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveManualSheetId}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Live Database Tables & Synchronization */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-400" />
                <span>3. Live Relational Tables</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time active records loaded from the connected Google Sheet
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>

              <button
                onClick={handleSeedSheet}
                disabled={!sheetInfo.spreadsheetId || isSyncing}
                className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                title="Populate/Reset Google Sheet with current local database records"
              >
                Seed Current Data
              </button>
            </div>
          </div>

          {/* Grid of Database Tables */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Singers (Artists)</div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">
                {appData.singers.length}
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">Tab: Singers</div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Competition Songs</div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">
                {appData.songs.length}
              </div>
              <div className="text-[10px] text-red-400 mt-0.5">Tab: Songs</div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Sound Gear Items</div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">
                {appData.sounds.length}
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">Tab: Sound_Rentals</div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Academy Courses</div>
              <div className="text-xl font-black text-white mt-1 tabular-nums">
                {appData.courses.length}
              </div>
              <div className="text-[10px] text-red-400 mt-0.5">Tab: Academy_Courses</div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/5">
            <span>Last Synced: {sheetInfo.lastSyncTime || 'Just now'}</span>
            <span className="text-slate-500 font-mono">Status: {sheetInfo.isConnected ? 'Active & Live' : 'Pending OAuth Connect'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
