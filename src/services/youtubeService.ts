/**
 * YouTube Utility Service
 * - Handles automatic CDN thumbnail URL generation with fallback
 * - YouTube Video ID extraction
 * - Official Channel Subscription Verification (Channel ID: UC0LAWaBq7XAc8TV17Yj9e9Q)
 */

export const OFFICIAL_CHANNEL_ID = 'UC0LAWaBq7XAc8TV17Yj9e9Q';
export const OFFICIAL_SUBSCRIBE_URL = `https://www.youtube.com/channel/${OFFICIAL_CHANNEL_ID}?sub_confirmation=1`;
export const OFFICIAL_CHANNEL_URL = `https://www.youtube.com/channel/${OFFICIAL_CHANNEL_ID}`;

export interface ThumbnailUrls {
  maxres: string;
  hq: string;
  mq: string;
}

/**
 * Extracts a YouTube Video ID from raw ID or common YouTube URL formats
 */
export function extractYouTubeVideoId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Direct 11-char ID check (alphanumeric, -, _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Standard full youtube.com/watch?v=ID
  const matchWatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (matchWatch && matchWatch[1]) {
    return matchWatch[1];
  }
  
  // Shortened youtu.be/ID
  const matchShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (matchShort && matchShort[1]) {
    return matchShort[1];
  }
  
  // Embed format youtube.com/embed/ID
  const matchEmbed = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (matchEmbed && matchEmbed[1]) {
    return matchEmbed[1];
  }

  // Shorts format youtube.com/shorts/ID
  const matchShorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (matchShorts && matchShorts[1]) {
    return matchShorts[1];
  }

  return trimmed;
}

/**
 * Automatically creates high-quality CDN thumbnail URLs
 */
export function getYouTubeThumbnails(videoId: string): ThumbnailUrls {
  const cleanId = extractYouTubeVideoId(videoId);
  return {
    maxres: `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`,
  };
}

const SUBSCRIBER_STORAGE_KEY = 'nc_creations_subscriber_verified_v1';
const SUBSCRIBER_TOKEN_KEY = 'nc_creations_subscriber_token';

/**
 * Checks if the current browser user has verified their subscription
 */
export function isUserSubscribed(): boolean {
  try {
    return localStorage.getItem(SUBSCRIBER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks user as verified after subscription verification flow
 */
export function setUserSubscribed(verified: boolean, token?: string): void {
  try {
    if (verified) {
      localStorage.setItem(SUBSCRIBER_STORAGE_KEY, 'true');
      const generatedToken = token || `SUB_TOK_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      localStorage.setItem(SUBSCRIBER_TOKEN_KEY, generatedToken);
    } else {
      localStorage.removeItem(SUBSCRIBER_STORAGE_KEY);
      localStorage.removeItem(SUBSCRIBER_TOKEN_KEY);
    }
  } catch (err) {
    console.error('Storage error', err);
  }
}

export function getSubscriberToken(): string {
  try {
    return localStorage.getItem(SUBSCRIBER_TOKEN_KEY) || 'ANON_CLIENT_VERIFIED';
  } catch {
    return 'ANON_CLIENT_VERIFIED';
  }
}
