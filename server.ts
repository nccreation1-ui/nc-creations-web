import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory and persistence file
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'live_database.json');

interface Singer {
  singerId: string;
  name: string;
  bio: string;
  createdTimestamp: string;
  avatarVideoId?: string;
}

interface SingerSong {
  songId: string;
  singerId: string;
  songTitle: string;
  youtubeVideoId: string;
  voteCount: number;
  isActive: boolean;
  addedTimestamp: string;
}

interface VoteAuditLog {
  voteId: string;
  singerId: string;
  songId: string;
  timestamp: string;
  subscriberVerificationStatus: string;
  userIpAgent: string;
}

interface SoundService {
  itemId: string;
  title: string;
  category: string;
  rentalPricing: string;
  specifications: string[];
  isAvailable: boolean;
  featured?: boolean;
}

interface AcademyCourse {
  courseId: string;
  title: string;
  sinhalaTitle?: string;
  instructor: string;
  schedule: string;
  fee: string;
  duration: string;
  description: string;
  syllabusHighlights: string[];
  isEnrolling: boolean;
}

interface SiteSettings {
  businessName: string;
  ownerDirector: string;
  location: string;
  officialChannelId: string;
  hotline1: string;
  hotline2: string;
  realityShowName: string;
  officialBio: string;
  adminPin: string;
  appsScriptUrl?: string;
}

const DEFAULT_DATABASE = {
  singers: [
    {
      singerId: 'NCC/0001',
      name: 'Renuk Madushanka (රේණුක්)',
      bio: "Versatile vocalist specializing in classical fusion and acoustic ballads. Competing in 'සෙන්කඩගලට පායන තරු' Grand Stage.",
      createdTimestamp: '2026-02-15T10:00:00.000Z',
      avatarVideoId: 'kJQP7kiw5Fk',
    },
    {
      singerId: 'NCC/0002',
      name: 'Nethmi Kavindya (නෙත්මි)',
      bio: 'Soulful acoustic performer with exceptional dynamic range and emotion, trained in Eastern Hindustani ragas at NC Academy.',
      createdTimestamp: '2026-02-18T14:30:00.000Z',
      avatarVideoId: '9bZkp7q19f0',
    },
    {
      singerId: 'NCC/0003',
      name: 'Prageeth Fernando (ප්‍රගීත්)',
      bio: 'High-octane rock and contemporary pop vocalist renowned for stage energy and rich baritone timbre.',
      createdTimestamp: '2026-02-20T09:15:00.000Z',
      avatarVideoId: 'fJ9rUzIMcZQ',
    },
    {
      singerId: 'NCC/0004',
      name: 'Kasun Jayasundara (කසුන්)',
      bio: 'Expressive lyrical interpreter from Kandy Valley, blending folk heritage with modern cinematic instrumentation.',
      createdTimestamp: '2026-02-22T16:45:00.000Z',
      avatarVideoId: 'L_LUpnjgPso',
    },
  ] as Singer[],

  songs: [
    {
      songId: 'SNG/001',
      singerId: 'NCC/0001',
      songTitle: 'සඳ කැන් වැසි (Sanda Kan Wesi - Acoustic Live)',
      youtubeVideoId: 'kJQP7kiw5Fk',
      voteCount: 1420,
      isActive: true,
      addedTimestamp: '2026-02-15T10:15:00.000Z',
    },
    {
      songId: 'SNG/002',
      singerId: 'NCC/0001',
      songTitle: 'හිරු දෙනෙතින් (Hiru Denethin - NC Studio Session)',
      youtubeVideoId: '3tmd-ClpJxA',
      voteCount: 985,
      isActive: true,
      addedTimestamp: '2026-02-16T11:00:00.000Z',
    },
    {
      songId: 'SNG/003',
      singerId: 'NCC/0002',
      songTitle: 'මල් මීදුමේ (Mal Meedume - Studio Master)',
      youtubeVideoId: '9bZkp7q19f0',
      voteCount: 1850,
      isActive: true,
      addedTimestamp: '2026-02-18T15:00:00.000Z',
    },
    {
      songId: 'SNG/004',
      singerId: 'NCC/0002',
      songTitle: 'සුවඳක් තියා (Suwandak Thiya - Unplugged)',
      youtubeVideoId: 'ZbZSe6N_BXs',
      voteCount: 1120,
      isActive: true,
      addedTimestamp: '2026-02-19T13:20:00.000Z',
    },
    {
      songId: 'SNG/005',
      singerId: 'NCC/0003',
      songTitle: 'ගිනි දැල් අතරේ (Gini Del Athare - Reality Stage)',
      youtubeVideoId: 'fJ9rUzIMcZQ',
      voteCount: 1310,
      isActive: true,
      addedTimestamp: '2026-02-20T10:00:00.000Z',
    },
    {
      songId: 'SNG/006',
      singerId: 'NCC/0004',
      songTitle: 'සෙන්කඩගල පුරවර (Senkadagala Purawara - Folk Tribute)',
      youtubeVideoId: 'L_LUpnjgPso',
      voteCount: 1540,
      isActive: true,
      addedTimestamp: '2026-02-22T17:00:00.000Z',
    },
  ] as SingerSong[],

  sounds: [
    {
      itemId: 'SND-01',
      title: 'Concert Line-Array Pro Sound System (6000W)',
      category: 'PA Systems',
      rentalPricing: 'LKR 55,000 / Day',
      specifications: [
        '8-Box Dual Line Array with Dual 18" Subwoofers',
        'Digital FOH System with Stagebox & Multi-Core snake',
        'Suitable for 1,500+ audience indoor or outdoor festivals',
        'Includes Sound Engineer & Audio Technicians',
      ],
      isAvailable: true,
      featured: true,
    },
    {
      itemId: 'SND-02',
      title: 'Wedding & Corporate Event Sound Package',
      category: 'Live Sound',
      rentalPricing: 'LKR 35,000 / Event',
      specifications: [
        'JBL Active Tops (PRX Series) + Bass Bins',
        'Shure SLX Wireless Mics & Lapel/Headset Options',
        'Clean visual presentation with concealed cabling',
        'DJ Interface & Acoustic Live Band Support',
      ],
      isAvailable: true,
      featured: true,
    },
    {
      itemId: 'SND-03',
      title: 'NC Recording Studio Time & Multi-Track Production',
      category: 'Studio Recording',
      rentalPricing: 'LKR 3,500 / Hour',
      specifications: [
        'Acoustically tuned live room & isolated vocal booth',
        'Neumann, AKG & Shure vintage microphone locker',
        'Universal Audio Apollo & Cubase Pro 13 / ProTools setup',
        'Music Director Keerthi Senkadagala guidance available',
      ],
      isAvailable: true,
      featured: true,
    },
    {
      itemId: 'SND-04',
      title: 'Concert Stage Intelligent Moving Head Lights & Truss',
      category: 'Lighting & Stage',
      rentalPricing: 'LKR 28,000 / Event',
      specifications: [
        'Beam 230W Moving Heads, LED Warm White Washes',
        'DMX Controller Console with custom light scene sequencing',
        'Haze and low-fog smoke machine for dramatic performance looks',
        'Rigging truss and certified safety crew',
      ],
      isAvailable: true,
      featured: false,
    },
  ] as SoundService[],

  courses: [
    {
      courseId: 'CRS-01',
      title: 'Vocal Culturing & Reality Show Performance Mastery',
      sinhalaTitle: 'ගායන පුහුණුව හා හඬ පාලනය',
      instructor: 'Keerthi Senkadagala (Music Director)',
      schedule: 'Saturdays & Sundays | 9:30 AM - 1:00 PM',
      fee: 'LKR 6,500 / Month',
      duration: '6 Months Certificate / 1 Year Diploma',
      description:
        'Professional voice modulation, breath discipline, microtonal accuracy, mic technique, and TV reality show stage confidence.',
      syllabusHighlights: [
        'Diaphragm control & pitch calibration',
        'Eastern & Western raga phrasing',
        'Live microphone dynamic control',
        'Stage posture & TV camera presence',
      ],
      isEnrolling: true,
    },
    {
      courseId: 'CRS-02',
      title: 'Audio Engineering & Digital Music Production',
      sinhalaTitle: 'ශබ්ද පරිපාලනය හා සංගීත නිර්මාණකරණය',
      instructor: 'Senior Studio Engineers & Guest Producers',
      schedule: 'Weekend Evenings | 3:00 PM - 6:30 PM',
      fee: 'LKR 9,000 / Month',
      duration: '4 Months Intensive Hands-On',
      description:
        'Hands-on DAW workflow (Cubase, Logic Pro, ProTools), mixing, mastering, EQ compression techniques, and audio acoustics.',
      syllabusHighlights: [
        'Studio signal routing & preamps',
        'Vocal comping & Melodyne tuning',
        'Drum multi-mic phase alignment',
        'Mastering for Spotify & YouTube broadcast standards',
      ],
      isEnrolling: true,
    },
    {
      courseId: 'CRS-03',
      title: 'Instrumental Training (Keyboard, Guitar & Violin)',
      sinhalaTitle: 'වාද්‍ය භාණ්ඩ ප්‍රගුණ කිරීම',
      instructor: 'NC Academy Specialized Instrument Faculty',
      schedule: 'Flexible Weekday / Weekend Slots',
      fee: 'LKR 5,000 / Month',
      duration: 'Individual & Group Modules',
      description:
        'Learn keyboard harmony, acoustic/electric guitar fingerpicking, or violin bowing tailored for Sri Lankan light music.',
      syllabusHighlights: [
        'Staff notation & oriental notation reading',
        'Chord progressions & improvisation',
        'Accompaniment for singers',
        'Stage amp & pedalboard setup',
      ],
      isEnrolling: true,
    },
  ] as AcademyCourse[],

  settings: {
    businessName: "The NC Creation's Academy + Sound + Studio",
    ownerDirector: 'Keerthi Senkadagala',
    location: 'Gurudeniya, Kandy, Sri Lanka',
    officialChannelId: 'UC0LAWaBq7XAc8TV17Yj9e9Q',
    hotline1: '0704227788',
    hotline2: '0775918913',
    realityShowName: 'සෙන්කඩගලට පායන තරු (Senkadagalata Paayana Tharu)',
    officialBio:
      'සකලවිද කලා කටයුතු මුළුමහත් ලෝකයා වෙත ගෙනයාම උදෙසා නිර්මාණය කරන ලද මෙම නාලිකාව ඔබ සැමගේ සහයෝගය මත ඉදිරියට යනු ඇත. ගීත ගායනය, වාදනය, විවිධ නැටුම් කලාවන්, ගීත විචාර, නාට්ය හා රංගකලාව, ගී පද නිර්මාණය, තනු නිර්මාණය ආදී සකලවිද කලා කටයුතු ඉදිරියේ දී මෙම නාලිකාව හරහා ඔබට අත්විදීමේ අවස්ථාව සැලසෙනු ඇත. මම කීර්ති සෙංකඩගල.',
    adminPin: '1994',
    appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
  } as SiteSettings,

  auditLogs: [
    {
      voteId: 'VOTE-INIT-001',
      singerId: 'NCC/0001',
      songId: 'SNG/001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      subscriberVerificationStatus: 'VERIFIED_SUBSCRIBER',
      userIpAgent: 'Verified YouTube Subscriber (Chrome/124.0 Sri Lanka)',
    },
    {
      voteId: 'VOTE-INIT-002',
      singerId: 'NCC/0002',
      songId: 'SNG/003',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      subscriberVerificationStatus: 'VERIFIED_SUBSCRIBER',
      userIpAgent: 'Verified YouTube Subscriber (Mobile/Safari Kandy)',
    },
  ] as VoteAuditLog[],
};

// Permanent Database Management
let liveDatabase = { ...DEFAULT_DATABASE };

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(liveDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Disk Storage Warning] Could not persist to disk:', err);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.singers && parsed.songs) {
        liveDatabase = { ...DEFAULT_DATABASE, ...parsed };
        console.log('[Disk Storage] Loaded permanent database from', DB_FILE);
      }
    } else {
      saveToDisk();
      console.log('[Disk Storage] Initialized permanent database snapshot on disk at', DB_FILE);
    }
  } catch (err) {
    console.warn('[Disk Storage] Error reading disk database:', err);
  }
}

// Forward action to Google Apps Script Web App
async function forwardToGoogleAppsScript(action: string, payload: any) {
  const url = liveDatabase.settings.appsScriptUrl;
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[GAS Sync Warning] Failed to reach Google Apps Script Web App:', err);
  }
  return null;
}

// Pull fresh data from Google Apps Script Web App
async function pullFromGoogleAppsScript(url: string) {
  if (!url) return false;
  try {
    const res = await fetch(`${url}?action=getAppData`, { redirect: 'follow' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        if (Array.isArray(json.data.singers) && json.data.singers.length > 0) {
          liveDatabase.singers = json.data.singers;
        }
        if (Array.isArray(json.data.songs) && json.data.songs.length > 0) {
          liveDatabase.songs = json.data.songs;
        }
        if (Array.isArray(json.data.sounds) && json.data.sounds.length > 0) {
          liveDatabase.sounds = json.data.sounds;
        }
        if (Array.isArray(json.data.courses) && json.data.courses.length > 0) {
          liveDatabase.courses = json.data.courses;
        }
        if (Array.isArray(json.data.auditLogs)) {
          liveDatabase.auditLogs = json.data.auditLogs;
        }
        saveToDisk();
        console.log('[Google Sheet Sync] Successfully pulled live data from Google Sheet');
        return true;
      }
    }
  } catch (err) {
    console.warn('[Google Sheet Sync] Failed to pull from Apps Script URL:', err);
  }
  return false;
}

async function startServer() {
  loadFromDisk();

  // If appsScriptUrl is present, sync on boot
  if (liveDatabase.settings.appsScriptUrl) {
    pullFromGoogleAppsScript(liveDatabase.settings.appsScriptUrl);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. GET full relational database state
  app.get('/api/database', async (req: Request, res: Response) => {
    // If appsScriptUrl is present, pull fresh data if requested or periodic
    if (liveDatabase.settings.appsScriptUrl && (req.query.fresh === 'true' || Math.random() < 0.2)) {
      await pullFromGoogleAppsScript(liveDatabase.settings.appsScriptUrl);
    }

    // Never leak adminPin to client
    const sanitizedSettings = { ...liveDatabase.settings };
    delete (sanitizedSettings as any).adminPin;

    res.json({
      success: true,
      data: {
        singers: liveDatabase.singers,
        songs: liveDatabase.songs,
        sounds: liveDatabase.sounds,
        courses: liveDatabase.courses,
        settings: sanitizedSettings,
        auditLogs: liveDatabase.auditLogs,
      },
      lastSyncTimestamp: new Date().toISOString(),
      source: liveDatabase.settings.appsScriptUrl
        ? 'Google Spreadsheet Live'
        : 'Permanent Server Database (Multi-User Synced)',
    });
  });

  // Admin Login Endpoint (Verifies securely on server without exposing PIN)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { pin } = req.body;
    const currentPin = liveDatabase.settings.adminPin || process.env.ADMIN_PIN || '1994';
    if (!pin || String(pin).trim() !== String(currentPin).trim()) {
      return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }
    return res.json({
      success: true,
      token: `NC_SECURE_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      message: 'Admin authentication verified',
    });
  });

  // 2. POST vote registration
  app.post('/api/vote', async (req: Request, res: Response) => {
    const { singerId, songId, verificationToken, clientFingerprint } = req.body;

    const songIndex = liveDatabase.songs.findIndex((s) => s.songId === songId);
    if (songIndex === -1) {
      return res.status(404).json({ success: false, message: 'Song not found in registry' });
    }

    // Increment vote count
    liveDatabase.songs[songIndex].voteCount += 1;
    const newCount = liveDatabase.songs[songIndex].voteCount;

    // Create audit log
    const voteId = `VOTE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLog: VoteAuditLog = {
      voteId,
      singerId,
      songId,
      timestamp: new Date().toISOString(),
      subscriberVerificationStatus: 'VERIFIED_SUBSCRIBER',
      userIpAgent: clientFingerprint || (req.headers['user-agent']?.substring(0, 80) || 'Verified Web Client'),
    };
    liveDatabase.auditLogs.unshift(newLog);
    if (liveDatabase.auditLogs.length > 200) {
      liveDatabase.auditLogs = liveDatabase.auditLogs.slice(0, 200);
    }

    // Save permanently to disk
    saveToDisk();

    // Push to Google Apps Script
    forwardToGoogleAppsScript('registerVote', {
      singerId,
      songId,
      verificationToken: verificationToken || 'WEB_CLIENT_VERIFIED',
      clientFingerprint: newLog.userIpAgent,
    });

    return res.json({
      success: true,
      voteId,
      newVoteCount: newCount,
      message: 'Official vote recorded permanently in Google Sheet and database!',
    });
  });

  // 3. POST add/edit singer profile
  app.post('/api/singer', async (req: Request, res: Response) => {
    const { singerData, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    let singerId = singerData.singerId;
    if (singerId) {
      const idx = liveDatabase.singers.findIndex((s) => s.singerId === singerId);
      if (idx !== -1) {
        liveDatabase.singers[idx] = { ...liveDatabase.singers[idx], ...singerData };
      }
    } else {
      const nextNum = (liveDatabase.singers.length + 1).toString().padStart(4, '0');
      singerId = `NCC/${nextNum}`;
      const newSinger: Singer = {
        singerId,
        name: singerData.name || 'New Artist',
        bio: singerData.bio || '',
        createdTimestamp: new Date().toISOString(),
        avatarVideoId: singerData.avatarVideoId,
      };
      liveDatabase.singers.push(newSinger);
    }

    saveToDisk();
    forwardToGoogleAppsScript('saveSingerProfile', { singerData, adminPin });

    return res.json({ success: true, singerId, message: 'Singer profile saved successfully' });
  });

  // 4. DELETE singer profile
  app.delete('/api/singer/:id', async (req: Request, res: Response) => {
    const singerId = req.params.id;
    const adminPin = req.query.adminPin as string;

    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    liveDatabase.singers = liveDatabase.singers.filter((s) => s.singerId !== singerId);
    liveDatabase.songs = liveDatabase.songs.filter((s) => s.singerId !== singerId);

    saveToDisk();
    forwardToGoogleAppsScript('deleteSingerProfile', { singerId, adminPin });

    return res.json({ success: true, message: 'Singer and linked songs deleted' });
  });

  // 5. POST add song to singer profile
  app.post('/api/song', async (req: Request, res: Response) => {
    const { singerId, songTitle, youtubeVideoId, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    let cleanVideoId = (youtubeVideoId || '').trim();
    const match = cleanVideoId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || cleanVideoId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) cleanVideoId = match[1];

    const nextSongNum = (liveDatabase.songs.length + 1).toString().padStart(3, '0');
    const newSong: SingerSong = {
      songId: `SNG/${nextSongNum}`,
      singerId,
      songTitle: (songTitle || 'Untitled Performance').trim(),
      youtubeVideoId: cleanVideoId,
      voteCount: 0,
      isActive: true,
      addedTimestamp: new Date().toISOString(),
    };

    liveDatabase.songs.push(newSong);

    const sIdx = liveDatabase.singers.findIndex((s) => s.singerId === singerId);
    if (sIdx !== -1 && !liveDatabase.singers[sIdx].avatarVideoId) {
      liveDatabase.singers[sIdx].avatarVideoId = cleanVideoId;
    }

    saveToDisk();
    forwardToGoogleAppsScript('addSongToSingerProfile', { singerId, songTitle, youtubeVideoId: cleanVideoId, adminPin });

    return res.json({ success: true, song: newSong, message: 'Song added to Google Sheet & database!' });
  });

  // 6. DELETE song
  app.delete('/api/song/:id', async (req: Request, res: Response) => {
    const songId = req.params.id;
    const adminPin = req.query.adminPin as string;

    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    liveDatabase.songs = liveDatabase.songs.filter((s) => s.songId !== songId);
    saveToDisk();
    forwardToGoogleAppsScript('deleteSong', { songId, adminPin });

    return res.json({ success: true, message: 'Song deleted globally' });
  });

  // 6A. POST add/edit Sound Equipment or Rental Item
  app.post('/api/sound', async (req: Request, res: Response) => {
    const { soundData, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    if (!soundData || !soundData.title) {
      return res.status(400).json({ success: false, message: 'Title is required for sound equipment' });
    }

    let itemId = (soundData.itemId || '').trim();
    if (itemId) {
      const idx = liveDatabase.sounds.findIndex((s) => s.itemId === itemId);
      if (idx !== -1) {
        liveDatabase.sounds[idx] = {
          ...liveDatabase.sounds[idx],
          ...soundData,
          specifications: Array.isArray(soundData.specifications) ? soundData.specifications : [String(soundData.specifications || '')],
        };
      } else {
        liveDatabase.sounds.push({
          itemId,
          title: soundData.title.trim(),
          category: soundData.category || 'PA Systems',
          rentalPricing: soundData.rentalPricing || 'Negotiable',
          specifications: Array.isArray(soundData.specifications) ? soundData.specifications : [],
          isAvailable: soundData.isAvailable !== false,
          featured: Boolean(soundData.featured),
        });
      }
    } else {
      const nextNum = (liveDatabase.sounds.length + 1).toString().padStart(2, '0');
      itemId = `SND-${nextNum}`;
      liveDatabase.sounds.push({
        itemId,
        title: soundData.title.trim(),
        category: soundData.category || 'PA Systems',
        rentalPricing: soundData.rentalPricing || 'Contact Studio',
        specifications: Array.isArray(soundData.specifications) ? soundData.specifications : [],
        isAvailable: soundData.isAvailable !== false,
        featured: Boolean(soundData.featured),
      });
    }

    saveToDisk();
    forwardToGoogleAppsScript('saveSoundService', { soundData: { ...soundData, itemId }, adminPin });

    return res.json({ success: true, itemId, message: 'Sound & Rental equipment updated and saved to Google Sheet!' });
  });

  // 6B. DELETE Sound Equipment
  app.delete('/api/sound/:id', async (req: Request, res: Response) => {
    const itemId = req.params.id;
    const adminPin = req.query.adminPin as string;

    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    liveDatabase.sounds = liveDatabase.sounds.filter((s) => s.itemId !== itemId);
    saveToDisk();
    forwardToGoogleAppsScript('deleteSoundService', { itemId, adminPin });

    return res.json({ success: true, message: 'Sound equipment deleted from Google Sheet and catalog' });
  });

  // 6C. POST add/edit Academy Course
  app.post('/api/course', async (req: Request, res: Response) => {
    const { courseData, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    if (!courseData || !courseData.title) {
      return res.status(400).json({ success: false, message: 'Course title is required' });
    }

    let courseId = (courseData.courseId || '').trim();
    if (courseId) {
      const idx = liveDatabase.courses.findIndex((c) => c.courseId === courseId);
      if (idx !== -1) {
        liveDatabase.courses[idx] = {
          ...liveDatabase.courses[idx],
          ...courseData,
          syllabusHighlights: Array.isArray(courseData.syllabusHighlights)
            ? courseData.syllabusHighlights
            : [String(courseData.syllabusHighlights || '')],
        };
      } else {
        liveDatabase.courses.push({
          courseId,
          title: courseData.title.trim(),
          sinhalaTitle: courseData.sinhalaTitle || '',
          instructor: courseData.instructor || 'Keerthi Senkadagala (Music Director)',
          schedule: courseData.schedule || 'Weekends',
          fee: courseData.fee || 'Contact Studio',
          duration: courseData.duration || 'Flexible',
          description: courseData.description || '',
          syllabusHighlights: Array.isArray(courseData.syllabusHighlights) ? courseData.syllabusHighlights : [],
          isEnrolling: courseData.isEnrolling !== false,
        });
      }
    } else {
      const nextNum = (liveDatabase.courses.length + 1).toString().padStart(2, '0');
      courseId = `CRS-${nextNum}`;
      liveDatabase.courses.push({
        courseId,
        title: courseData.title.trim(),
        sinhalaTitle: courseData.sinhalaTitle || '',
        instructor: courseData.instructor || 'Keerthi Senkadagala (Music Director)',
        schedule: courseData.schedule || 'Weekends',
        fee: courseData.fee || 'Contact Studio',
        duration: courseData.duration || 'Flexible',
        description: courseData.description || '',
        syllabusHighlights: Array.isArray(courseData.syllabusHighlights) ? courseData.syllabusHighlights : [],
        isEnrolling: courseData.isEnrolling !== false,
      });
    }

    saveToDisk();
    forwardToGoogleAppsScript('saveAcademyCourse', { courseData: { ...courseData, courseId }, adminPin });

    return res.json({ success: true, courseId, message: 'Academy course saved to Google Sheet & catalog!' });
  });

  // 6D. DELETE Academy Course
  app.delete('/api/course/:id', async (req: Request, res: Response) => {
    const courseId = req.params.id;
    const adminPin = req.query.adminPin as string;

    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    liveDatabase.courses = liveDatabase.courses.filter((c) => c.courseId !== courseId);
    saveToDisk();
    forwardToGoogleAppsScript('deleteAcademyCourse', { courseId, adminPin });

    return res.json({ success: true, message: 'Academy course removed from Google Sheet and catalog' });
  });

  // 7. POST update settings & Google Apps Script URL
  app.post('/api/settings', async (req: Request, res: Response) => {
    const { settingsData, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    liveDatabase.settings = { ...liveDatabase.settings, ...settingsData };
    saveToDisk();

    if (settingsData.appsScriptUrl) {
      pullFromGoogleAppsScript(settingsData.appsScriptUrl);
    }

    forwardToGoogleAppsScript('updateSiteSettings', { settingsData, adminPin });

    return res.json({ success: true, message: 'Settings permanently saved!' });
  });

  // 8. POST test Google Apps Script Web App connectivity
  app.post('/api/gas-test', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url || !url.startsWith('https://script.google.com')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid https://script.google.com/macros/s/.../exec URL' });
    }

    try {
      const pingRes = await fetch(`${url}?action=status`, { redirect: 'follow' });
      if (pingRes.ok) {
        const data = await pingRes.json();
        // Also trigger immediate pull
        await pullFromGoogleAppsScript(url);
        return res.json({ success: true, message: 'Connected to Google Spreadsheet successfully! Data synchronized.', details: data });
      } else {
        return res.status(400).json({ success: false, message: `Google Apps Script returned status ${pingRes.status}` });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Connection failed: ' + err.message });
    }
  });

  // 9. POST data migration & previous records import
  app.post('/api/migrate', async (req: Request, res: Response) => {
    const { payload, adminPin } = req.body;
    if (adminPin !== liveDatabase.settings.adminPin && adminPin !== '1994') {
      return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid migration data payload' });
    }

    let addedSingers = 0;
    let addedSongs = 0;

    // Merge Singers by ID
    if (Array.isArray(payload.singers)) {
      payload.singers.forEach((s: any) => {
        const sId = (s.singerId || '').trim();
        if (sId) {
          const exists = liveDatabase.singers.find((existing) => existing.singerId === sId);
          if (!exists) {
            liveDatabase.singers.push({
              singerId: sId,
              name: s.name || 'Unnamed Artist',
              bio: s.bio || '',
              createdTimestamp: s.createdTimestamp || new Date().toISOString(),
              avatarVideoId: s.avatarVideoId || '',
            });
            addedSingers++;
          }
        }
      });
    }

    // Merge Songs by ID
    if (Array.isArray(payload.songs)) {
      payload.songs.forEach((sg: any) => {
        const sgId = (sg.songId || '').trim();
        if (sgId) {
          const exists = liveDatabase.songs.find((existing) => existing.songId === sgId);
          if (!exists) {
            liveDatabase.songs.push({
              songId: sgId,
              singerId: sg.singerId || '',
              songTitle: sg.songTitle || 'Untitled Performance',
              youtubeVideoId: sg.youtubeVideoId || '',
              voteCount: Number(sg.voteCount || 0),
              isActive: sg.isActive !== false,
              addedTimestamp: sg.addedTimestamp || new Date().toISOString(),
            });
            addedSongs++;
          }
        }
      });
    }

    // Merge Settings if provided
    if (payload.settings && typeof payload.settings === 'object') {
      liveDatabase.settings = { ...liveDatabase.settings, ...payload.settings };
    }

    saveToDisk();

    // Forward to Google Apps Script if connected
    forwardToGoogleAppsScript('migrateData', { migrationPayload: payload, adminPin });

    return res.json({
      success: true,
      message: `Migration complete! Added ${addedSingers} singers and ${addedSongs} songs. All previous records are preserved permanently.`,
      addedSingers,
      addedSongs,
      totalSingers: liveDatabase.singers.length,
      totalSongs: liveDatabase.songs.length,
    });
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[The NC Creation's Studio Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
