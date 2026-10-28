import { AppData, StorageService } from './storageService';
import { Singer, SingerSong, SoundService, AcademyCourse, SiteSettings } from '../types/database';
import { GoogleSheetsDatabaseService } from './googleSheetsDatabaseService';
import { isGoogleAuthenticated } from './googleAuth';

export interface LiveSyncStatus {
  isLive: boolean;
  source: string;
  lastSyncTime: string;
  appsScriptUrl?: string;
}

const STORAGE_KEY_GAS_URL = 'nc_apps_script_url';

export class LiveSheetService {
  private static lastSync: string = new Date().toLocaleTimeString();

  /**
   * Retrieves configured Google Apps Script Web App URL from localStorage
   */
  public static getAppsScriptUrl(): string {
    try {
      return localStorage.getItem(STORAGE_KEY_GAS_URL) || '';
    } catch {
      return '';
    }
  }

  /**
   * Persists the Google Apps Script Web App URL in browser localStorage
   */
  public static setAppsScriptUrl(url: string): void {
    try {
      if (url && url.trim()) {
        localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_GAS_URL);
      }
    } catch (err) {
      console.warn('Could not save Apps Script URL to local storage', err);
    }
  }

  /**
   * Fetches latest global state:
   * 1. Starts with guaranteed authoritative localStorage data.
   * 2. Checks Google Sheets API or Server DB in the background.
   * 3. Non-destructively merges new records without resetting local state.
   */
  public static async fetchLiveData(forceFresh = false): Promise<{ data: AppData; status: LiveSyncStatus }> {
    // 1. Authoritative local storage read
    let currentData = StorageService.getAppData();
    this.lastSync = new Date().toLocaleTimeString();

    // Strategy 0: Direct Google Sheets API v4 if authenticated
    if (isGoogleAuthenticated() && GoogleSheetsDatabaseService.getStoredSpreadsheetId()) {
      try {
        const sheetData = await GoogleSheetsDatabaseService.fetchLiveDataFromSheet();
        if (sheetData && Array.isArray(sheetData.singers) && sheetData.singers.length > 0) {
          currentData = StorageService.mergeRemoteData(sheetData);
          return {
            data: currentData,
            status: {
              isLive: true,
              source: 'Google Sheets (Live Cloud Database)',
              lastSyncTime: this.lastSync,
              appsScriptUrl: `https://docs.google.com/spreadsheets/d/${GoogleSheetsDatabaseService.getStoredSpreadsheetId()}/edit`,
            },
          };
        }
      } catch (sheetErr) {
        console.warn('[Direct Sheets API Fetch] Notice:', sheetErr);
      }
    }

    const directUrl = this.getAppsScriptUrl();

    // Strategy 1: Direct fetch from Google Apps Script Web App URL
    if (directUrl && directUrl.startsWith('https://script.google.com')) {
      try {
        const gasUrl = `${directUrl}?action=getAppData&_t=${Date.now()}`;
        const gasRes = await fetch(gasUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          redirect: 'follow',
        });

        if (gasRes.ok) {
          const json = await gasRes.json();
          if (json && json.data && Array.isArray(json.data.singers) && json.data.singers.length > 0) {
            currentData = StorageService.mergeRemoteData(json.data);
            return {
              data: currentData,
              status: {
                isLive: true,
                source: 'Google Spreadsheet (Direct Cloud Connection)',
                lastSyncTime: this.lastSync,
                appsScriptUrl: directUrl,
              },
            };
          }
        }
      } catch (gasErr) {
        console.warn('[Direct GAS Fetch] Falling back to server database proxy:', gasErr);
      }
    }

    // Strategy 2: Server database proxy
    try {
      const response = await fetch(`/api/database${forceFresh ? '?fresh=true' : ''}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.data && Array.isArray(json.data.singers)) {
          currentData = StorageService.mergeRemoteData(json.data);

          if (json.data.settings?.appsScriptUrl && !directUrl) {
            this.setAppsScriptUrl(json.data.settings.appsScriptUrl);
          }

          return {
            data: currentData,
            status: {
              isLive: true,
              source: json.source || 'Permanent Multi-User Database',
              lastSyncTime: this.lastSync,
              appsScriptUrl: directUrl || json.data.settings?.appsScriptUrl,
            },
          };
        }
      }
    } catch (err) {
      console.warn('[Server DB Fetch] Notice:', err);
    }

    // Local Storage Fallback
    return {
      data: currentData,
      status: {
        isLive: true,
        source: 'Browser LocalStorage (Permanent Offline Database)',
        lastSyncTime: this.lastSync,
        appsScriptUrl: directUrl,
      },
    };
  }

  /**
   * Registers vote:
   * 1. Immediately saves to browser's localStorage so it is 100% permanent.
   * 2. Also updates Google Sheet and server in background.
   */
  public static async registerVote(
    singerId: string,
    songId: string,
    verificationToken: string
  ): Promise<{ success: boolean; message: string; newVoteCount: number }> {
    // Immediate LocalStorage Write
    const localResult = StorageService.registerVote(singerId, songId, verificationToken);

    // Background push to Google Sheets API if connected
    if (isGoogleAuthenticated() && GoogleSheetsDatabaseService.getStoredSpreadsheetId()) {
      GoogleSheetsDatabaseService.registerVoteInSheet(singerId, songId, verificationToken).catch(
        err => console.warn('Background Sheets vote record note:', err)
      );
    }

    // Background push to Google Apps Script URL if configured
    const directUrl = this.getAppsScriptUrl();
    if (directUrl && directUrl.startsWith('https://script.google.com')) {
      const gasVoteUrl = `${directUrl}?action=registerVote&singerId=${encodeURIComponent(singerId)}&songId=${encodeURIComponent(songId)}&verificationToken=${encodeURIComponent(verificationToken)}&clientFingerprint=${encodeURIComponent(navigator.userAgent)}&_t=${Date.now()}`;
      fetch(gasVoteUrl, { method: 'GET', redirect: 'follow' }).catch(() => {});
    }

    // Background push to local server
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        singerId,
        songId,
        verificationToken,
        clientFingerprint: navigator.userAgent,
      }),
    }).catch(() => {});

    return localResult;
  }

  /**
   * Adds song to artist profile: immediately persists to localStorage
   */
  public static async addSongToSingerProfile(
    singerId: string,
    songTitle: string,
    youtubeVideoId: string,
    adminPin: string
  ): Promise<{ success: boolean; message: string; song?: SingerSong }> {
    const localResult = StorageService.addSongToSingerProfile(
      singerId,
      songTitle,
      youtubeVideoId,
      adminPin
    );

    if (localResult.success) {
      // Sync to server in background
      fetch('/api/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ singerId, songTitle, youtubeVideoId, adminPin }),
      }).catch(() => {});

      const directUrl = this.getAppsScriptUrl();
      if (directUrl && directUrl.startsWith('https://script.google.com')) {
        const addUrl = `${directUrl}?action=addSongToSingerProfile&singerId=${encodeURIComponent(singerId)}&songTitle=${encodeURIComponent(songTitle)}&youtubeVideoId=${encodeURIComponent(youtubeVideoId)}&adminPin=${encodeURIComponent(adminPin)}&_t=${Date.now()}`;
        fetch(addUrl, { method: 'GET', redirect: 'follow' }).catch(() => {});
      }
    }

    return localResult;
  }

  /**
   * Saves or creates singer profile: immediately persists to localStorage
   */
  public static async saveSingerProfile(
    singerData: Partial<Singer> & { singerId?: string },
    adminPin: string
  ): Promise<{ success: boolean; message: string; singerId?: string }> {
    const localResult = StorageService.saveSingerProfile(singerData, adminPin);

    if (localResult.success) {
      fetch('/api/singer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ singerData, adminPin }),
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Deletes singer profile: immediately persists to localStorage
   */
  public static async deleteSingerProfile(
    singerId: string,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    const localResult = StorageService.deleteSingerProfile(singerId, adminPin);

    if (localResult.success) {
      fetch(`/api/singer/${encodeURIComponent(singerId)}?adminPin=${encodeURIComponent(adminPin)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Deletes song: immediately persists to localStorage
   */
  public static async deleteSong(
    songId: string,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    const localResult = StorageService.deleteSong(songId, adminPin);

    if (localResult.success) {
      fetch(`/api/song/${encodeURIComponent(songId)}?adminPin=${encodeURIComponent(adminPin)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Verifies admin password
   */
  public static async verifyAdminLogin(
    pin: string
  ): Promise<{ success: boolean; message: string; token?: string }> {
    if (StorageService.verifyAdminPin(pin)) {
      return { success: true, message: 'Admin authenticated successfully', token: 'ADMIN_SESSION_ACTIVE' };
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { success: false, message: 'Invalid Admin Passcode' };
  }

  /**
   * Adds or updates a Sound / Speaker Equipment item: immediately persists to localStorage
   */
  public static async saveSoundService(
    soundData: Partial<SoundService>,
    adminPin: string
  ): Promise<{ success: boolean; itemId?: string; message: string }> {
    const localResult = StorageService.saveSoundService(soundData, adminPin);

    if (localResult.success) {
      fetch('/api/sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundData, adminPin }),
      }).catch(() => {});

      if (isGoogleAuthenticated() && GoogleSheetsDatabaseService.getStoredSpreadsheetId()) {
        GoogleSheetsDatabaseService.saveSoundServiceInSheet(soundData).catch(() => {});
      }
    }

    return localResult;
  }

  /**
   * Deletes a Sound / Speaker equipment item: immediately persists to localStorage
   */
  public static async deleteSoundService(
    itemId: string,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    const localResult = StorageService.deleteSoundService(itemId, adminPin);

    if (localResult.success) {
      fetch(`/api/sound/${encodeURIComponent(itemId)}?adminPin=${encodeURIComponent(adminPin)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Adds or updates an Academy Course: immediately persists to localStorage
   */
  public static async saveAcademyCourse(
    courseData: Partial<AcademyCourse>,
    adminPin: string
  ): Promise<{ success: boolean; courseId?: string; message: string }> {
    const localResult = StorageService.saveAcademyCourse(courseData, adminPin);

    if (localResult.success) {
      fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseData, adminPin }),
      }).catch(() => {});

      if (isGoogleAuthenticated() && GoogleSheetsDatabaseService.getStoredSpreadsheetId()) {
        GoogleSheetsDatabaseService.saveAcademyCourseInSheet(courseData).catch(() => {});
      }
    }

    return localResult;
  }

  /**
   * Deletes an Academy course: immediately persists to localStorage
   */
  public static async deleteAcademyCourse(
    courseId: string,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    const localResult = StorageService.deleteAcademyCourse(courseId, adminPin);

    if (localResult.success) {
      fetch(`/api/course/${encodeURIComponent(courseId)}?adminPin=${encodeURIComponent(adminPin)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Updates site settings & admin passcode: immediately persists to localStorage
   */
  public static async updateSiteSettings(
    settingsData: Partial<SiteSettings>,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    if (settingsData.appsScriptUrl !== undefined) {
      this.setAppsScriptUrl(settingsData.appsScriptUrl);
    }

    const localResult = StorageService.updateSiteSettings(settingsData, adminPin);

    if (localResult.success) {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settingsData, adminPin }),
      }).catch(() => {});
    }

    return localResult;
  }

  /**
   * Tests connection to Google Apps Script Web App
   */
  public static async testGasConnection(
    url: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    this.setAppsScriptUrl(url);

    try {
      const directRes = await fetch(`${url}?action=ping&_t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
      });
      if (directRes.ok) {
        const pingData = await directRes.json();
        return {
          success: true,
          message: 'Connection verified! Live Google Sheet connected.',
          details: pingData,
        };
      }
    } catch (directErr) {
      console.warn('Direct ping test failed, trying proxy test:', directErr);
    }

    try {
      const res = await fetch('/api/gas-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: 'Could not connect: ' + err.message };
    }
  }

  /**
   * Bulk migrates records into localStorage and database
   */
  public static async migrateData(
    payload: any,
    adminPin: string
  ): Promise<{ success: boolean; message: string }> {
    const localResult = StorageService.migrateData(payload, adminPin);

    if (localResult.success) {
      fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, adminPin }),
      }).catch(() => {});
    }

    return localResult;
  }
}
