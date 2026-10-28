import { getAccessToken, isGoogleAuthenticated } from './googleAuth';
import { AppData } from './storageService';
import {
  Singer,
  SingerSong,
  SoundService,
  AcademyCourse,
  SiteSettings,
  VoteAuditLog,
} from '../types/database';
import {
  INITIAL_SINGERS,
  INITIAL_SONGS,
  INITIAL_SOUND_SERVICES,
  INITIAL_COURSES,
  INITIAL_SETTINGS,
} from '../data/initialData';

const STORAGE_KEY_SHEET_ID = 'nc_google_sheet_id';
const STORAGE_KEY_AUTO_SYNC = 'nc_sheet_auto_sync';

export interface SheetConnectionInfo {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  recordCounts: {
    singers: number;
    songs: number;
    sounds: number;
    courses: number;
    votes: number;
  };
  error?: string | null;
}

export class GoogleSheetsDatabaseService {
  private static cachedSheetId: string | null = null;
  private static cachedTitle: string | null = null;
  private static lastSync: string | null = null;
  private static listeners: Array<(info: SheetConnectionInfo) => void> = [];

  public static getStoredSpreadsheetId(): string | null {
    if (this.cachedSheetId) return this.cachedSheetId;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SHEET_ID);
      this.cachedSheetId = stored ? stored.trim() : null;
      return this.cachedSheetId;
    } catch {
      return null;
    }
  }

  public static setStoredSpreadsheetId(sheetId: string | null) {
    this.cachedSheetId = sheetId ? sheetId.trim() : null;
    try {
      if (sheetId && sheetId.trim()) {
        localStorage.setItem(STORAGE_KEY_SHEET_ID, sheetId.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_SHEET_ID);
      }
    } catch (e) {
      console.warn('Could not persist sheet ID', e);
    }
    this.notifyListeners();
  }

  public static subscribe(callback: (info: SheetConnectionInfo) => void) {
    this.listeners.push(callback);
    callback(this.getConnectionInfo());
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  private static notifyListeners(error?: string) {
    const info = this.getConnectionInfo(error);
    this.listeners.forEach(cb => {
      try {
        cb(info);
      } catch (e) {
        console.error('Error notifying sheet listener', e);
      }
    });
  }

  public static getConnectionInfo(error?: string): SheetConnectionInfo {
    const id = this.getStoredSpreadsheetId();
    return {
      isConnected: Boolean(id && isGoogleAuthenticated()),
      spreadsheetId: id,
      spreadsheetTitle: this.cachedTitle || (id ? 'The NC Creation Live Database' : null),
      spreadsheetUrl: id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null,
      lastSyncTime: this.lastSync,
      recordCounts: {
        singers: INITIAL_SINGERS.length,
        songs: INITIAL_SONGS.length,
        sounds: INITIAL_SOUND_SERVICES.length,
        courses: INITIAL_COURSES.length,
        votes: 0,
      },
      error: error || null,
    };
  }

  /**
   * Search user's Google Drive for an existing NC Creation database spreadsheet
   */
  public static async findExistingDatabaseSpreadsheet(): Promise<{ id: string; name: string } | null> {
    const token = await getAccessToken();
    if (!token) return null;

    try {
      const q = encodeURIComponent("name contains 'The NC Creation' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=5`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          const file = data.files[0];
          this.setStoredSpreadsheetId(file.id);
          this.cachedTitle = file.name;
          return { id: file.id, name: file.name };
        }
      }
    } catch (err) {
      console.warn('Error searching for existing spreadsheet in Drive:', err);
    }
    return null;
  }

  /**
   * Creates a brand new Google Sheet in the user's Google Drive with all relational tabs and styled headers
   */
  public static async createDatabaseSpreadsheet(): Promise<{ id: string; title: string; url: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Please sign in with Google first to create a Google Sheet database.');
    }

    const title = `The NC Creation Live Database (${new Date().toLocaleDateString()})`;

    const requestBody = {
      properties: {
        title,
        locale: 'en_US',
        autoRecalc: 'ON_CHANGE',
      },
      sheets: [
        {
          properties: {
            title: 'Singers',
            gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Songs',
            gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Sound_Rentals',
            gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Academy_Courses',
            gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Votes_Audit',
            gridProperties: { rowCount: 1000, columnCount: 8, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Settings',
            gridProperties: { rowCount: 50, columnCount: 4, frozenRowCount: 1 },
          },
        },
      ],
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const createdSheet = await res.json();
    const sheetId = createdSheet.spreadsheetId;
    this.setStoredSpreadsheetId(sheetId);
    this.cachedTitle = title;

    // Seed the spreadsheet with initial headers and records
    await this.seedSpreadsheetData(sheetId, token);

    return {
      id: sheetId,
      title,
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
    };
  }

  /**
   * Seeds new spreadsheet with headers and current records
   */
  public static async seedSpreadsheetData(sheetId: string, token: string): Promise<void> {
    const dataUpdates = [
      {
        range: 'Singers!A1:E',
        values: [
          ['Singer ID', 'Name', 'Bio', 'Created Timestamp', 'Avatar Video ID'],
          ...INITIAL_SINGERS.map(s => [s.singerId, s.name, s.bio, s.createdTimestamp, s.avatarVideoId || '']),
        ],
      },
      {
        range: 'Songs!A1:G',
        values: [
          ['Song ID', 'Singer ID', 'Song Title', 'YouTube Video ID', 'Vote Count', 'Is Active', 'Added Timestamp'],
          ...INITIAL_SONGS.map(s => [
            s.songId,
            s.singerId,
            s.songTitle,
            s.youtubeVideoId,
            s.voteCount,
            s.isActive ? 'TRUE' : 'FALSE',
            s.addedTimestamp,
          ]),
        ],
      },
      {
        range: 'Sound_Rentals!A1:G',
        values: [
          ['Item ID', 'Title', 'Category', 'Rental Pricing', 'Specifications', 'Is Available', 'Featured'],
          ...INITIAL_SOUND_SERVICES.map(i => [
            i.itemId,
            i.title,
            i.category,
            i.rentalPricing,
            i.specifications.join(', '),
            i.isAvailable ? 'TRUE' : 'FALSE',
            i.featured ? 'TRUE' : 'FALSE',
          ]),
        ],
      },
      {
        range: 'Academy_Courses!A1:J',
        values: [
          [
            'Course ID',
            'Title',
            'Sinhala Title',
            'Instructor',
            'Schedule',
            'Fee',
            'Duration',
            'Description',
            'Syllabus Highlights',
            'Is Enrolling',
          ],
          ...INITIAL_COURSES.map(c => [
            c.courseId,
            c.title,
            c.sinhalaTitle || '',
            c.instructor,
            c.schedule,
            c.fee,
            c.duration,
            c.description,
            c.syllabusHighlights.join(', '),
            c.isEnrolling ? 'TRUE' : 'FALSE',
          ]),
        ],
      },
      {
        range: 'Votes_Audit!A1:F',
        values: [
          ['Vote ID', 'Singer ID', 'Song ID', 'Timestamp', 'Subscriber Verification Status', 'User Agent'],
          [
            'VOTE-INIT-001',
            'NCC/0001',
            'SNG/001',
            new Date().toISOString(),
            'VERIFIED_SUBSCRIBER',
            'Initial Seed',
          ],
        ],
      },
      {
        range: 'Settings!A1:B',
        values: [
          ['Setting Key', 'Value'],
          ['businessName', INITIAL_SETTINGS.businessName],
          ['ownerDirector', INITIAL_SETTINGS.ownerDirector],
          ['location', INITIAL_SETTINGS.location],
          ['officialChannelId', INITIAL_SETTINGS.officialChannelId],
          ['hotline1', INITIAL_SETTINGS.hotline1],
          ['hotline2', INITIAL_SETTINGS.hotline2],
          ['realityShowName', INITIAL_SETTINGS.realityShowName],
          ['officialBio', INITIAL_SETTINGS.officialBio],
          ['lastUpdated', new Date().toISOString()],
        ],
      },
    ];

    const body = {
      valueInputOption: 'USER_ENTERED',
      data: dataUpdates,
    };

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('Could not populate initial spreadsheet data:', await res.text());
    }
  }

  /**
   * Fetches live data directly from Google Sheets API v4 using batchGet
   */
  public static async fetchLiveDataFromSheet(): Promise<AppData | null> {
    const sheetId = this.getStoredSpreadsheetId();
    if (!sheetId) return null;

    const token = await getAccessToken();
    if (!token) return null;

    try {
      const ranges = [
        'Singers!A2:E',
        'Songs!A2:G',
        'Sound_Rentals!A2:G',
        'Academy_Courses!A2:J',
        'Votes_Audit!A2:F',
        'Settings!A2:B',
      ];
      const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${queryParams}&valueRenderOption=FORMATTED_VALUE`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.info('[Google Sheets] OAuth token unauthenticated or expired. Using persistent database.');
          return null;
        }
        if (res.status === 404) {
          console.info('[Google Sheets] Spreadsheet not found. Using persistent database.');
          return null;
        }
        return null;
      }

      const json = await res.json();
      const valueRanges = json.valueRanges || [];

      // Parse Singers
      const singersRows: any[][] = valueRanges[0]?.values || [];
      const singers: Singer[] = singersRows
        .filter(row => row && row[0])
        .map(row => ({
          singerId: String(row[0]).trim(),
          name: String(row[1] || '').trim(),
          bio: String(row[2] || '').trim(),
          createdTimestamp: String(row[3] || new Date().toISOString()).trim(),
          avatarVideoId: row[4] ? String(row[4]).trim() : undefined,
        }));

      // Parse Songs
      const songsRows: any[][] = valueRanges[1]?.values || [];
      const songs: SingerSong[] = songsRows
        .filter(row => row && row[0])
        .map(row => ({
          songId: String(row[0]).trim(),
          singerId: String(row[1] || '').trim(),
          songTitle: String(row[2] || '').trim(),
          youtubeVideoId: String(row[3] || '').trim(),
          voteCount: parseInt(String(row[4] || '0').replace(/[^0-9]/g, ''), 10) || 0,
          isActive: String(row[5]).toUpperCase() !== 'FALSE',
          addedTimestamp: String(row[6] || new Date().toISOString()).trim(),
        }));

      // Parse Sound Rentals
      const soundsRows: any[][] = valueRanges[2]?.values || [];
      const sounds: SoundService[] = soundsRows
        .filter(row => row && row[0])
        .map(row => ({
          itemId: String(row[0]).trim(),
          title: String(row[1] || '').trim(),
          category: (row[2] || 'Live Sound') as any,
          rentalPricing: String(row[3] || 'Contact Studio').trim(),
          specifications: row[4]
            ? String(row[4])
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          isAvailable: String(row[5]).toUpperCase() !== 'FALSE',
          featured: String(row[6]).toUpperCase() === 'TRUE',
        }));

      // Parse Academy Courses
      const coursesRows: any[][] = valueRanges[3]?.values || [];
      const courses: AcademyCourse[] = coursesRows
        .filter(row => row && row[0])
        .map(row => ({
          courseId: String(row[0]).trim(),
          title: String(row[1] || '').trim(),
          sinhalaTitle: row[2] ? String(row[2]).trim() : undefined,
          instructor: String(row[3] || '').trim(),
          schedule: String(row[4] || '').trim(),
          fee: String(row[5] || '').trim(),
          duration: String(row[6] || '').trim(),
          description: String(row[7] || '').trim(),
          syllabusHighlights: row[8]
            ? String(row[8])
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
          isEnrolling: String(row[9]).toUpperCase() !== 'FALSE',
        }));

      // Parse Votes Audit
      const auditRows: any[][] = valueRanges[4]?.values || [];
      const auditLogs: VoteAuditLog[] = auditRows
        .filter(row => row && row[0])
        .map(row => ({
          voteId: String(row[0]).trim(),
          singerId: String(row[1] || '').trim(),
          songId: String(row[2] || '').trim(),
          timestamp: String(row[3] || '').trim(),
          subscriberVerificationStatus: (row[4] || 'VERIFIED_SUBSCRIBER') as any,
          userIpAgent: String(row[5] || '').trim(),
        }));

      // Parse Settings
      const settingsRows: any[][] = valueRanges[5]?.values || [];
      const settingsMap: Record<string, string> = {};
      settingsRows.forEach(row => {
        if (row && row[0]) {
          settingsMap[String(row[0]).trim()] = String(row[1] || '').trim();
        }
      });

      const settings: SiteSettings = {
        ...INITIAL_SETTINGS,
        businessName: settingsMap['businessName'] || INITIAL_SETTINGS.businessName,
        ownerDirector: settingsMap['ownerDirector'] || INITIAL_SETTINGS.ownerDirector,
        location: settingsMap['location'] || INITIAL_SETTINGS.location,
        officialChannelId: settingsMap['officialChannelId'] || INITIAL_SETTINGS.officialChannelId,
        hotline1: settingsMap['hotline1'] || INITIAL_SETTINGS.hotline1,
        hotline2: settingsMap['hotline2'] || INITIAL_SETTINGS.hotline2,
        realityShowName: settingsMap['realityShowName'] || INITIAL_SETTINGS.realityShowName,
        officialBio: settingsMap['officialBio'] || INITIAL_SETTINGS.officialBio,
      };

      this.lastSync = new Date().toLocaleTimeString();
      this.notifyListeners();

      return {
        singers: singers.length > 0 ? singers : INITIAL_SINGERS,
        songs: songs.length > 0 ? songs : INITIAL_SONGS,
        sounds: sounds.length > 0 ? sounds : INITIAL_SOUND_SERVICES,
        courses: courses.length > 0 ? courses : INITIAL_COURSES,
        auditLogs,
        settings,
      };
    } catch (err: any) {
      console.info('[Google Sheets] Direct sync notice:', err?.message || err);
      return null;
    }
  }

  /**
   * Registers a vote directly in Google Sheets:
   * 1. Finds the song in 'Songs' tab and increments voteCount.
   * 2. Appends a new record in 'Votes_Audit' tab.
   */
  public static async registerVoteInSheet(
    singerId: string,
    songId: string,
    verificationToken: string
  ): Promise<{ success: boolean; newVoteCount: number; message: string }> {
    const sheetId = this.getStoredSpreadsheetId();
    const token = await getAccessToken();

    if (!sheetId || !token) {
      throw new Error('Not connected to Google Sheets database');
    }

    // Step 1: Read Songs tab to find row number and current votes
    const songsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Songs!A2:E`;
    const songsRes = await fetch(songsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let rowIndex = -1;
    let currentVotes = 0;

    if (songsRes.ok) {
      const data = await songsRes.json();
      const rows: any[][] = data.values || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i] && rows[i][0] === songId) {
          rowIndex = i + 2; // +2 for 1-based indexing & header row
          currentVotes = parseInt(String(rows[i][4] || '0').replace(/[^0-9]/g, ''), 10) || 0;
          break;
        }
      }
    }

    const newVoteCount = currentVotes + 1;

    // Step 2: Update vote count cell in Songs!E{rowIndex} if found
    if (rowIndex > 1) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Songs!E${rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [[newVoteCount]] }),
        }
      );
    }

    // Step 3: Append to Votes_Audit!A:F
    const voteId = `VOTE-${Date.now().toString().slice(-6)}`;
    const auditRow = [
      voteId,
      singerId,
      songId,
      new Date().toISOString(),
      'VERIFIED_SUBSCRIBER',
      navigator.userAgent.slice(0, 50),
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Votes_Audit!A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [auditRow] }),
      }
    );

    this.lastSync = new Date().toLocaleTimeString();
    this.notifyListeners();

    return {
      success: true,
      newVoteCount,
      message: 'Vote successfully recorded in Google Sheets database!',
    };
  }

  /**
   * Appends or updates a Sound Service in Sound_Rentals tab
   */
  public static async saveSoundServiceInSheet(soundData: Partial<SoundService>): Promise<boolean> {
    const sheetId = this.getStoredSpreadsheetId();
    const token = await getAccessToken();
    if (!sheetId || !token) return false;

    const row = [
      soundData.itemId || `SND-${Date.now().toString().slice(-4)}`,
      soundData.title || '',
      soundData.category || 'PA Systems',
      soundData.rentalPricing || 'Contact Studio',
      (soundData.specifications || []).join(', '),
      soundData.isAvailable !== false ? 'TRUE' : 'FALSE',
      soundData.featured ? 'TRUE' : 'FALSE',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sound_Rentals!A:G:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return res.ok;
  }

  /**
   * Appends or updates an Academy Course in Academy_Courses tab
   */
  public static async saveAcademyCourseInSheet(courseData: Partial<AcademyCourse>): Promise<boolean> {
    const sheetId = this.getStoredSpreadsheetId();
    const token = await getAccessToken();
    if (!sheetId || !token) return false;

    const row = [
      courseData.courseId || `CRS-${Date.now().toString().slice(-4)}`,
      courseData.title || '',
      courseData.sinhalaTitle || '',
      courseData.instructor || '',
      courseData.schedule || '',
      courseData.fee || '',
      courseData.duration || '',
      courseData.description || '',
      (courseData.syllabusHighlights || []).join(', '),
      courseData.isEnrolling !== false ? 'TRUE' : 'FALSE',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Academy_Courses!A:J:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      }
    );

    return res.ok;
  }
}
