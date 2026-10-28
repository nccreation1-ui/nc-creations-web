import React from 'react';
import { X, Music, Play, CheckCircle2, Award, Calendar, Sparkles, Flame } from 'lucide-react';
import { Singer, SingerSong } from '../types/database';
import { getYouTubeThumbnails } from '../services/youtubeService';

interface ArtistProfileModalProps {
  singer: Singer | null;
  songs: SingerSong[];
  onClose: () => void;
  onSelectSongToVote: (song: SingerSong) => void;
}

export const ArtistProfileModal: React.FC<ArtistProfileModalProps> = ({
  singer,
  songs,
  onClose,
  onSelectSongToVote,
}) => {
  if (!singer) return null;

  const singerSongs = songs.filter((s) => s.singerId === singer.singerId && s.isActive);
  const totalVotes = singerSongs.reduce((sum, s) => sum + s.voteCount, 0);
  const repVideoId = singer.avatarVideoId || singerSongs[0]?.youtubeVideoId || 'kJQP7kiw5Fk';
  const headerThumbs = getYouTubeThumbnails(repVideoId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1222] border border-blue-900/40 rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-black/60 overflow-hidden shrink-0">
          <img
            src={headerThumbs.maxres}
            alt={singer.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = headerThumbs.hq;
            }}
            className="w-full h-full object-cover filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/50 to-transparent" />

          {/* Profile Basic Info on Banner */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 mb-1">
                <span className="bg-blue-600/20 px-2 py-0.5 rounded-lg border border-blue-500/30 text-blue-300">
                  {singer.singerId}
                </span>
                <span>· Senkadagalata Paayana Tharu Artist</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {singer.name}
              </h2>
            </div>

            <div className="flex items-center gap-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Total Fan Votes</span>
                <span className="text-red-400 font-extrabold text-lg tabular-nums">
                  {totalVotes.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-white/15 pl-4">
                <span className="text-[11px] text-slate-400 block font-medium">Repertoire</span>
                <span className="text-blue-300 font-bold text-lg tabular-nums">
                  {singerSongs.length} Songs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Artist Bio */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/30">
            <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Artist Profile & Background</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {singer.bio}
            </p>
          </div>

          {/* Multi-Song Catalog */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-red-500" />
                <span>Assigned Competition Songs & Video Performances</span>
              </h3>
              <span className="text-xs text-blue-300 font-mono">
                {singerSongs.length} Available to Vote
              </span>
            </div>

            {singerSongs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  No songs currently assigned to this artist. Songs can be added via the Admin Panel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {singerSongs.map((song) => {
                  const songThumbs = getYouTubeThumbnails(song.youtubeVideoId);
                  return (
                    <div
                      key={song.songId}
                      className="glass-panel rounded-2xl overflow-hidden border border-blue-900/20 hover:border-blue-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Auto-generated YouTube CDN Thumbnail */}
                        <div className="relative aspect-video bg-black/70 overflow-hidden">
                          <img
                            src={songThumbs.hq}
                            alt={song.songTitle}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = songThumbs.mq;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <span className="absolute top-2.5 left-2.5 bg-blue-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-blue-300 border border-blue-500/30">
                            {song.songId}
                          </span>
                          <span className="absolute bottom-2.5 right-2.5 bg-red-600/20 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-black text-red-300 border border-red-500/30 tabular-nums">
                            {song.voteCount.toLocaleString()} votes
                          </span>
                        </div>

                        {/* Song Details */}
                        <div className="p-4">
                          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                            {song.songTitle}
                          </h4>
                          <div className="mt-2 text-xs text-slate-400 font-mono">
                            Video ID: {song.youtubeVideoId}
                          </div>
                        </div>
                      </div>

                      {/* Vote Button */}
                      <div className="p-4 pt-0">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectSongToVote(song);
                          }}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Watch & Vote</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
