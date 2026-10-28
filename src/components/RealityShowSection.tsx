import React, { useState } from 'react';
import { Sparkles, Search, Music2, Eye, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { Singer, SingerSong } from '../types/database';
import { getYouTubeThumbnails } from '../services/youtubeService';

interface RealityShowSectionProps {
  singers: Singer[];
  songs: SingerSong[];
  onSelectSinger: (singer: Singer) => void;
  onQuickVoteSong: (song: SingerSong, singer: Singer) => void;
  isSubscribed: boolean;
  onOpenSubscribeGate: () => void;
}

export const RealityShowSection: React.FC<RealityShowSectionProps> = ({
  singers,
  songs,
  onSelectSinger,
  onQuickVoteSong,
  isSubscribed,
  onOpenSubscribeGate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'top_voted' | 'multi_songs'>('all');

  // Compute singer stats
  const singerStats = singers.map((singer) => {
    const singerSongs = songs.filter((s) => s.singerId === singer.singerId && s.isActive);
    const totalVotes = singerSongs.reduce((sum, s) => sum + s.voteCount, 0);
    const primaryVideoId =
      singer.avatarVideoId || (singerSongs[0] ? singerSongs[0].youtubeVideoId : 'kJQP7kiw5Fk');
    const thumbs = getYouTubeThumbnails(primaryVideoId);

    return {
      singer,
      songs: singerSongs,
      totalVotes,
      primaryVideoId,
      thumbs,
    };
  });

  // Filter & Search
  const filteredSingers = singerStats.filter(({ singer, songs }) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      singer.name.toLowerCase().includes(query) ||
      singer.singerId.toLowerCase().includes(query) ||
      songs.some((s) => s.songTitle.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterMode === 'multi_songs') {
      return songs.length > 1;
    }
    return true;
  });

  // Sort
  if (filterMode === 'top_voted') {
    filteredSingers.sort((a, b) => b.totalVotes - a.totalVotes);
  }

  return (
    <section id="reality-show-section" className="py-10 border-t border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Blue & Red Accents */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-blue-900/30 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Official Reality Show Voting Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-red-500">🌟</span>
              <span>සෙන්කඩගලට පායන තරු</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Cast your verified vote for your favorite reality show vocalists. Every vote requires watching the full performance video and verifying your YouTube subscription to official channel <strong className="text-blue-300">UC0LAWaBq7XAc8TV17Yj9e9Q</strong>.
            </p>
          </div>

          {/* Subscription Status Pill */}
          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={onOpenSubscribeGate}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                isSubscribed
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 hover:bg-blue-600/25'
                  : 'bg-red-600/15 border-red-500/40 text-red-300 hover:bg-red-600/25'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isSubscribed ? 'text-blue-400' : 'text-red-400'}`} />
              <span>
                {isSubscribed
                  ? 'YouTube Subscription: Verified ✓'
                  : 'YouTube Subscription: Required to Vote'}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artist name, ID, or song..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/70 transition-colors"
            />
          </div>

          {/* Interactive Filter Segmented Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Artists ({singers.length})
            </button>

            <button
              onClick={() => setFilterMode('top_voted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterMode === 'top_voted'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-white" />
              <span>Leaderboard (Top Voted)</span>
            </button>

            <button
              onClick={() => setFilterMode('multi_songs')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                filterMode === 'multi_songs'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Multi-Song Profiles
            </button>
          </div>
        </div>

        {/* Singers Card Grid */}
        {filteredSingers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
            <Music2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Artists Found</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search query or reset filter controls.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSingers.map(({ singer, songs: singerSongs, totalVotes, thumbs }) => (
              <div
                key={singer.singerId}
                className="group glass-panel rounded-2xl overflow-hidden border border-blue-900/20 hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-950/30"
              >
                <div>
                  {/* Automatic YouTube CDN Thumbnail Card Top */}
                  <div className="relative aspect-video bg-black/60 overflow-hidden">
                    <img
                      src={thumbs.hq}
                      alt={singer.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== thumbs.mq) {
                          target.src = thumbs.mq;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070a14] via-transparent to-transparent" />
                    
                    {/* Singer ID Overlay in Royal Blue */}
                    <div className="absolute top-3 left-3 bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-blue-300 border border-blue-500/30">
                      {singer.singerId}
                    </div>

                    {/* Song Count Overlay */}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 border border-white/10 flex items-center gap-1">
                      <Music2 className="w-3 h-3 text-red-400" />
                      <span>{singerSongs.length} {singerSongs.length === 1 ? 'Song' : 'Songs'}</span>
                    </div>

                    {/* Verified Votes Overlay in Crimson Red */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Votes Cast:</span>
                      <span className="text-red-400 font-black tabular-nums text-sm drop-shadow-sm">
                        {totalVotes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {singer.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {singer.bio}
                    </p>

                    {/* Performance Song Previews */}
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-red-400" />
                        Featured Performance:
                      </span>
                      {singerSongs.slice(0, 1).map((song) => (
                        <div
                          key={song.songId}
                          onClick={() => onQuickVoteSong(song, singer)}
                          className="p-2 rounded-xl bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/30 hover:border-blue-500/40 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <span className="truncate text-slate-200 font-medium">{song.songTitle}</span>
                          <span className="text-red-400 font-bold tabular-nums shrink-0">
                            {song.voteCount.toLocaleString()} votes
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Button in Royal Blue & Crimson Red hover */}
                <div className="p-4 sm:p-5 pt-0">
                  <button
                    onClick={() => onSelectSinger(singer)}
                    className="w-full py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-bold border border-blue-500/30 hover:border-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>View Profile & All Songs</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
