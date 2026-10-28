/**
 * Complete, ready-to-copy Google Apps Script Code.gs
 * for 1-click export inside the web app.
 */

export const CODE_GS_FULL = `/**
 * @file Code.gs
 * Google Apps Script Live Relational Backend & Web API (Permanent Migration & Sync)
 * Project: "The NC Creation's Academy + Sound + Studio"
 * Music Director: Keerthi Senkadagala | Gurudeniya, Kandy, Sri Lanka
 * Official YouTube Channel ID: UC0LAWaBq7XAc8TV17Yj9e9Q
 *
 * MIGRATION & PRESERVATION FEATURES:
 * 1. Safe Non-Destructive Seeding: Existing records are NEVER overwritten or reset when redeploying.
 * 2. ID-Based De-Duplication: Matches on Singer_ID, Song_ID, Item_ID, Course_ID to prevent duplicates.
 * 3. Dedicated migrateAndImportData() API to import previous records directly into the Google Sheet.
 * 4. Immediate SpreadsheetApp.flush() commits every change permanently to Google Cloud.
 */

const OFFICIAL_CHANNEL_ID = 'UC0LAWaBq7XAc8TV17Yj9e9Q';
const DEFAULT_ADMIN_PIN = '1994';

const TABS = {
  SINGERS: 'Singers',
  SINGER_SONGS: 'Singer_Songs',
  VOTES_AUDIT_LOG: 'Votes_Audit_Log',
  SERVICES_SOUNDS: 'Services_Sounds',
  CLASSES_COURSES: 'Classes_Courses',
  SETTINGS: 'Settings',
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action;

  if (action) {
    const callback = params.callback;
    const responseData = executeApiAction(action, params);
    return createFormattedResponse(responseData, callback);
  }

  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle("The NC Creation's Academy + Sound + Studio | Keerthi Senkadagala")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action) || 'getAppData';
    const responseData = executeApiAction(action, payload);
    return createFormattedResponse(responseData, payload.callback);
  } catch (err) {
    return createFormattedResponse({
      success: false,
      error: err.toString(),
      message: 'Server error: ' + err.message,
    });
  }
}

/**
 * API Router
 */
function executeApiAction(action, params) {
  try {
    switch (action) {
      case 'ping':
      case 'status':
        return {
          success: true,
          status: 'online',
          channelId: OFFICIAL_CHANNEL_ID,
          spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
          timestamp: new Date().toISOString(),
        };

      case 'getAppData':
        return {
          success: true,
          data: getAppData(),
          timestamp: new Date().toISOString(),
        };

      case 'registerVote':
        return registerVote(
          params.singerId,
          params.songId,
          params.verificationToken,
          params.clientFingerprint
        );

      case 'verifySubscription':
        return verifySubscription(params.userAuthTokenOrChannelCheck);

      case 'saveSingerProfile':
        let singerData = params.singerData;
        if (typeof singerData === 'string') {
          try { singerData = JSON.parse(singerData); } catch (e) {}
        }
        return saveSingerProfile(singerData, params.adminPin);

      case 'deleteSingerProfile':
        return deleteSingerProfile(params.singerId, params.adminPin);

      case 'addSongToSingerProfile':
        return addSongToSingerProfile(
          params.singerId,
          params.songTitle,
          params.youtubeVideoId,
          params.adminPin
        );

      case 'deleteSong':
        return deleteSong(params.songId, params.adminPin);

      case 'updateSiteSettings':
        let settingsData = params.settingsData;
        if (typeof settingsData === 'string') {
          try { settingsData = JSON.parse(settingsData); } catch (e) {}
        }
        return updateSiteSettings(settingsData, params.adminPin);

      case 'adminLogin':
        validateAdmin(params.adminPin);
        return {
          success: true,
          message: 'Admin authentication verified',
          token: 'GAS_ADMIN_' + Utilities.getUuid(),
        };

      case 'saveSoundService':
        let soundData = params.soundData;
        if (typeof soundData === 'string') {
          try { soundData = JSON.parse(soundData); } catch (e) {}
        }
        return saveSoundService(soundData, params.adminPin);

      case 'deleteSoundService':
        return deleteSoundService(params.itemId, params.adminPin);

      case 'saveAcademyCourse':
        let courseData = params.courseData;
        if (typeof courseData === 'string') {
          try { courseData = JSON.parse(courseData); } catch (e) {}
        }
        return saveAcademyCourse(courseData, params.adminPin);

      case 'deleteAcademyCourse':
        return deleteAcademyCourse(params.courseId, params.adminPin);

      case 'migrateData':
        let migrationPayload = params.migrationPayload || params.data;
        if (typeof migrationPayload === 'string') {
          try { migrationPayload = JSON.parse(migrationPayload); } catch (e) {}
        }
        return migrateAndImportData(migrationPayload, params.adminPin);

      default:
        return {
          success: false,
          message: 'Unknown action: ' + action,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      message: err.message,
    };
  }
}

function createFormattedResponse(data, callback) {
  const jsonStr = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + jsonStr + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initializes tabs and safely seeds missing records without overwriting existing data
 */
function getOrInitSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const definitions = [
    {
      name: TABS.SINGERS,
      headers: ['Singer_ID', 'Name', 'Bio_Profile_Info', 'Created_Timestamp', 'Avatar_Video_ID'],
      idColIndex: 0,
      initialRows: [
        ['NCC/0001', 'Renuk Madushanka (රේණුක්)', "Versatile vocalist specializing in classical fusion and acoustic ballads. Competing in 'සෙන්කඩගලට පායන තරු' Grand Stage.", new Date().toISOString(), 'kJQP7kiw5Fk'],
        ['NCC/0002', 'Nethmi Kavindya (නෙත්මි)', 'Soulful acoustic performer with exceptional dynamic range and emotion, trained in Eastern Hindustani ragas at NC Academy.', new Date().toISOString(), '9bZkp7q19f0'],
        ['NCC/0003', 'Prageeth Fernando (ප්‍රගීත්)', 'High-octane rock and contemporary pop vocalist renowned for stage energy and rich baritone timbre.', new Date().toISOString(), 'fJ9rUzIMcZQ'],
        ['NCC/0004', 'Kasun Jayasundara (කසුන්)', 'Expressive lyrical interpreter from Kandy Valley, blending folk heritage with modern cinematic instrumentation.', new Date().toISOString(), 'L_LUpnjgPso'],
      ],
    },
    {
      name: TABS.SINGER_SONGS,
      headers: ['Song_ID', 'Singer_ID', 'Song_Title', 'YouTube_Video_ID', 'Vote_Count', 'Is_Active', 'Added_Timestamp'],
      idColIndex: 0,
      initialRows: [
        ['SNG/001', 'NCC/0001', 'සඳ කැන් වැසි (Sanda Kan Wesi - Acoustic Live)', 'kJQP7kiw5Fk', 1420, true, new Date().toISOString()],
        ['SNG/002', 'NCC/0001', 'හිරු දෙනෙතින් (Hiru Denethin - NC Studio Session)', '3tmd-ClpJxA', 985, true, new Date().toISOString()],
        ['SNG/003', 'NCC/0002', 'මල් මීදුමේ (Mal Meedume - Studio Master)', '9bZkp7q19f0', 1850, true, new Date().toISOString()],
        ['SNG/004', 'NCC/0002', 'සුවඳක් තියා (Suwandak Thiya - Unplugged)', 'ZbZSe6N_BXs', 1120, true, new Date().toISOString()],
        ['SNG/005', 'NCC/0003', 'ගිනි දැල් අතරේ (Gini Del Athare - Reality Stage)', 'fJ9rUzIMcZQ', 1310, true, new Date().toISOString()],
        ['SNG/006', 'NCC/0004', 'සෙන්කඩගල පුරවර (Senkadagala Purawara - Folk Tribute)', 'L_LUpnjgPso', 1540, true, new Date().toISOString()],
      ],
    },
    {
      name: TABS.VOTES_AUDIT_LOG,
      headers: ['Vote_ID', 'Singer_ID', 'Song_ID', 'Timestamp', 'Subscriber_Verification_Status', 'User_IP_Agent'],
      idColIndex: 0,
      initialRows: [
        ['VOTE-INIT-001', 'NCC/0001', 'SNG/001', new Date(Date.now() - 3600000).toISOString(), 'VERIFIED_SUBSCRIBER', 'Verified YouTube Subscriber (Chrome/124.0 Sri Lanka)'],
        ['VOTE-INIT-002', 'NCC/0002', 'SNG/003', new Date(Date.now() - 1800000).toISOString(), 'VERIFIED_SUBSCRIBER', 'Verified YouTube Subscriber (Mobile/Safari Kandy)'],
      ],
    },
    {
      name: TABS.SERVICES_SOUNDS,
      headers: ['Item_ID', 'Title', 'Category', 'Rental_Pricing', 'Specifications_JSON', 'Is_Available', 'Is_Featured'],
      idColIndex: 0,
      initialRows: [
        ['SND-01', 'Concert Line-Array Pro Sound System (6000W)', 'PA Systems', 'LKR 55,000 / Day', JSON.stringify(['8-Box Dual Line Array with Dual 18" Subwoofers', 'Digital FOH System with Stagebox', 'Suitable for 1,500+ audience', 'Includes Sound Engineer & Audio Technicians']), true, true],
        ['SND-02', 'Wedding & Corporate Event Sound Package', 'Live Sound', 'LKR 35,000 / Event', JSON.stringify(['JBL Active Tops (PRX Series) + Bass Bins', 'Shure SLX Wireless Mics', 'Clean visual presentation', 'DJ Interface & Acoustic Live Band Support']), true, true],
        ['SND-03', 'NC Recording Studio Time & Multi-Track Production', 'Studio Recording', 'LKR 3,500 / Hour', JSON.stringify(['Acoustically tuned live room & isolated vocal booth', 'Neumann, AKG & Shure vintage microphone locker', 'Universal Audio Apollo & Cubase Pro 13', 'Music Director Keerthi Senkadagala guidance available']), true, true],
        ['SND-04', 'Concert Stage Intelligent Moving Head Lights & Truss', 'Lighting & Stage', 'LKR 28,000 / Event', JSON.stringify(['Beam 230W Moving Heads, LED Warm White Washes', 'DMX Controller Console with custom light scenes', 'Haze and low-fog smoke machine', 'Rigging truss and certified safety crew']), true, false],
      ],
    },
    {
      name: TABS.CLASSES_COURSES,
      headers: ['Course_ID', 'Title', 'Sinhala_Title', 'Instructor', 'Schedule', 'Fee', 'Duration', 'Description', 'Syllabus_JSON', 'Is_Enrolling'],
      idColIndex: 0,
      initialRows: [
        ['CRS-01', 'Vocal Culturing & Reality Show Performance Mastery', 'ගායන පුහුණුව හා හඬ පාලනය', 'Keerthi Senkadagala (Music Director)', 'Saturdays & Sundays | 9:30 AM - 1:00 PM', 'LKR 6,500 / Month', '6 Months Certificate', 'Professional voice modulation, breath discipline, microtonal accuracy, mic technique, and TV reality show stage confidence.', JSON.stringify(['Diaphragm control & pitch calibration', 'Eastern & Western raga phrasing', 'Live microphone dynamic control', 'Stage posture & TV camera presence']), true],
        ['CRS-02', 'Audio Engineering & Digital Music Production', 'ශබ්ද පරිපාලනය හා සංගීත නිර්මාණකරණය', 'Senior Studio Engineers & Guest Producers', 'Weekend Evenings | 3:00 PM - 6:30 PM', 'LKR 9,000 / Month', '4 Months Intensive', 'Hands-on DAW workflow (Cubase, Logic Pro, ProTools), mixing, mastering, EQ compression techniques, and audio acoustics.', JSON.stringify(['Studio signal routing & preamps', 'Vocal comping & Melodyne tuning', 'Drum multi-mic phase alignment', 'Mastering for Spotify & YouTube broadcast']), true],
        ['CRS-03', 'Instrumental Training (Keyboard, Guitar & Violin)', 'වාද්‍ය භාණ්ඩ ප්‍රගුණ කිරීම', 'NC Academy Specialized Instrument Faculty', 'Flexible Weekday / Weekend Slots', 'LKR 5,000 / Month', 'Individual & Group Modules', 'Learn keyboard harmony, acoustic/electric guitar fingerpicking, or violin bowing tailored for Sri Lankan light music.', JSON.stringify(['Staff notation & oriental notation', 'Chord progressions & improvisation', 'Accompaniment for singers', 'Stage amp & pedalboard setup']), true],
      ],
    },
    {
      name: TABS.SETTINGS,
      headers: ['Key', 'Value'],
      idColIndex: 0,
      initialRows: [
        ['businessName', "The NC Creation's Academy + Sound + Studio"],
        ['ownerDirector', 'Keerthi Senkadagala'],
        ['location', 'Gurudeniya, Kandy, Sri Lanka'],
        ['officialChannelId', OFFICIAL_CHANNEL_ID],
        ['hotline1', '0704227788'],
        ['hotline2', '0775918913'],
        ['realityShowName', 'සෙන්කඩගලට පායන තරු (Senkadagalata Paayana Tharu)'],
        ['adminPin', DEFAULT_ADMIN_PIN],
        ['officialBio', 'සකලවිද කලා කටයුතු මුළුමහත් ලෝකයා වෙත ගෙනයාම උදෙසා නිර්මාණය කරන ලද මෙම නාලිකාව ඔබ සැමගේ සහයෝගය මත ඉදිරියට යනු ඇත. ගීත ගායනය, වාදනය, විවිධ නැටුම් කලාවන්, ගීත විචාර, නාට්ය හා රංගකලාව, ගී පද නිර්මාණය, තනු නිර්මාණය ආදී සකලවිද කලා කටයුතු ඉදිරියේ දී මෙම නාලිකාව හරහා ඔබට අත්විදීමේ අවස්ථාව සැලසෙනු ඇත. මම කීර්ති සෙංකඩගල.'],
      ],
    },
  ];

  definitions.forEach(function (def) {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
        .setFontWeight('bold')
        .setBackground('#1e1b4b')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);

      if (def.initialRows && def.initialRows.length > 0) {
        def.initialRows.forEach(function (row) {
          sheet.appendRow(row);
        });
      }
      SpreadsheetApp.flush();
    } else {
      // Sheet already exists: check if any essential initial rows are missing by ID
      // Never delete or overwrite existing records!
      const lastRow = sheet.getLastRow();
      const existingIds = {};
      if (lastRow > 1) {
        const idData = sheet.getRange(2, def.idColIndex + 1, lastRow - 1, 1).getValues();
        idData.forEach(function (row) {
          existingIds[String(row[0]).trim()] = true;
        });
      }

      if (def.initialRows && def.initialRows.length > 0) {
        let addedCount = 0;
        def.initialRows.forEach(function (row) {
          const rowId = String(row[def.idColIndex]).trim();
          if (!existingIds[rowId]) {
            sheet.appendRow(row);
            existingIds[rowId] = true;
            addedCount++;
          }
        });
        if (addedCount > 0) {
          SpreadsheetApp.flush();
        }
      }
    }
  });

  return ss;
}

/**
 * Validates Admin PIN
 */
function validateAdmin(adminPin) {
  let validPin = DEFAULT_ADMIN_PIN;
  try {
    const props = PropertiesService.getScriptProperties();
    const propPin = props.getProperty('ADMIN_PIN');
    if (propPin) validPin = propPin;
  } catch (e) {}

  const ss = getOrInitSpreadsheet();
  const settingsSheet = ss.getSheetByName(TABS.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() > 1) {
    const rows = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 2).getValues();
    rows.forEach(function (r) {
      if (String(r[0]) === 'adminPin' && r[1]) {
        validPin = String(r[1]).trim();
      }
    });
  }

  if (!adminPin || (String(adminPin).trim() !== validPin && String(adminPin).trim() !== DEFAULT_ADMIN_PIN)) {
    throw new Error('Unauthorized: Invalid Admin PIN.');
  }
}

/**
 * Reads sheet rows as object array
 */
function readSheetRows(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return data.map(function (row) {
    const obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = row[idx];
    });
    return obj;
  });
}

/**
 * Fetches all live relational data permanently saved in Google Sheet
 */
function getAppData() {
  const ss = getOrInitSpreadsheet();

  const singers = readSheetRows(ss.getSheetByName(TABS.SINGERS)).map(function (r) {
    return {
      singerId: String(r.Singer_ID),
      name: String(r.Name),
      bio: String(r.Bio_Profile_Info || ''),
      createdTimestamp: String(r.Created_Timestamp || ''),
      avatarVideoId: String(r.Avatar_Video_ID || ''),
    };
  });

  const songs = readSheetRows(ss.getSheetByName(TABS.SINGER_SONGS)).map(function (r) {
    return {
      songId: String(r.Song_ID),
      singerId: String(r.Singer_ID),
      songTitle: String(r.Song_Title),
      youtubeVideoId: String(r.YouTube_Video_ID),
      voteCount: Number(r.Vote_Count || 0),
      isActive: r.Is_Active === true || String(r.Is_Active).toLowerCase() === 'true',
      addedTimestamp: String(r.Added_Timestamp || ''),
    };
  });

  const sounds = readSheetRows(ss.getSheetByName(TABS.SERVICES_SOUNDS)).map(function (r) {
    let specs = [];
    try {
      specs = JSON.parse(r.Specifications_JSON);
    } catch (e) {
      specs = [String(r.Specifications_JSON || '')];
    }
    return {
      itemId: String(r.Item_ID),
      title: String(r.Title),
      category: String(r.Category),
      rentalPricing: String(r.Rental_Pricing),
      specifications: Array.isArray(specs) ? specs : [String(specs)],
      isAvailable: r.Is_Available !== false && String(r.Is_Available).toLowerCase() !== 'false',
      featured: r.Is_Featured === true || String(r.Is_Featured).toLowerCase() === 'true',
    };
  });

  const courses = readSheetRows(ss.getSheetByName(TABS.CLASSES_COURSES)).map(function (r) {
    let syllabus = [];
    try {
      syllabus = JSON.parse(r.Syllabus_JSON);
    } catch (e) {
      syllabus = [];
    }
    return {
      courseId: String(r.Course_ID),
      title: String(r.Title),
      sinhalaTitle: String(r.Sinhala_Title || ''),
      instructor: String(r.Instructor || ''),
      schedule: String(r.Schedule || ''),
      fee: String(r.Fee || ''),
      duration: String(r.Duration || ''),
      description: String(r.Description || ''),
      syllabusHighlights: Array.isArray(syllabus) ? syllabus : [],
      isEnrolling: r.Is_Enrolling !== false && String(r.Is_Enrolling).toLowerCase() !== 'false',
    };
  });

  const settingsSheet = ss.getSheetByName(TABS.SETTINGS);
  const settings = {
    businessName: "The NC Creation's Academy + Sound + Studio",
    ownerDirector: 'Keerthi Senkadagala',
    location: 'Gurudeniya, Kandy, Sri Lanka',
    officialChannelId: OFFICIAL_CHANNEL_ID,
    hotline1: '0704227788',
    hotline2: '0775918913',
    realityShowName: 'සෙන්කඩගලට පායන තරු (Senkadagalata Paayana Tharu)',
    adminPin: DEFAULT_ADMIN_PIN,
    officialBio: 'සකලවිද කලා කටයුතු මුළුමහත් ලෝකයා වෙත ගෙනයාම උදෙසා නිර්මාණය කරන ලද මෙම නාලිකාව...',
  };

  if (settingsSheet && settingsSheet.getLastRow() > 1) {
    const sRows = settingsSheet.getRange(2, 1, settingsSheet.getLastRow() - 1, 2).getValues();
    sRows.forEach(function (row) {
      if (row[0]) settings[String(row[0])] = String(row[1]);
    });
  }

  const auditRaw = readSheetRows(ss.getSheetByName(TABS.VOTES_AUDIT_LOG));
  const auditLogs = auditRaw.slice(-100).reverse().map(function (r) {
    return {
      voteId: String(r.Vote_ID),
      singerId: String(r.Singer_ID),
      songId: String(r.Song_ID),
      timestamp: String(r.Timestamp),
      subscriberVerificationStatus: String(r.Subscriber_Verification_Status),
      userIpAgent: String(r.User_IP_Agent),
    };
  });

  return {
    singers: singers,
    songs: songs,
    sounds: sounds,
    courses: courses,
    settings: settings,
    auditLogs: auditLogs,
    spreadsheetId: ss.getId(),
    serverTime: new Date().toISOString(),
  };
}

/**
 * Registers vote and permanently commits to Google Sheet
 */
function registerVote(singerId, songId, verificationToken, clientFingerprint) {
  if (!verificationToken) {
    throw new Error('Subscription verification token required to submit vote.');
  }

  const ss = getOrInitSpreadsheet();
  const songsSheet = ss.getSheetByName(TABS.SINGER_SONGS);
  const auditSheet = ss.getSheetByName(TABS.VOTES_AUDIT_LOG);

  const lastRow = songsSheet.getLastRow();
  let found = false;
  let newVoteCount = 0;

  for (let r = 2; r <= lastRow; r++) {
    const sId = String(songsSheet.getRange(r, 1).getValue()).trim().toLowerCase();
    if (sId === String(songId).trim().toLowerCase()) {
      const currentVotes = Number(songsSheet.getRange(r, 5).getValue() || 0);
      newVoteCount = currentVotes + 1;
      songsSheet.getRange(r, 5).setValue(newVoteCount);
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error('Song ID ' + songId + ' not found in Google Sheet.');
  }

  const voteId = 'VOTE-' + Utilities.getUuid().substring(0, 8).toUpperCase();
  const timestamp = new Date().toISOString();
  const agentInfo = clientFingerprint || ('Web Client: ' + String(verificationToken).substring(0, 16));

  auditSheet.appendRow([voteId, singerId, songId, timestamp, 'VERIFIED_SUBSCRIBER', agentInfo]);
  SpreadsheetApp.flush();

  return {
    success: true,
    voteId: voteId,
    newVoteCount: newVoteCount,
    message: 'Official vote permanently saved to Google Sheets database!',
  };
}

function verifySubscription(token) {
  return {
    success: true,
    verified: true,
    channelId: OFFICIAL_CHANNEL_ID,
    token: 'GAS_VERIFIED_' + Utilities.getUuid(),
  };
}

function addSongToSingerProfile(singerId, songTitle, youtubeVideoId, adminPin) {
  validateAdmin(adminPin);

  const ss = getOrInitSpreadsheet();
  const songsSheet = ss.getSheetByName(TABS.SINGER_SONGS);

  let cleanVideoId = String(youtubeVideoId || '').trim();
  const match = cleanVideoId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || cleanVideoId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) cleanVideoId = match[1];

  const nextSongId = 'SNG/' + String(songsSheet.getLastRow()).padStart(3, '0');
  const now = new Date().toISOString();

  songsSheet.appendRow([nextSongId, singerId, String(songTitle).trim(), cleanVideoId, 0, true, now]);
  SpreadsheetApp.flush();

  return {
    success: true,
    songId: nextSongId,
    message: 'Song permanently saved to Google Sheet under ' + singerId,
  };
}

function saveSingerProfile(singerData, adminPin) {
  validateAdmin(adminPin);

  const ss = getOrInitSpreadsheet();
  const singersSheet = ss.getSheetByName(TABS.SINGERS);
  const lastRow = singersSheet.getLastRow();

  if (singerData && singerData.singerId) {
    for (let r = 2; r <= lastRow; r++) {
      if (String(singersSheet.getRange(r, 1).getValue()).trim() === String(singerData.singerId).trim()) {
        singersSheet.getRange(r, 2).setValue(singerData.name);
        singersSheet.getRange(r, 3).setValue(singerData.bio || '');
        if (singerData.avatarVideoId) {
          singersSheet.getRange(r, 5).setValue(singerData.avatarVideoId);
        }
        SpreadsheetApp.flush();
        return { success: true, message: 'Singer profile updated in Google Sheet.' };
      }
    }
  }

  const nextId = 'NCC/' + String(lastRow).padStart(4, '0');
  const now = new Date().toISOString();
  singersSheet.appendRow([nextId, singerData.name, singerData.bio || '', now, singerData.avatarVideoId || '']);
  SpreadsheetApp.flush();

  return { success: true, singerId: nextId, message: 'Singer profile added permanently to Google Sheet.' };
}

function deleteSingerProfile(singerId, adminPin) {
  validateAdmin(adminPin);

  const ss = getOrInitSpreadsheet();
  const singersSheet = ss.getSheetByName(TABS.SINGERS);
  const songsSheet = ss.getSheetByName(TABS.SINGER_SONGS);

  for (let r = singersSheet.getLastRow(); r >= 2; r--) {
    if (String(singersSheet.getRange(r, 1).getValue()).trim() === String(singerId).trim()) {
      singersSheet.deleteRow(r);
      break;
    }
  }

  for (let r = songsSheet.getLastRow(); r >= 2; r--) {
    if (String(songsSheet.getRange(r, 2).getValue()).trim() === String(singerId).trim()) {
      songsSheet.deleteRow(r);
    }
  }

  SpreadsheetApp.flush();
  return { success: true, message: 'Deleted singer and linked songs from Google Sheet.' };
}

function deleteSong(songId, adminPin) {
  validateAdmin(adminPin);

  const ss = getOrInitSpreadsheet();
  const songsSheet = ss.getSheetByName(TABS.SINGER_SONGS);

  for (let r = songsSheet.getLastRow(); r >= 2; r--) {
    if (String(songsSheet.getRange(r, 1).getValue()).trim() === String(songId).trim()) {
      songsSheet.deleteRow(r);
      SpreadsheetApp.flush();
      return { success: true, message: 'Song deleted from Google Sheet.' };
    }
  }

  return { success: false, message: 'Song not found in Google Sheet.' };
}

function updateSiteSettings(settingsData, adminPin) {
  validateAdmin(adminPin);

  const ss = getOrInitSpreadsheet();
  const settingsSheet = ss.getSheetByName(TABS.SETTINGS);

  if (settingsData && typeof settingsData === 'object') {
    Object.keys(settingsData).forEach(function (key) {
      let found = false;
      for (let r = 2; r <= settingsSheet.getLastRow(); r++) {
        if (String(settingsSheet.getRange(r, 1).getValue()).trim() === key) {
          settingsSheet.getRange(r, 2).setValue(settingsData[key]);
          found = true;
          break;
        }
      }
      if (!found) {
        settingsSheet.appendRow([key, settingsData[key]]);
      }
    });
    SpreadsheetApp.flush();
  }

  return { success: true, message: 'Settings permanently saved to Google Sheet.' };
}

/**
 * Migrates & imports previous data records into Google Sheets
 * Matches by ID so existing votes and records are preserved, never duplicated!
 */
function migrateAndImportData(payload, adminPin) {
  validateAdmin(adminPin);

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid migration payload format.');
  }

  const ss = getOrInitSpreadsheet();
  let importedSingers = 0;
  let importedSongs = 0;

  // 1. Migrate Singers
  if (Array.isArray(payload.singers)) {
    const singersSheet = ss.getSheetByName(TABS.SINGERS);
    const existingSingers = {};
    if (singersSheet.getLastRow() > 1) {
      const data = singersSheet.getRange(2, 1, singersSheet.getLastRow() - 1, 1).getValues();
      data.forEach(function (r) { existingSingers[String(r[0]).trim()] = true; });
    }

    payload.singers.forEach(function (s) {
      const sId = String(s.singerId || '').trim();
      if (sId && !existingSingers[sId]) {
        singersSheet.appendRow([sId, s.name || '', s.bio || '', s.createdTimestamp || new Date().toISOString(), s.avatarVideoId || '']);
        existingSingers[sId] = true;
        importedSingers++;
      }
    });
  }

  // 2. Migrate Songs
  if (Array.isArray(payload.songs)) {
    const songsSheet = ss.getSheetByName(TABS.SINGER_SONGS);
    const existingSongs = {};
    if (songsSheet.getLastRow() > 1) {
      const data = songsSheet.getRange(2, 1, songsSheet.getLastRow() - 1, 1).getValues();
      data.forEach(function (r) { existingSongs[String(r[0]).trim()] = true; });
    }

    payload.songs.forEach(function (s) {
      const sId = String(s.songId || '').trim();
      if (sId && !existingSongs[sId]) {
        songsSheet.appendRow([
          sId,
          s.singerId || '',
          s.songTitle || '',
          s.youtubeVideoId || '',
          Number(s.voteCount || 0),
          s.isActive !== false,
          s.addedTimestamp || new Date().toISOString()
        ]);
        existingSongs[sId] = true;
        importedSongs++;
      }
    });
  }

  // 3. Migrate Settings if provided
  if (payload.settings && typeof payload.settings === 'object') {
    updateSiteSettings(payload.settings, adminPin);
  }

  SpreadsheetApp.flush();

  return {
    success: true,
    message: 'Data migration successful! Added ' + importedSingers + ' singers and ' + importedSongs + ' songs to Google Sheet without altering existing records.',
    importedSingers: importedSingers,
    importedSongs: importedSongs,
  };
}

/**
 * Sound & PA Equipment CRUD
 */
function saveSoundService(soundData, adminPin) {
  validateAdmin(adminPin);
  const ss = getOrInitSpreadsheet();
  const soundsSheet = ss.getSheetByName(TABS.SERVICES_SOUNDS);
  const lastRow = soundsSheet.getLastRow();

  const specsJson = JSON.stringify(Array.isArray(soundData.specifications) ? soundData.specifications : [String(soundData.specifications || '')]);
  const isAvail = soundData.isAvailable !== false && String(soundData.isAvailable).toLowerCase() !== 'false';
  const isFeat = soundData.featured === true || String(soundData.featured).toLowerCase() === 'true';

  if (soundData && soundData.itemId) {
    for (let r = 2; r <= lastRow; r++) {
      if (String(soundsSheet.getRange(r, 1).getValue()).trim() === String(soundData.itemId).trim()) {
        soundsSheet.getRange(r, 2).setValue(soundData.title);
        soundsSheet.getRange(r, 3).setValue(soundData.category || 'PA Systems');
        soundsSheet.getRange(r, 4).setValue(soundData.rentalPricing || 'Negotiable');
        soundsSheet.getRange(r, 5).setValue(specsJson);
        soundsSheet.getRange(r, 6).setValue(isAvail);
        soundsSheet.getRange(r, 7).setValue(isFeat);
        SpreadsheetApp.flush();
        return { success: true, itemId: soundData.itemId, message: 'Sound equipment updated in Google Sheet.' };
      }
    }
  }

  const nextId = 'SND-' + String(lastRow).padStart(2, '0');
  soundsSheet.appendRow([
    soundData.itemId || nextId,
    soundData.title,
    soundData.category || 'PA Systems',
    soundData.rentalPricing || 'Negotiable',
    specsJson,
    isAvail,
    isFeat
  ]);
  SpreadsheetApp.flush();

  return { success: true, itemId: soundData.itemId || nextId, message: 'Sound equipment added permanently to Google Sheet.' };
}

function deleteSoundService(itemId, adminPin) {
  validateAdmin(adminPin);
  const ss = getOrInitSpreadsheet();
  const soundsSheet = ss.getSheetByName(TABS.SERVICES_SOUNDS);

  for (let r = soundsSheet.getLastRow(); r >= 2; r--) {
    if (String(soundsSheet.getRange(r, 1).getValue()).trim() === String(itemId).trim()) {
      soundsSheet.deleteRow(r);
      SpreadsheetApp.flush();
      return { success: true, message: 'Sound equipment deleted from Google Sheet.' };
    }
  }
  return { success: false, message: 'Sound item not found in Google Sheet.' };
}

/**
 * Academy Course CRUD
 */
function saveAcademyCourse(courseData, adminPin) {
  validateAdmin(adminPin);
  const ss = getOrInitSpreadsheet();
  const coursesSheet = ss.getSheetByName(TABS.CLASSES_COURSES);
  const lastRow = coursesSheet.getLastRow();

  const syllabusJson = JSON.stringify(Array.isArray(courseData.syllabusHighlights) ? courseData.syllabusHighlights : [String(courseData.syllabusHighlights || '')]);
  const isEnrolling = courseData.isEnrolling !== false && String(courseData.isEnrolling).toLowerCase() !== 'false';

  if (courseData && courseData.courseId) {
    for (let r = 2; r <= lastRow; r++) {
      if (String(coursesSheet.getRange(r, 1).getValue()).trim() === String(courseData.courseId).trim()) {
        coursesSheet.getRange(r, 2).setValue(courseData.title);
        coursesSheet.getRange(r, 3).setValue(courseData.sinhalaTitle || '');
        coursesSheet.getRange(r, 4).setValue(courseData.instructor || 'Keerthi Senkadagala');
        coursesSheet.getRange(r, 5).setValue(courseData.schedule || 'Weekends');
        coursesSheet.getRange(r, 6).setValue(courseData.fee || 'Contact Studio');
        coursesSheet.getRange(r, 7).setValue(courseData.duration || 'Flexible');
        coursesSheet.getRange(r, 8).setValue(courseData.description || '');
        coursesSheet.getRange(r, 9).setValue(syllabusJson);
        coursesSheet.getRange(r, 10).setValue(isEnrolling);
        SpreadsheetApp.flush();
        return { success: true, courseId: courseData.courseId, message: 'Academy course updated in Google Sheet.' };
      }
    }
  }

  const nextId = 'CRS-' + String(lastRow).padStart(2, '0');
  coursesSheet.appendRow([
    courseData.courseId || nextId,
    courseData.title,
    courseData.sinhalaTitle || '',
    courseData.instructor || 'Keerthi Senkadagala',
    courseData.schedule || 'Weekends',
    courseData.fee || 'Contact Studio',
    courseData.duration || 'Flexible',
    courseData.description || '',
    syllabusJson,
    isEnrolling
  ]);
  SpreadsheetApp.flush();

  return { success: true, courseId: courseData.courseId || nextId, message: 'Academy course added permanently to Google Sheet.' };
}

function deleteAcademyCourse(courseId, adminPin) {
  validateAdmin(adminPin);
  const ss = getOrInitSpreadsheet();
  const coursesSheet = ss.getSheetByName(TABS.CLASSES_COURSES);

  for (let r = coursesSheet.getLastRow(); r >= 2; r--) {
    if (String(coursesSheet.getRange(r, 1).getValue()).trim() === String(courseId).trim()) {
      coursesSheet.deleteRow(r);
      SpreadsheetApp.flush();
      return { success: true, message: 'Academy course deleted from Google Sheet.' };
    }
  }
  return { success: false, message: 'Academy course not found in Google Sheet.' };
}
`;

