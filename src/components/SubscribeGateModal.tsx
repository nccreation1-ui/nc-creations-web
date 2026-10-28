import React, { useState } from 'react';
import { X, Youtube, ShieldCheck, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import {
  OFFICIAL_CHANNEL_ID,
  OFFICIAL_SUBSCRIBE_URL,
  isUserSubscribed,
  setUserSubscribed,
} from '../services/youtubeService';

interface SubscribeGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionStatusChanged: () => void;
}

export const SubscribeGateModal: React.FC<SubscribeGateModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionStatusChanged,
}) => {
  const [subscribed, setSubscribed] = useState(isUserSubscribed());
  const [confirming, setConfirming] = useState(false);

  if (!isOpen) return null;

  const handleOpenYouTube = () => {
    window.open(OFFICIAL_SUBSCRIBE_URL, '_blank', 'noopener,noreferrer');
    setConfirming(true);
  };

  const handleConfirmSubscribed = () => {
    setUserSubscribed(true);
    setSubscribed(true);
    setConfirming(false);
    onSubscriptionStatusChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c1222] border border-blue-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto transition-all ${
            subscribed
              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
              : 'bg-red-600/15 text-red-500 border border-red-500/30'
          }`}
        >
          {subscribed ? <ShieldCheck className="w-8 h-8 text-blue-400" /> : <Youtube className="w-8 h-8 text-red-500" />}
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-white">
            {subscribed ? 'YouTube Subscription Verified' : 'Subscribe on YouTube to Unlock Voting'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Rule Compliance: Every vote for <strong>"සෙන්කඩගලට පායන තරු"</strong> requires an active subscription to the official YouTube channel of <strong>The NC Creation (Keerthi Senkadagala)</strong>.
          </p>
        </div>

        {/* Channel Info Card */}
        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-left space-y-1">
          <div className="text-slate-400">Official Channel ID:</div>
          <div className="font-mono text-blue-400 font-bold break-all">{OFFICIAL_CHANNEL_ID}</div>
          <div className="text-slate-400 pt-1 text-[11px]">Director: Keerthi Senkadagala · Gurudeniya, Kandy</div>
        </div>

        {/* Action States */}
        {subscribed ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>You are verified! You can cast votes across all artist songs.</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-blue-600/20"
            >
              Continue to Reality Show
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <a
              href={OFFICIAL_SUBSCRIBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setConfirming(true)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <Youtube className="w-4 h-4" />
              <span>1. Open & Subscribe on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleConfirmSubscribed}
              className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 font-bold text-xs rounded-xl border border-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>2. I Have Subscribed (Verify My Status)</span>
            </button>

            {confirming && (
              <p className="text-[11px] text-red-300 animate-pulse">
                Click "2. I Have Subscribed" after confirming in the opened YouTube tab!
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
