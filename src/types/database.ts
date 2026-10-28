/**
 * Relational Data Schema for The NC Creation's Academy + Sound + Studio
 * Matches Google Sheets tabs & Google Apps Script relational structure
 */

export interface Singer {
  singerId: string; // e.g. "NCC/0001"
  name: string;
  bio: string;
  createdTimestamp: string;
  avatarVideoId?: string; // Optional YouTube video ID used for representative avatar
}

export interface SingerSong {
  songId: string; // e.g. "SNG/001"
  singerId: string; // Foreign key linking to Singer
  songTitle: string;
  youtubeVideoId: string; // Used for auto thumbnail generation
  voteCount: number;
  isActive: boolean;
  addedTimestamp: string;
}

export interface VoteAuditLog {
  voteId: string; // e.g. "VOTE-1740001"
  singerId: string;
  songId: string;
  timestamp: string;
  subscriberVerificationStatus: 'VERIFIED_SUBSCRIBER' | 'PENDING' | 'REJECTED';
  userIpAgent: string;
}

export interface SoundService {
  itemId: string; // e.g. "SND-01"
  title: string;
  category: 'PA Systems' | 'Live Sound' | 'Studio Recording' | 'Lighting & Stage' | 'Instruments';
  rentalPricing: string;
  specifications: string[];
  isAvailable: boolean;
  featured?: boolean;
}

export interface AcademyCourse {
  courseId: string; // e.g. "CRS-01"
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

export interface SiteSettings {
  businessName: string;
  ownerDirector: string;
  location: string;
  officialChannelId: string;
  hotline1: string;
  hotline2: string;
  realityShowName: string;
  officialBio: string;
  adminPin: string; // Default: "1994"
  youtubeApiKeyConfigured: boolean;
  appsScriptUrl?: string;
}
