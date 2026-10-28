import React, { useState } from 'react';
import { Volume2, CheckCircle, Sliders, Calendar, ArrowRight, Radio } from 'lucide-react';
import { SoundService } from '../types/database';

interface SoundRentalsSectionProps {
  sounds: SoundService[];
  onBookService: (item: SoundService) => void;
}

export const SoundRentalsSection: React.FC<SoundRentalsSectionProps> = ({
  sounds,
  onBookService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'PA Systems', 'Live Sound', 'Studio Recording', 'Lighting & Stage'];

  const filteredSounds = sounds.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  return (
    <section id="sounds-section" className="py-12 border-t border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Blue & Red Accents */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-blue-900/30 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              <Volume2 className="w-4 h-4 text-red-500" />
              <span>Pro Audio & Studio Infrastructure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-blue-500">🔊</span>
              <span>Sounds & Equipment Rentals</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              High-fidelity acoustic systems, line arrays, digital sound consoles, and acoustically treated recording studio time for concerts, weddings, and music production in Sri Lanka.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSounds.map((item) => (
            <div
              key={item.itemId}
              className="glass-panel rounded-2xl p-6 border border-blue-900/20 hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:shadow-blue-950/20"
            >
              <div>
                {/* Category & Badge */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono text-blue-300 font-bold bg-blue-600/15 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                    {item.category}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{item.itemId}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                  {item.title}
                </h3>

                {/* Pricing in Vibrant Red */}
                <div className="text-red-400 font-black text-xl mb-4 tabular-nums drop-shadow-sm">
                  {item.rentalPricing}
                </div>

                {/* Specs List */}
                <div className="space-y-2 mb-6">
                  {item.specifications.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onBookService(item)}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/30 hover:border-blue-600 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:text-white" />
                <span>Reserve Equipment / Request Quote</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
