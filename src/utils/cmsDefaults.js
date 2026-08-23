import { logger } from '@/utils/logger';

export function getHomepageCms(customCms = {}) {
  return {
    hero: {
      badge: '100% Organik & Segar',
      title: 'Sayur Segar Berkualitas dari Petani Lokal Bangka',
      subtitle: 'Dipanen pagi hari, dikemas higienis, dan dikirim langsung ke rumah Anda di hari yang sama.',
      ctaText: 'Belanja Sekarang',
      ctaLink: '/products',
      show: true,
      ...customCms.hero
    },
    featured: {
      badge: 'Pilihan Terbaik',
      title: 'Produk Segar Terpopuler',
      subtitle: 'Sayuran dan buah organik segar favorit keluarga Indonesia.',
      show: true,
      limit: 8,
      ...customCms.featured
    },
    umkm: {
      badge: 'Kisah Kami',
      title: 'Mendukung Petani Lokal & Pertanian Berkelanjutan',
      subtitle: 'Setiap pembelian Anda berkontribusi langsung pada kesejahteraan keluarga petani di Bangka.',
      show: true,
      ...customCms.umkm
    },
    testimonials: {
      badge: 'Ulasan Pelanggan',
      title: 'Apa Kata Mereka Tentang TaniCo',
      subtitle: 'Kepuasan dan kesegaran yang dirasakan langsung oleh pelanggan setia kami.',
      show: true,
      ...customCms.testimonials
    },
    gallery: {
      badge: 'Galeri Kebun',
      title: 'Aktivitas & Kebun TaniCo',
      subtitle: 'Intip proses penanaman, panen, dan pengemasan kami.',
      show: true,
      ...customCms.gallery
    },
    partners: {
      badge: 'Mitra Kami',
      title: 'Bekerja Sama Dengan Komunitas Petani',
      show: true,
      ...customCms.partners
    }
  };
}
