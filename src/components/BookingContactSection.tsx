import React, { useState } from 'react';
import { Phone, MapPin, Youtube, MessageCircle, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { OFFICIAL_SUBSCRIBE_URL, OFFICIAL_CHANNEL_ID } from '../services/youtubeService';

interface BookingContactSectionProps {
  prefilledSubject?: string;
}

export const BookingContactSection: React.FC<BookingContactSectionProps> = ({
  prefilledSubject = '',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(prefilledSubject || 'Live Sound & PA Rental');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please provide your name and contact phone number.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setPhone('');
      setMessage('');
      setSubmitted(false);
    }, 4500);
  };

  return (
    <section id="contact-section" className="py-12 border-t border-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Blue & Red Accents */}
        <div className="pb-6 border-b border-blue-900/30 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
            <Phone className="w-4 h-4 text-red-500" />
            <span>Connect with Music Director Keerthi Senkadagala</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-red-500">📞</span>
            <span>Bookings & Direct Studio Contact</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Book professional sound systems for weddings and concerts, reserve studio recording and mastering sessions, or register for academy courses in Gurudeniya, Kandy.
          </p>
        </div>

        {/* 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Studio Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-blue-900/30 space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span>Direct Communication Channels</span>
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Hotlines */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Official Hotlines</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <a
                        href="tel:0704227788"
                        className="text-blue-400 font-bold hover:underline font-mono text-base"
                      >
                        0704227788
                      </a>
                      <span className="text-slate-600">/</span>
                      <a
                        href="tel:0775918913"
                        className="text-red-400 font-bold hover:underline font-mono text-base"
                      >
                        0775918913
                      </a>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Studio & Academy Location</span>
                    <span className="text-slate-200 font-medium">Gurudeniya, Kandy, Sri Lanka</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Central Province, Sri Lanka (Available for islandwide events)
                    </p>
                  </div>
                </div>

                {/* Official YouTube Channel */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Official YouTube Channel</span>
                    <a
                      href={OFFICIAL_SUBSCRIBE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 font-bold hover:underline text-xs flex items-center gap-1 mt-0.5"
                    >
                      <span>Channel ID: {OFFICIAL_CHANNEL_ID}</span>
                    </a>
                  </div>
                </div>

                {/* WhatsApp Action */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/94704227788?text=Hello%20The%20NC%20Creation,%20I%20would%20like%20to%20inquire%20about%20your%20services"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat Directly on WhatsApp (0704227788)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Note on Keerthi Senkadagala */}
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-900/30 text-xs text-slate-300">
              <strong className="text-white block mb-1">Director's Note:</strong>
              Whether you are an aspiring vocalist for <span className="text-red-400 font-bold">"සෙන්කඩගලට පායන තරු"</span>, or need a massive 6000W line-array sound stage for an event, we welcome you to the NC Creation family.
            </div>
          </div>

          {/* Right Column: Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-blue-900/30">
              <h3 className="text-lg font-bold text-white mb-1">Send a Fast Booking Inquiry</h3>
              <p className="text-xs text-slate-400 mb-6">
                Fill out the form and our studio coordinator will reach you back via call or WhatsApp.
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Inquiry Received Successfully!</h4>
                  <p className="text-xs text-blue-200">
                    Thank you, {name}. Keerthi Senkadagala and the NC Creation team will contact you at {phone} shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priyantha Dissanayake"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">Contact Phone Number / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07X XXX XXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Service or Inquiry Category</label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full bg-[#0d1322] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Live Sound & PA Rental">Concert Line Array & Live PA Sound Rental</option>
                      <option value="Wedding & Corporate Sound">Wedding & Corporate Event Sound Package</option>
                      <option value="Studio Song Recording">NC Recording Studio Session & Multi-Track</option>
                      <option value="Vocal Culturing Course">Music Academy: Vocal Culturing (ගායන පුහුණුව)</option>
                      <option value="Audio Engineering Course">Music Academy: Audio Engineering (ශබ්ද පරිපාලනය)</option>
                      <option value="Instruments Training">Music Academy: Instruments (Keyboard, Guitar, Drum)</option>
                      <option value="Reality Show Auditions">Reality Show: 'සෙන්කඩගලට පායන තරු' Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Event Date, Venue or Questions</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your planned event date, venue in Kandy or requirements..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-blue-700 hover:from-red-500 hover:to-blue-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 fill-white" />
                    <span>Submit Inquiry to NC Studio</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
