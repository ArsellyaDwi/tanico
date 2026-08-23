"use client";

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';

export default function ContactContent({ initialSettings = null }) {
  const { addToast } = useLayout();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  React.useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      return;
    }
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, [initialSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      if (addToast) addToast('Harap lengkapi nama, email, dan pesan Anda.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      if (res.ok) {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        if (addToast) {
          addToast('Pesan Anda berhasil dikirim! Tim TaniCo akan segera menghubungi Anda.', 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (addToast) addToast(errData.error || 'Gagal mengirim pesan.', 'error');
      }
    } catch (err) {
      if (addToast) addToast('Terjadi kesalahan saat mengirim pesan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactDetails = [
    {
      icon: <Phone className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Nomor WhatsApp",
      detail: settings?.whatsappNumber || "-",
      sub: "Layanan Customer Service"
    },
    {
      icon: <Mail className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Email Dukungan",
      detail: settings?.emailAddress || "-",
      sub: "Balasan maksimal dalam 24 jam kerja"
    },
    {
      icon: <MapPin className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Alamat Kantor",
      detail: settings?.address || "-",
      sub: "Pusat Distribusi & Pengemasan"
    },
    {
      icon: <Clock className="w-5 h-5 text-[#1B4D3E]" />,
      title: "Jam Operasional",
      detail: settings?.operationalHours || "-",
      sub: "Pengiriman fajar terjadwal"
    }
  ];

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-12 sm:pb-16 lg:pb-24 text-left select-none">
      {/* Banner Cover */}
      <section className="bg-[#1B4D3E] text-white py-12 sm:py-16 lg:py-24 px-5 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3E635]">
            Hubungi TaniCo
          </span>
          <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] font-bold font-sans mt-3 sm:mt-4 tracking-tight leading-snug sm:leading-tight">
            Kami Siap Melayani Anda
          </h1>
          <p className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] lg:text-[15px] text-[#E3EBF0]/80 font-light leading-relaxed">
            Butuh bantuan pemesanan? Punya pertanyaan tentang kemitraan tani, atau ingin mengajukan saran kerja sama? Sampaikan pesan Anda di bawah ini.
          </p>
        </div>
      </section>

      {/* Main Grid content */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 sm:mt-14 lg:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans text-[#1B4D3E]">Informasi Kontak</h2>
              <p className="text-gray-500 text-[12px] sm:text-[13px] lg:text-[14px]">Hubungi kami melalui kanal bantuan resmi atau kunjungi langsung titik pengemasan kami.</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {contactDetails.map((det, i) => (
                <div key={i} className="flex gap-4 p-4 sm:p-5 bg-white border border-[#DDE9DF] rounded-2xl">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center shrink-0">
                    {det.icon}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">{det.title}</p>
                    <p className="font-bold text-[#1B4D3E] text-[14px] sm:text-[15px] lg:text-[16px]">{det.detail}</p>
                    <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-gray-500">{det.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Feedback Form Column */}
          <div className="lg:col-span-7 bg-white border border-[#DDE9DF] rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs">
            <h3 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans text-[#1B4D3E] mb-5 sm:mb-6">Kirim Pesan Langsung</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1">
                  <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 uppercase tracking-wider block">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 uppercase tracking-wider block">Alamat Email</label>
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 uppercase tracking-wider block">Subjek</label>
                <input
                  type="text"
                  placeholder="Judul topik pesan"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 sm:h-11 bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] px-3.5 sm:px-4 outline-none transition-all duration-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-bold text-gray-400 uppercase tracking-wider block">Isi Pesan Anda</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan pesan atau masukan secara lengkap..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-[13px] sm:text-[14px] p-3.5 sm:p-4 outline-none transition-all duration-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] active:bg-[#0F2D24] text-white font-semibold text-[12px] sm:text-[13px] lg:text-[14px] rounded-full shadow-md transition-all duration-300 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Kirim Pesan Sekarang</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Google Maps Visual Representation */}
      {settings?.googleMapsUrl && (
        <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mt-10 sm:mt-14 lg:mt-16">
          <div className="bg-white border border-[#DDE9DF] rounded-3xl p-4 overflow-hidden shadow-xs">
            <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-gray-100 relative">
              <iframe 
                src={settings.googleMapsUrl} 
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
