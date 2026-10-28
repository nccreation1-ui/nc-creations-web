import React from 'react';
import { Phone, Play, Youtube, Award, Volume2, Music, CheckCircle2, Sparkles, Flame, Radio } from 'lucide-react';
import { OFFICIAL_SUBSCRIBE_URL, OFFICIAL_CHANNEL_ID } from '../services/youtubeService';
import studioConsoleImg from '../assets/images/studio_console_1793039796633.jpg';
import stageImg from '../assets/images/reality_show_stage_1793039795727.jpg';

interface HeroSectionProps {
  onExploreVoting: () => void;
  onExploreSound: () => void;
  totalVotes: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreVoting,
  onExploreSound,
  totalVotes,
}) => {
  const logoUrl = '/assets/aistudio/nc_logo_9c7ebd10.png';

  return (
    <section className="relative overflow-hidden pt-6 pb-12">
      {/* Background Ambient Glows: Royal Blue & Crimson Red */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-1/4 -z-10 w-96 h-96 bg-red-600/12 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          
          {/* Left Column: Brand, Bio & Trust Signals (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between glass-panel rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden border border-blue-500/20 glow-blue-red">
            <div className="space-y-5">
              
              {/* Trust Tag with Blue & Red tones */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-red-500" />
                  Music Direction
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-white font-bold">Keerthi Senkadagala</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-400">Gurudeniya, Kandy, Sri Lanka</span>
              </div>

              {/* Headline with Brand Colors & Official Logo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-16 sm:h-20 px-3.5 py-1.5 rounded-2xl bg-white shadow-lg shadow-blue-900/40 border-2 border-blue-500/40 shrink-0 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt="The NC Creation Logo"
                    className="h-full w-auto max-w-[170px] sm:max-w-[210px] object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    The <span className="text-blue-500">NC</span> Creation<span className="text-red-500">'s</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-red-400">
                      Academy · Sound · Studio
                    </span>
                  </h1>
                </div>
              </div>

              {/* Official Sinhala Bio Quote with Blue Border and Red Accent */}
              <div className="relative pl-5 py-3 border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/20 to-transparent rounded-r-xl">
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
                  "සකලවිද කලා කටයුතු මුළුමහත් ලෝකයා වෙත ගෙනයාම උදෙසා නිර්මාණය කරන ලද මෙම නාලිකාව ඔබ සැමගේ සහයෝගය මත ඉදිරියට යනු ඇත. ගීත ගායනය, වාදනය, විවිධ නැටුම් කලාවන්, ගීත විචාර, නාට්‍ය හා රංගකලාව, ගී පද නිර්මාණය, තනු නිර්මාණය ආදී සකලවිද කලා කටයුතු ඉදිරියේ දී මෙම නාලිකාව හරහා ඔබට අත්විදීමේ අවස්ථාව සැලසෙනු ඇත. මම කීර්ති සෙංකඩගල."
                </p>
                <div className="mt-2.5 text-xs text-red-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>— කීර්ති සෙංකඩගල (Music Director & Founder)</span>
                </div>
              </div>

              {/* CTAs with vibrant Red & Blue Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onExploreVoting}
                  className="px-6 py-3.5 bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-white fill-white" />
                  <span>සෙන්කඩගලට පායන තරු - Vote Now</span>
                </button>

                <button
                  onClick={onExploreSound}
                  className="px-5 py-3.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 hover:text-white font-bold text-sm rounded-xl border border-blue-500/40 hover:border-blue-400 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm shadow-blue-600/20"
                >
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span>Sound Rigs & Rentals</span>
                </button>
              </div>
            </div>

            {/* Quick Contact & Channel Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  Hotlines:
                </span>
                <a
                  href="tel:0704227788"
                  className="px-3 py-1 rounded-lg bg-blue-600/15 text-blue-300 font-mono font-bold hover:bg-blue-600/25 border border-blue-500/30 transition-colors"
                >
                  0704227788
                </a>
                <a
                  href="tel:0775918913"
                  className="px-3 py-1 rounded-lg bg-red-600/15 text-red-300 font-mono font-bold hover:bg-red-600/25 border border-red-500/30 transition-colors"
                >
                  0775918913
                </a>
              </div>

              <a
                href={OFFICIAL_SUBSCRIBE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 font-semibold transition-colors"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube: UC0LAWaBq7XAc8TV17Yj9e9Q</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Stage & Studio Showcase (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Top Image: Reality Show Stage with Red Highlight */}
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-red-500/20 group h-56 sm:h-64 lg:h-1/2">
              <img
                src={stageImg}
                alt="සෙන්කඩගලට පායන තරු reality show performance stage"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a14] via-[#070a14]/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-red-300 bg-red-950/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-red-500/30 inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  Main Reality Show
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  සෙන්කඩගලට පායන තරු (Senkadagalata Paayana Tharu)
                </h3>
              </div>
            </div>

            {/* Bottom Image: Recording Studio Console with Blue Highlight */}
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-blue-500/20 group h-56 sm:h-64 lg:h-1/2">
              <img
                src={studioConsoleImg}
                alt="The NC Creation recording studio control room console in Gurudeniya Kandy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a14] via-[#070a14]/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-300 bg-blue-950/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-500/30 inline-flex items-center gap-1">
                  <Radio className="w-3 h-3 text-blue-400" />
                  Acoustic Control Room
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  NC Pro Multi-Track Studio & Mastering
                </h3>
              </div>
            </div>

          </div>

        </div>

        {/* 4-Column Proof & Highlights Strip with Blue & Red tones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-1">
              <Award className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-2xl font-black text-white tabular-nums">100%</div>
            </div>
            <div className="text-xs text-slate-400 font-medium">Verified Subscriber Voting</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-red-500/20 hover:border-red-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-1">
              <Flame className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-2xl font-black text-white tabular-nums">
                {totalVotes > 0 ? totalVotes.toLocaleString() : '8,295+'}
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">Total Fan Votes Cast</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-1">
              <Volume2 className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-2xl font-black text-white tabular-nums">6000W</div>
            </div>
            <div className="text-xs text-slate-400 font-medium">Line Array Concert PA Rigs</div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-red-500/20 hover:border-red-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-2xl font-black text-white tabular-nums">Kandy</div>
            </div>
            <div className="text-xs text-slate-400 font-medium">Gurudeniya Studio & Academy</div>
          </div>
        </div>

      </div>
    </section>
  );
};
