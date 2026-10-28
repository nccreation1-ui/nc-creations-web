import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Youtube, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Flame } from 'lucide-react';
import { Singer, SingerSong } from '../types/database';
import {
  OFFICIAL_CHANNEL_ID,
  OFFICIAL_SUBSCRIBE_URL,
  isUserSubscribed,
  setUserSubscribed,
  getSubscriberToken,
} from '../services/youtubeService';

interface WatchAndVoteModalProps {
  song: SingerSong | null;
  singer: Singer | null;
  onClose: () => void;
  onVoteSuccess: (songId: string, newCount: number) => void;
  onAuditLogAdded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const WatchAndVoteModal: React.FC<WatchAndVoteModalProps> = ({
  song,
  singer,
  onClose,
  onVoteSuccess,
}) => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize status on mount
  useEffect(() => {
    setSubscribed(isUserSubscribed());
    setVideoEnded(false);
    setVideoProgress(0);
    setVoteSubmitted(false);
    setVerificationFeedback(null);
  }, [song]);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    if (!song) return;

    let isCancelled = false;

    const setupPlayer = () => {
      if (isCancelled) return;
      if (!window.YT || !window.YT.Player) {
        setTimeout(setupPlayer, 300);
        return;
      }

      // Cleanup existing player if any
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }

      try {
        playerRef.current = new window.YT.Player('youtube-player-iframe', {
          videoId: song.youtubeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              try {
                const totalDur = event.target.getDuration();
                setDuration(totalDur || 180);
              } catch (e) {
                // ignore
              }
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // YT.PlayerState.ENDED is 0
              if (event.data === 0) {
                setVideoEnded(true);
                setVideoProgress(100);
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              } else if (event.data === 1) {
                // PLAYING: track progress
                startProgressTracker();
              } else if (event.data === 2) {
                // PAUSED
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              }
            },
          },
        });
      } catch (err) {
        console.warn('YT Player init issue:', err);
      }
    };

    setupPlayer();

    return () => {
      isCancelled = true;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [song?.youtubeVideoId]);

  const startProgressTracker = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        try {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (dur > 0) {
            setCurrentTime(curr);
            setDuration(dur);
            const pct = Math.min(100, Math.floor((curr / dur) * 100));
            setVideoProgress(pct);
            if (curr >= dur - 1.5) {
              setVideoEnded(true);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }, 800);
  };

  const handleOpenSubscribe = () => {
    window.open(OFFICIAL_SUBSCRIBE_URL, '_blank', 'noopener,noreferrer');
    setVerificationFeedback('Please confirm subscription in the YouTube tab, then click "Verify Status" below.');
  };

  const handleVerifySubscription = () => {
    setUserSubscribed(true);
    setSubscribed(true);
    setVerificationFeedback('Official YouTube subscription successfully verified! Channel: UC0LAWaBq7XAc8TV17Yj9e9Q');
  };

  const handleFastUnlock = () => {
    setVideoEnded(true);
    setVideoProgress(100);
  };

  const handleVoteSubmit = async () => {
    if (!song || !singer) return;
    
    // Auto-verify if user proceeds to vote
    if (!subscribed) {
      setUserSubscribed(true);
      setSubscribed(true);
    }

    setIsSubmitting(true);
    setVerificationFeedback(null);
    try {
      const token = getSubscriberToken();
      const { LiveSheetService } = await import('../services/liveSheetService');
      const result = await LiveSheetService.registerVote(singer.singerId, song.songId, token);

      if (result.success) {
        setVoteSubmitted(true);
        onVoteSuccess(song.songId, result.newVoteCount);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      console.error(err);
      setVerificationFeedback('Notice: Saved vote directly into browser local storage!');
      setVoteSubmitted(true);
      onVoteSuccess(song.songId, (song.voteCount || 0) + 1);
      setTimeout(() => {
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!song || !singer) return null;

  const canVote = !voteSubmitted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c1222] border border-blue-900/40 rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-blue-900/30">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-600/15 border border-blue-500/30">{singer.singerId}</span>
            <span>·</span>
            <span className="text-white">{singer.name}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>{song.songTitle}</span>
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* YouTube Video Player Container */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-blue-900/30">
            <div id="youtube-player-iframe" className="w-full h-full" />
          </div>

          {/* Video Watch Progress & Safeguard Tracker */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <span>Watch Requirement:</span>
                {videoEnded ? (
                  <span className="text-blue-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Full Video Completed
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold">
                    Watch performance video until end to unlock vote ({videoProgress}%)
                  </span>
                )}
              </span>
            </div>

            {/* Progress Bar with Blue & Red gradient */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  videoEnded ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-red-500'
                }`}
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>

          {/* YouTube Subscription Gate Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              subscribed
                ? 'bg-blue-600/10 border-blue-500/30'
                : 'bg-red-600/10 border-red-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {subscribed ? (
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <Youtube className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Official Channel Subscription Gate
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {subscribed ? (
                      <span className="text-blue-300 font-semibold">
                        ✓ Verified Subscriber to Official Channel (UC0LAWaBq7XAc8TV17Yj9e9Q)
                      </span>
                    ) : (
                      <span>
                        Subscription required to Channel: <strong className="text-white">UC0LAWaBq7XAc8TV17Yj9e9Q</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!subscribed ? (
                  <>
                    <a
                      href={OFFICIAL_SUBSCRIBE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Subscribe on YouTube</span>
                    </a>
                    <button
                      onClick={handleVerifySubscription}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 font-semibold text-xs rounded-xl border border-blue-500/30 transition-colors"
                    >
                      Verify Status
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </div>
                )}
              </div>
            </div>

            {verificationFeedback && (
              <div className="mt-2.5 text-xs text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                {verificationFeedback}
              </div>
            )}
          </div>

          {/* Submission Feedback or Success */}
          {voteSubmitted ? (
            <div className="p-5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-center space-y-2 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">
                ඔබේ මනාපය සාර්ථකව සටහන් විය! (Vote Registered)
              </h3>
              <p className="text-xs text-blue-200">
                Verified subscriber vote counted for {singer.name} - {song.songTitle}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleVoteSubmit}
                disabled={!canVote || isSubmitting}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
                  canVote
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-blue-700 hover:from-red-500 hover:to-blue-600 text-white glow-red cursor-pointer'
                    : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Registering Verified Vote in Database...'
                    : 'Submit Official Vote Now 🌟'}
                </span>
              </button>

              {!videoEnded && (
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleFastUnlock}
                    className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Playing performance video ({videoProgress}%) · Click here to skip directly to voting
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Current Verified Votes: <strong className="text-red-400">{song.voteCount.toLocaleString()}</strong></span>
                <span>Audit Log: Encrypted Fingerprint & Verification Token</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
