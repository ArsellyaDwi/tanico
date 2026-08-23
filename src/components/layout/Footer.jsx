'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Linkedin, Mail } from 'lucide-react';
const jost = { className: 'font-jost' };

function Footer({ onNavigateToAdmin, settings = {} }) {
  const cms = typeof settings?.homepageCMS === 'string'
    ? (() => { try { return JSON.parse(settings.homepageCMS); } catch { return {}; } })()
    : (settings?.homepageCMS || {});
  const data = cms?.footer || {};

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  return (
    <footer 
      id="contact-section"
      className={`${jost.className} relative bg-[#F8F8F5] dark:bg-[#102E24] text-[#173F35] dark:text-[#F5F5F5] pt-16 pb-12 sm:pt-24 sm:pb-16 border-t border-[#E7E7E7] dark:border-[rgba(255,255,255,0.08)] shadow-[0_-10px_40px_rgba(23,63,53,0.01)] select-none overflow-hidden transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col space-y-12 sm:space-y-16"
        >
          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Brand, Description, Social Info (4 columns) */}
            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left">
              {/* Logo TaniCo */}
              <div 
                onClick={onNavigateToAdmin}
                className="cursor-pointer group flex flex-col items-center lg:items-start"
              >
                <h3 className="text-[26px] font-semibold tracking-tight text-[#173F35] dark:text-[#F5F5F5] transition-opacity duration-300 group-hover:opacity-85 leading-none">
                  {data.logoText || "TaniCo"}
                </h3>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#4D8B55] block mt-2 font-medium">
                  Pure Organic Archive
                </span>
              </div>

              {/* Deskripsi Singkat */}
              <p className="text-[13px] sm:text-[14px] font-normal text-[#666666] dark:text-[#F5F5F5]/85 max-w-sm leading-relaxed mx-auto lg:mx-0">
                TaniCo menghadirkan hasil tani segar langsung dari petani lokal Bangka dengan kualitas terbaik untuk keluarga Indonesia.
              </p>

              {/* Social Media & Contact Icons (LinkedIn & Email) */}
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-2">
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#666666] dark:text-[#F5F5F5]/70 hover:text-[#174C3C] dark:hover:text-[#F5F5F5] transition-colors duration-200 flex items-center justify-center cursor-pointer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>

                {/* Email */}
                <a
                  href={`mailto:${data.email || 'halo@tanico.id'}`}
                  className="text-[#666666] dark:text-[#F5F5F5]/70 hover:text-[#174C3C] dark:hover:text-[#F5F5F5] transition-colors duration-200 flex items-center justify-center cursor-pointer"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </motion.div>

            {/* Right Column: Dynamic Editorial Grid (8 columns) */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 text-center lg:text-left w-full"
            >
              
              {/* Kolom 1: Company */}
              <div className="space-y-4 text-center lg:text-left">
                <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#173F35] dark:text-[#F5F5F5] tracking-tight">
                  Company
                </h4>
                <ul className="flex flex-col gap-y-3 items-center lg:items-start">
                  {[
                    { label: 'Tentang Kami', href: '/tentang-kami' },
                    { label: 'Kisah Mitra Tani', href: '/kisah-mitra-tani' },
                    { label: 'Artikel', href: '/artikel' }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link 
                        href={link.href}
                        className="text-[13px] sm:text-[14px] font-normal text-[#666666] dark:text-[#F5F5F5]/70 hover:text-[#174C3C] dark:hover:text-[#F5F5F5] inline-block transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kolom 2: Produk */}
              <div className="space-y-4 text-center lg:text-left">
                <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#173F35] dark:text-[#F5F5F5] tracking-tight">
                  Produk
                </h4>
                <ul className="flex flex-col gap-y-3 items-center lg:items-start">
                  {[
                    { label: 'Sayuran Daun', href: '/produk?category=sayuran-daun' },
                    { label: 'Sayuran Buah', href: '/produk?category=sayuran-buah' },
                    { label: 'Sayuran Umbi & Akar', href: '/produk?category=sayuran-umbi' },
                    { label: 'Herbal & Rempah', href: '/produk?category=herbal-rempah' },
                    { label: 'Jamur & Sprouts', href: '/produk?category=jamur-sprouts' },
                    { label: 'Paket Hemat & Bundel', href: '/produk?category=paket-hemat' }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link 
                        href={link.href}
                        className="text-[13px] sm:text-[14px] font-normal text-[#666666] dark:text-[#F5F5F5]/70 hover:text-[#174C3C] dark:hover:text-[#F5F5F5] inline-block transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kolom 3: Bantuan */}
              <div className="space-y-4 text-center lg:text-left">
                <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#173F35] dark:text-[#F5F5F5] tracking-tight">
                  Bantuan
                </h4>
                <ul className="flex flex-col gap-y-3 items-center lg:items-start">
                  {[
                    { label: 'Hubungi Kami', href: '/hubungi-kami' },
                    { label: 'FAQ', href: '/faq' },
                    { label: 'Basis Pengetahuan', href: '/knowledge-base' }
                  ].map((link, i) => (
                    <li key={i}>
                      <Link 
                        href={link.href}
                        className="text-[13px] sm:text-[14px] font-normal text-[#666666] dark:text-[#F5F5F5]/70 hover:text-[#174C3C] dark:hover:text-[#F5F5F5] inline-block transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

            </motion.div>

          </div>

          {/* Thin Editorial Divider */}
          <motion.div 
            variants={itemVariants}
            className="w-full h-[1px] bg-[#E7E7E7] dark:bg-[rgba(255,255,255,0.08)]"
          />

          {/* Bottom Copyright Block */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4 text-[12px] sm:text-[13px] text-[#666666] dark:text-[#F5F5F5]/60 font-normal"
          >
            <div>
              {data.copyright || "© 2026 TaniCo. Hak Cipta Dilindungi."}
            </div>
          </motion.div>

        </motion.div>

      </div>
    </footer>
  );
}

export default React.memo(Footer);
