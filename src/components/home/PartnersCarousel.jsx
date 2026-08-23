'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Handshake } from 'lucide-react';

function PartnersCarousel({ cms, partners: propPartners = [] }) {
  const [isHovered, setIsHovered] = useState(false);

  const badge = cms?.badge ?? "MITRA RESMI";
  const title = cms?.title ?? "Partner Kami";
  const description = cms?.description ?? "";
  
  const autoplay = cms?.autoplay ?? true;
  const pauseOnHover = cms?.pauseOnHover ?? true;
  const gap = cms?.gap ?? 64;
  
  const background = '#FCFCFC';
  const backgroundImage = cms?.backgroundImage || "";

  const rawList = Array.isArray(propPartners) ? propPartners : [];
  
  const activeList = (rawList || [])
    .filter(p => {
      if (!p) return false;
      if (p.active === false || p.active === 'false') return false;
      return true;
    })
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
    .map((p, idx) => ({
      id: p.id || `partner_${idx}`,
      name: p.name || "",
      logo: p.logo || "",
      website: p.website || "#",
      location: p.location || "",
      description: p.description || ""
    }));

  if (activeList.length === 0) {
    return (
      <section id="partners-section" className="bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none">
        <div className="max-w-md mx-auto px-6 space-y-2">
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#174C3C]">Mitra belum tersedia</h3>
          <p className="text-[12px] sm:text-[14px] text-[#666666] leading-relaxed">
            Belum ada mitra resmi yang ditambahkan melalui Dashboard Admin.
          </p>
        </div>
      </section>
    );
  }

  const speed = cms?.speed ?? cms?.marqueeSpeed ?? 35;
  const repeatCount = cms?.repeatCount ?? 2;
  let marqueeItems = [];
  if (activeList.length > 0) {
    const repeats = Math.max(repeatCount, 1);
    for (let i = 0; i < repeats; i++) {
      marqueeItems = [...marqueeItems, ...activeList];
    }
  }

  const isHexOrRgb = background.startsWith('#') || background.startsWith('rgb') || background.startsWith('hsl');
  const bgStyle = {
    backgroundColor: isHexOrRgb ? background : undefined,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
  };

  const fadeColor = "#FCFCFC";
  const leftGradientStyle = {
    background: `linear-gradient(to right, ${fadeColor}, transparent)`
  };
  const rightGradientStyle = {
    background: `linear-gradient(to left, ${fadeColor}, transparent)`
  };

  const marqueeStyle = {
    display: 'flex',
    gap: `${gap}px`,
    width: 'max-content',
    willChange: 'transform',
    animation: autoplay ? `marquee-custom-partners ${speed}s linear infinite` : 'none',
    animationPlayState: (pauseOnHover && isHovered) ? 'paused' : 'running',
    animationDuration: `${speed}s`,
  };

  return (
    <section 
      style={bgStyle}
      className="bg-[#FCFCFC] border-y border-gray-100 pt-8 pb-8 overflow-hidden relative"
    >
      <style>{`
        @keyframes marquee-custom-partners {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-6 md:px-8 mb-8 text-center space-y-3 relative z-10"
      >
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block">
          {badge}
        </p>
        {title && (
          <h2 className="text-[#174C3C] text-[22px] sm:text-[30px] lg:text-[38px] font-semibold tracking-tight leading-[1.08]">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal text-[#666666] max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>

      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 z-10 pointer-events-none" style={leftGradientStyle} />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 z-10 pointer-events-none" style={rightGradientStyle} />

      <div
        className="marquee-track"
        style={marqueeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {marqueeItems.map((partner, index) => (
          <div
            key={`${partner.id}-${index}`}
            onClick={() => partner.website && partner.website !== "#" && window.open(partner.website, '_blank')}
            className={`inline-flex flex-col items-center text-center flex-shrink-0 select-none ${partner.website && partner.website !== "#" ? 'cursor-pointer' : ''}`}
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
              {partner.logo ? (
                <Image
                  src={partner.logo.startsWith('http') || partner.logo.startsWith('/') ? partner.logo : `/${partner.logo}`}
                  alt={partner.name || ''}
                  width={96}
                  height={96}
                  sizes="96px"
                  quality={75}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Handshake className="w-8 h-8 text-[#174C3C]/60" />
              )}
            </div>

            <div className="mt-4 flex flex-col items-center text-center w-full whitespace-normal">
              <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#174C3C] tracking-tight leading-tight">
                {partner.name}
              </h3>
              {partner.location && (
                <span className="text-[12px] text-[#666666] mt-1 block">
                  {partner.location}
                </span>
              )}
              {partner.description && (
                <p className="text-[12px] sm:text-[13px] text-[#666666] leading-relaxed mt-3 line-clamp-3 max-w-[220px]">
                  {partner.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default React.memo(PartnersCarousel);
