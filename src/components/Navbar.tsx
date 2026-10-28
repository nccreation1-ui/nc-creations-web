import { Sparkles, Radio, Phone, GraduationCap, Sliders, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { isUserSubscribed } from '../services/youtubeService';

interface NavbarProps {
  activeTab: 'artists' | 'sounds' | 'classes' | 'contact';
  setActiveTab: (tab: 'artists' | 'sounds' | 'classes' | 'contact') => void;
  onOpenAdmin: () => void;
  onOpenSubscribeGate: () => void;
  onOpenGoogleSheets: () => void;
  isSheetConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenSubscribeGate,
  onOpenGoogleSheets,
  isSheetConnected = false,
}) => {
  const subscribed = isUserSubscribed();
  const logoUrl = '/assets/aistudio/nc_logo_9c7ebd10.png';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-900/30 bg-[#070a14]/90 backdrop-blur-xl transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 h-20">
        
        {/* Zone 1: Official Logo & Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('artists')}>
          <div className="relative group">
            <div className="h-11 sm:h-12 px-2.5 py-1 rounded-xl bg-white shadow-md shadow-blue-900/40 ring-2 ring-blue-600/60 group-hover:ring-red-500 transition-all duration-300 flex items-center justify-center overflow-hidden">
              <img
                src={logoUrl}
                alt="The NC Creation's Logo"
                className="h-full w-auto max-w-[150px] sm:max-w-[190px] object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* Subtle dual-color ambient indicator under logo */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-red-600 ring-2 ring-[#070a14]" title="Official Brand" />
          </div>

          <div className="hidden lg:flex flex-col justify-center border-l border-white/10 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-white whitespace-nowrap">
                The <span className="text-blue-500">NC</span> Creation<span className="text-red-500">'s</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest">
                Official
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium tracking-wide">
              <span className="text-blue-400">Academy</span>
              <span className="text-slate-600">·</span>
              <span className="text-red-400">Sound</span>
              <span className="text-slate-600">·</span>
              <span className="text-blue-400">Studio</span>
              <span className="text-slate-600">·</span>
              <span>Kandy</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links with Blue & Red Accents */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5 text-xs lg:text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('artists')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'artists'
                ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm shadow-blue-600/20'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'artists' ? 'text-red-400' : 'text-blue-400'}`} />
            <span>සෙන්කඩගලට පායන තරු</span>
          </button>

          <button
            onClick={() => setActiveTab('sounds')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'sounds'
                ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm shadow-blue-600/20'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'sounds' ? 'text-red-400' : 'text-blue-400'}`} />
            <span>Sounds & Rentals</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm shadow-blue-600/20'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === 'classes' ? 'text-red-400' : 'text-blue-400'}`} />
            <span>Academy & Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'contact'
                ? 'bg-red-600/20 text-red-300 font-bold border border-red-500/40 shadow-sm shadow-red-600/20'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Phone className={`w-4 h-4 ${activeTab === 'contact' ? 'text-red-400' : 'text-blue-400'}`} />
            <span>Bookings & Contact</span>
          </button>
        </nav>

        {/* Zone 3: YouTube Subscribe Status & Admin Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenGoogleSheets}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/70 hover:border-emerald-400 transition-all cursor-pointer shadow-sm shadow-emerald-950/50"
            title="Google Sheets Live Database Control"
          >
            <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500/60'}`} />
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          <button
            onClick={onOpenSubscribeGate}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              subscribed
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-300 hover:bg-blue-600/25'
                : 'bg-red-600/15 border-red-500/40 text-red-300 hover:bg-red-600/25 hover:border-red-500'
            }`}
            title="Official YouTube Channel Subscription Status"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${subscribed ? 'text-blue-400' : 'text-red-400'}`} />
            <span className="whitespace-nowrap">
              {subscribed ? 'Subscriber Verified ✓' : 'Subscribe Gate'}
            </span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 border border-blue-700/40 transition-colors whitespace-nowrap shrink-0 hover:text-white"
          >
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Studio Admin</span>
          </button>
        </div>
      </div>

      {/* Mobile Subnav Strip with Blue & Red Highlights */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 px-2 py-2.5 bg-[#070a14]/98 text-xs">
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            activeTab === 'artists'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>Stars</span>
        </button>
        <button
          onClick={() => setActiveTab('sounds')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            activeTab === 'sounds'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-slate-400'
          }`}
        >
          <Radio className="w-3 h-3 text-blue-400" />
          <span>Sounds</span>
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            activeTab === 'classes'
              ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
              : 'text-slate-400'
          }`}
        >
          <GraduationCap className="w-3 h-3 text-blue-400" />
          <span>Academy</span>
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
            activeTab === 'contact'
              ? 'bg-red-600/20 text-red-400 font-bold border border-red-500/30'
              : 'text-slate-400'
          }`}
        >
          <Phone className="w-3 h-3 text-red-400" />
          <span>Contact</span>
        </button>
      </div>
    </header>
  );
};
