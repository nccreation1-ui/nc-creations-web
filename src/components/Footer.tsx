import React from 'react';
import { Youtube, Phone, MapPin, Sparkles, Heart } from 'lucide-react';
import { OFFICIAL_SUBSCRIBE_URL, OFFICIAL_CHANNEL_ID } from '../services/youtubeService';

interface FooterProps {
  onSelectTab: (tab: 'artists' | 'sounds' | 'classes' | 'contact') => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenAdmin }) => {
  const logoUrl = '/assets/aistudio/nc_logo_9c7ebd10.png';

  return (
    <footer className="border-t border-blue-900/30 bg-[#060810] pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-column footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand & Logo & Bio */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex flex-col items-start gap-2.5">
              <div className="h-12 px-3 py-1 rounded-xl bg-white ring-1 ring-blue-500/40 shrink-0 inline-flex items-center justify-center overflow-hidden">
                <img
                  src={logoUrl}
                  alt="The NC Creation's Logo"
                  className="h-full w-auto max-w-[170px] object-contain"
                />
              </div>
              <div className="text-base font-black text-white tracking-tight">
                The <span className="text-blue-500">NC</span> Creation<span className="text-red-500">'s</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Academy · Sound · Studio. Directed by Keerthi Senkadagala. Dedicated to elevating Sri Lankan music, vocal talents, and reality show performance arts.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Gurudeniya, Kandy, Sri Lanka
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Quick Navigation</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectTab('artists')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  🌟 සෙන්කඩගලට පායන තරු (Artists & Voting)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('sounds')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  🔊 Sounds & Equipment Rentals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('classes')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  🎓 Academy & Courses
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('contact')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  📞 Studio Bookings & Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hotlines & Direct Studio */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct Contact</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a href="tel:0704227788" className="hover:text-blue-300 font-mono text-slate-200 font-semibold">
                  0704227788
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <a href="tel:0775918913" className="hover:text-red-300 font-mono text-slate-200 font-semibold">
                  0775918913
                </a>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Gurudeniya, Kandy</span>
              </div>
            </div>
          </div>

          {/* Col 4: YouTube & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>Official YouTube</span>
            </h4>
            <a
              href={OFFICIAL_SUBSCRIBE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 hover:bg-red-600/25 transition-colors font-medium text-xs"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Channel: UC0LAWaBq7XAc8TV17Yj9e9Q</span>
            </a>
            <div>
              <button
                onClick={onOpenAdmin}
                className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors underline cursor-pointer"
              >
                ⚙️ Studio Admin Management Login
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} The NC Creation's Academy + Sound + Studio. Music Director Keerthi Senkadagala.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Powered by Google Apps Script & Sheets Relational Architecture</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
