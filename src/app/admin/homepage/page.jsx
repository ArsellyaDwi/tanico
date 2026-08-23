"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import { formatRupiah } from '@/utils/formatters';
import { getHomepageCms } from '@/utils/cmsDefaults';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';
import Hero from '@/components/home/Hero';
import Categories from '@/components/category/Categories';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import PartnersCarousel from '@/components/home/PartnersCarousel';
import Testimonials from '@/components/home/Testimonials';
import Gallery from '@/components/home/Gallery';
import UmkmStory from '@/components/home/UmkmStory';

export default function AdminHomepagePage() {
  const {
    settings,
    handleSaveSettings: onSaveSettings,
    adminProfile,
    handleSaveAdminProfile: onSaveAdminProfile,
    addToast: onAddToast,
    handleAddActivityLog: onAddActivityLog,
    products = [],
    handleSaveProducts: onSaveProducts
  } = useAdmin();

  const [activeSubTab, setActiveSubTab] = useState('hero');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [settingsForm, setSettingsForm] = useState(settings);
  const [profileForm, setProfileForm] = useState(adminProfile);
  const [homepageCmsForm, setHomepageCmsForm] = useState(() => getHomepageCms(settings?.homepageCMS));
  const [categoriesForm, setCategoriesForm] = useState([]);
  const [articles, setArticles] = useState([]);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState('Semua');
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
      try {
        const res = await fetch('/api/admin/articles');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setArticles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      }
    }
    loadArticles();
    return () => { isMounted = false; };
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesForm(data || []);
      }
    } catch {
      setCategoriesForm([]);
    }
  };

  const loadHeroBanners = async () => {
    try {
      const res = await fetch('/api/hero-banners?all=true');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHomepageCmsForm(prev => ({
            ...prev,
            hero: {
              ...(prev?.hero || {}),
              slides: data
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load hero banners in admin:', err);
    }
  };

  const loadTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHomepageCmsForm(prev => ({
            ...prev,
            testimonials: {
              ...(prev?.testimonials || {}),
              list: data
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load testimonials in admin:', err);
    }
  };

  const loadPartners = async () => {
    try {
      const res = await fetch('/api/partners');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHomepageCmsForm(prev => {
            const formatted = data.map((p, idx) => ({
              id: p.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `partner_${Date.now()}_${idx}`),
              name: p.name || `Mitra ${idx + 1}`,
              location: p.location || '',
              description: p.description || '',
              desc: p.description || '',
              website: p.website && p.website !== '#' ? p.website : '',
              url: p.website && p.website !== '#' ? p.website : '',
              logo: p.logo || '',
              image: p.logo || '',
              active: p.active !== false,
              order: p.sortOrder ?? (idx + 1),
              sortOrder: p.sortOrder ?? (idx + 1)
            }));
            return {
              ...prev,
              partners: {
                ...(prev?.partners || {}),
                list: formatted,
                logos: formatted
              }
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load partners in admin:', err);
    }
  };

  const loadHeroBenefits = async () => {
    try {
      const res = await fetch('/api/hero-benefits?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setHomepageCmsForm(prev => {
            const hero = { ...(prev?.hero || {}) };
            sorted.forEach((item, idx) => {
              const num = idx + 1;
              hero[`stat${num}Id`] = item.id;
              hero[`stat${num}Value`] = item.value || '';
              hero[`stat${num}Label`] = item.label || '';
              hero[`stat${num}Image`] = item.image || '';
              hero[`stat${num}SortOrder`] = item.sortOrder ?? idx;
              hero[`stat${num}Active`] = item.active !== false;
            });
            hero.benefits = sorted;
            return {
              ...prev,
              hero
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load hero benefits in admin:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setSettingsForm(data);
          const parsed = getHomepageCms(data.homepageCMS);
          setHomepageCmsForm(prev => ({
            ...parsed,
            hero: {
              ...parsed.hero,
              slides: (prev?.hero?.slides && prev.hero.slides.length > 0) ? prev.hero.slides : (parsed.hero?.slides || []),
              stat1Id: prev?.hero?.stat1Id || parsed.hero?.stat1Id,
              stat1Value: prev?.hero?.stat1Value ?? parsed.hero?.stat1Value,
              stat1Label: prev?.hero?.stat1Label ?? parsed.hero?.stat1Label,
              stat1Image: prev?.hero?.stat1Image ?? parsed.hero?.stat1Image,
              stat2Id: prev?.hero?.stat2Id || parsed.hero?.stat2Id,
              stat2Value: prev?.hero?.stat2Value ?? parsed.hero?.stat2Value,
              stat2Label: prev?.hero?.stat2Label ?? parsed.hero?.stat2Label,
              stat2Image: prev?.hero?.stat2Image ?? parsed.hero?.stat2Image,
              stat3Id: prev?.hero?.stat3Id || parsed.hero?.stat3Id,
              stat3Value: prev?.hero?.stat3Value ?? parsed.hero?.stat3Value,
              stat3Label: prev?.hero?.stat3Label ?? parsed.hero?.stat3Label,
              stat3Image: prev?.hero?.stat3Image ?? parsed.hero?.stat3Image,
              stat4Id: prev?.hero?.stat4Id || parsed.hero?.stat4Id,
              stat4Value: prev?.hero?.stat4Value ?? parsed.hero?.stat4Value,
              stat4Label: prev?.hero?.stat4Label ?? parsed.hero?.stat4Label,
              stat4Image: prev?.hero?.stat4Image ?? parsed.hero?.stat4Image,
              benefits: (prev?.hero?.benefits && prev.hero.benefits.length > 0) ? prev.hero.benefits : (parsed.hero?.benefits || [])
            },
            partners: (prev?.partners?.list && prev.partners.list.length > 0) ? prev.partners : (parsed.partners || {}),
            testimonials: (prev?.testimonials?.list && prev.testimonials.list.length > 0) ? prev.testimonials : (parsed.testimonials || {})
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings in admin:', err);
    }
  };

  useEffect(() => {
    loadSettings();
    fetchCategories();
    loadHeroBanners();
    loadHeroBenefits();
    loadTestimonials();
    loadPartners();
  }, []);

  useEffect(() => {
    setSettingsForm(settings);
    if (settings) {
      setHomepageCmsForm(prev => {
        const parsed = getHomepageCms(settings.homepageCMS);
        // Keep slides from hero banners if available
        if (prev?.hero?.slides && prev.hero.slides.length > 0) {
          parsed.hero = {
            ...(parsed.hero || {}),
            slides: prev.hero.slides,
            stat1Id: prev?.hero?.stat1Id || parsed.hero?.stat1Id,
            stat1Value: prev?.hero?.stat1Value ?? parsed.hero?.stat1Value,
            stat1Label: prev?.hero?.stat1Label ?? parsed.hero?.stat1Label,
            stat1Image: prev?.hero?.stat1Image ?? parsed.hero?.stat1Image,
            stat2Id: prev?.hero?.stat2Id || parsed.hero?.stat2Id,
            stat2Value: prev?.hero?.stat2Value ?? parsed.hero?.stat2Value,
            stat2Label: prev?.hero?.stat2Label ?? parsed.hero?.stat2Label,
            stat2Image: prev?.hero?.stat2Image ?? parsed.hero?.stat2Image,
            stat3Id: prev?.hero?.stat3Id || parsed.hero?.stat3Id,
            stat3Value: prev?.hero?.stat3Value ?? parsed.hero?.stat3Value,
            stat3Label: prev?.hero?.stat3Label ?? parsed.hero?.stat3Label,
            stat3Image: prev?.hero?.stat3Image ?? parsed.hero?.stat3Image,
            stat4Id: prev?.hero?.stat4Id || parsed.hero?.stat4Id,
            stat4Value: prev?.hero?.stat4Value ?? parsed.hero?.stat4Value,
            stat4Label: prev?.hero?.stat4Label ?? parsed.hero?.stat4Label,
            stat4Image: prev?.hero?.stat4Image ?? parsed.hero?.stat4Image,
            benefits: (prev?.hero?.benefits && prev.hero.benefits.length > 0) ? prev.hero.benefits : (parsed.hero?.benefits || [])
          };
        }
        // Keep partners from database if available
        if (prev?.partners?.list && prev.partners.list.length > 0) {
          parsed.partners = {
            ...(parsed.partners || {}),
            list: prev.partners.list,
            logos: prev.partners.logos || prev.partners.list
          };
        }
        return parsed;
      });
    }
  }, [settings]);

  useEffect(() => {
    setProfileForm(adminProfile);
  }, [adminProfile]);

  const updateSlideField = (index, field, value) => {
    setHomepageCmsForm(prev => {
      const slides = [...(prev.hero?.slides || [])];
      while (slides.length <= index) {
        slides.push({
          id: `hero-${slides.length + 1}`,
          badge: `Slide ${slides.length + 1}`,
          title: '',
          subtitle: '',
          description: '',
          buttonText: 'Belanja Sekarang',
          buttonLink: '/produk',
          image: '',
          desktopImage: '',
          mobileImage: '',
          cropPosition: 'center center',
          desktopCrop: 'center center',
          mobileCrop: 'center center',
          cropZoom: '100',
          desktopZoom: '100',
          mobileZoom: '100',
          overlay: 0,
          altText: '',
          background: '#ECF6ED',
          active: false
        });
      }
      const updatedSlide = { ...slides[index], [field]: value };
      if (field === 'image') updatedSlide.desktopImage = value;
      if (field === 'desktopImage') updatedSlide.image = value;
      if (field === 'cropPosition') updatedSlide.desktopCrop = value;
      if (field === 'desktopCrop') updatedSlide.cropPosition = value;
      if (field === 'cropZoom') updatedSlide.desktopZoom = value;
      if (field === 'desktopZoom') updatedSlide.cropZoom = value;

      slides[index] = updatedSlide;
      return {
         ...prev,
         hero: { ...prev.hero, slides }
      };
    });
  };

  // File handling functions
  const handleProfileFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah avatar admin ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'tanico-public');
      if (res.success && res.url) {
        setProfileForm(prev => ({ ...prev, avatar: res.url }));
        onAddToast('Avatar admin berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah avatar admin', 'error');
      }
    }
  };

  const handleAboutFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar Editorial ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          about: { ...prev.about, image: res.url } 
        }));
        onAddToast('Gambar Editorial berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar Editorial', 'error');
      }
    }
  };

  const handleAboutImageChange = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast(`Mengunggah gambar ke Supabase Storage...`, 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          about: { ...prev.about, [field]: res.url } 
        }));
        onAddToast(`Gambar berhasil diunggah ke Supabase!`, 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar', 'error');
      }
    }
  };

  const handleFarmerFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar Kisah Tani ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          farmer: { ...prev.farmer, image: res.url } 
        }));
        onAddToast('Gambar Kisah Tani berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar Kisah Tani', 'error');
      }
    }
  };

  const handlePartnerLogoChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const partnerName = homepageCmsForm.partners?.list?.[index]?.name || 'partner';
      const cleanName = partnerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const customFilename = `partner_${cleanName}_${Date.now()}.jpg`;
      onAddToast('Mengunggah logo mitra ke Supabase Storage (bucket: partners)...', 'info');
      const res = await uploadFileToSupabase(file, 'partners', customFilename);
      if (res.success && (res.url || res.publicUrl)) {
        const logoUrl = res.url || res.publicUrl;
        setHomepageCmsForm(prev => {
          const list = [...(prev.partners?.list || [])];
          list[index] = { ...list[index], logo: logoUrl, image: logoUrl };
          const logos = [...(prev.partners?.logos || [])];
          if (logos[index]) {
            logos[index] = { ...logos[index], logo: logoUrl, image: logoUrl };
          } else {
            logos[index] = list[index];
          }
          return {
            ...prev,
            partners: { ...prev.partners, list, logos }
          };
        });
        onAddToast('Logo mitra berhasil diunggah ke Supabase Storage!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah logo mitra', 'error');
      }
      e.target.value = '';
    }
  };

  const handlePartnerReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setHomepageCmsForm(prev => {
      const list = [...(prev.partners?.list || [])];
      if (fromIndex >= list.length || toIndex >= list.length) return prev;
      const [movedItem] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, movedItem);
      const updatedList = list.map((item, idx) => ({
        ...item,
        id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `partner_${Date.now()}_${idx}`),
        order: idx + 1
      }));
      return {
        ...prev,
        partners: {
          ...prev.partners,
          list: updatedList,
          logos: updatedList
        }
      };
    });
    onAddToast('Urutan mitra berhasil diubah!', 'success');
  };

  const handleTestimonialReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setHomepageCmsForm(prev => {
      const list = [...(prev.testimonials?.list || [])];
      if (fromIndex >= list.length || toIndex >= list.length) return prev;
      const [movedItem] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        testimonials: {
          ...prev.testimonials,
          list
        }
      };
    });
    onAddToast('Urutan testimoni berhasil diubah!', 'success');
  };

  const handleToggleSelectArticle = (artId) => {
    setHomepageCmsForm(prev => {
      const currentFarmer = prev.farmer || {};
      const currentSelected = Array.isArray(currentFarmer.selectedArticleIds)
        ? [...currentFarmer.selectedArticleIds]
        : (currentFarmer.selectedArticleIds ? [currentFarmer.selectedArticleIds] : []);
      
      let updatedSelected;
      if (currentSelected.includes(artId)) {
        updatedSelected = currentSelected.filter(id => id !== artId);
      } else {
        updatedSelected = [...currentSelected, artId];
      }

      return {
        ...prev,
        farmer: {
          ...currentFarmer,
          selectedArticleIds: updatedSelected
        }
      };
    });
    onAddToast?.('Pilihan artikel UMKM Story diperbarui.', 'success');
  };

  const handleArticleReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setHomepageCmsForm(prev => {
      const currentFarmer = prev.farmer || {};
      const list = Array.isArray(currentFarmer.selectedArticleIds)
        ? [...currentFarmer.selectedArticleIds]
        : [];
      if (fromIndex >= list.length || toIndex >= list.length) return prev;
      const [movedItem] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, movedItem);
      return {
        ...prev,
        farmer: {
          ...currentFarmer,
          selectedArticleIds: list
        }
      };
    });
    onAddToast?.('Urutan artikel UMKM Story diperbarui!', 'success');
  };

  const handleSelectAllArticles = (publishedArts) => {
    const allIds = publishedArts.map(a => a.id);
    setHomepageCmsForm(prev => ({
      ...prev,
      farmer: {
        ...prev.farmer,
        selectedArticleIds: allIds
      }
    }));
    onAddToast?.('Seluruh artikel diterbitkan telah dipilih.', 'success');
  };

  const handleClearSelectedArticles = () => {
    setHomepageCmsForm(prev => ({
      ...prev,
      farmer: {
        ...prev.farmer,
        selectedArticleIds: []
      }
    }));
    onAddToast?.('Pilihan artikel dikosongkan.', 'info');
  };

  const handleResetToDefaultArticles = () => {
    setHomepageCmsForm(prev => {
      const newFarmer = { ...prev.farmer };
      delete newFarmer.selectedArticleIds;
      delete newFarmer.featuredArticles;
      delete newFarmer.homepageArticles;
      return {
        ...prev,
        farmer: newFarmer
      };
    });
    onAddToast?.('Menggunakan mode artikel default (showOnHomepage = true).', 'success');
  };

  const handleTestimonialAvatarChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah foto profil testimoni ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'testimonials');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => {
          const list = [...(prev.testimonials?.list || [])];
          list[index] = { ...list[index], avatar: res.url };
          return {
            ...prev,
            testimonials: { ...prev.testimonials, list }
          };
        });
        onAddToast('Foto profil testimoni berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah foto profil testimoni', 'error');
      }
    }
  };

  const handleTestimonialsBgFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar background testimoni ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'testimonials');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          testimonials: { ...prev.testimonials, backgroundImage: res.url } 
        }));
        onAddToast('Gambar background testimoni berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah background testimoni', 'error');
      }
    }
  };

  const handleHeroFileChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar slide ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => {
          const slides = [...(prev.hero?.slides || [])];
          if (slides[index]) {
            slides[index] = { 
              ...slides[index], 
              image: res.url,
              desktopImage: res.url 
            };
          }
          return {
            ...prev,
            hero: { ...prev.hero, slides }
          };
        });
        onAddToast(`Gambar Desktop Slide ${index + 1} berhasil diunggah ke Supabase!`, 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar slide', 'error');
      }
    }
  };

  const handleHeroMobileFileChange = async (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar mobile slide ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => {
          const slides = [...(prev.hero?.slides || [])];
          if (slides[index]) {
            slides[index] = { 
              ...slides[index], 
              mobileImage: res.url 
            };
          }
          return {
            ...prev,
            hero: { ...prev.hero, slides }
          };
        });
        onAddToast(`Gambar Mobile Slide ${index + 1} berhasil diunggah ke Supabase!`, 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar mobile slide', 'error');
      }
    }
  };

  const handleFeatureCardFileChange = async (e, num) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah ilustrasi kartu manfaat ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        const uploadedUrl = res.url;
        setHomepageCmsForm(prev => {
          const hero = { ...(prev?.hero || {}) };
          hero[`stat${num}Image`] = uploadedUrl;
          const idx = num - 1;
          const currentBenefits = Array.isArray(hero.benefits) ? [...hero.benefits] : [];
          while (currentBenefits.length < 4) {
            currentBenefits.push({ sortOrder: currentBenefits.length, active: true, value: '', label: '', image: '' });
          }
          currentBenefits[idx] = {
            ...currentBenefits[idx],
            image: uploadedUrl,
            sortOrder: idx
          };
          hero.benefits = currentBenefits;
          return {
            ...prev,
            hero
          };
        });
        onAddToast(`Ilustrasi Kartu Manfaat ${num} berhasil diunggah ke Supabase!`, 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah ilustrasi', 'error');
      }
    }
  };

  const handlePromoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah banner promo ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          promo: { ...prev.promo, banner: res.url } 
        }));
        onAddToast('Banner Promo berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah banner promo', 'error');
      }
    }
  };

  const handleCategoriesFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah background kategori ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'categories');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          categories: { ...prev.categories, backgroundImage: res.url } 
        }));
        onAddToast('Gambar Background Kategori berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah background kategori', 'error');
      }
    }
  };

  const handleCtaImageChange = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddToast('Mengunggah gambar CTA ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'hero');
      if (res.success && res.url) {
        setHomepageCmsForm(prev => ({ 
          ...prev, 
          cta: { ...prev.cta, [field]: res.url } 
        }));
        onAddToast('Gambar CTA berhasil diunggah ke Supabase!', 'success');
      } else {
        onAddToast(res.error || 'Gagal mengunggah gambar CTA', 'error');
      }
    }
  };

  // Savers
  const handleSettingsSave = (e) => {
    e.preventDefault();
    onSaveSettings(settingsForm);
    onAddToast('Konfigurasi Pengaturan Website berhasil diperbarui!', 'success');
    onAddActivityLog('Mengubah pengaturan umum website');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const updatedForm = { ...profileForm, avatar: profileForm.avatar || '' };
      onSaveAdminProfile(updatedForm);
      onAddToast('Profil Administrator berhasil disimpan!', 'success');
      onAddActivityLog('Mengubah data profil admin');
    } catch (err) {
      logger.error(err);
      onAddToast('Gagal memproses profil: ' + err.message, 'error');
    }
  };

  const handleHomepageCmsSave = async (e) => {
    e.preventDefault();
    try {
      // Validation for Hero section if visible
      if (homepageCmsForm.hero?.show ?? true) {
        const slides = homepageCmsForm.hero?.slides || [];
        
        // 1. Maksimal 6 slide
        if (slides.length > 6) {
          onAddToast('Maksimal hanya diperbolehkan 6 slide Hero!', 'error');
          return;
        }

        // Validate each slide in the list
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          
          // Only enforce full rules if active or if the user actively filled out fields
          if (slide.active !== false) {
            const title = slide.title || '';
            if (title.trim() === '') {
              onAddToast(`Judul Slide ${i + 1} tidak boleh kosong jika aktif!`, 'error');
              return;
            }
            if (title.trim().length < 3) {
              onAddToast(`Judul Slide ${i + 1} minimal harus 3 karakter!`, 'error');
              return;
            }

            const img = slide.desktopImage || slide.image || '';
            if (!img) {
              onAddToast(`Gambar Desktop Slide ${i + 1} wajib diisi!`, 'error');
              return;
            }

            // Check if image is a valid URL (starts with http://, https://, or /)
            const isValidUrl = img.startsWith('http://') || 
                               img.startsWith('https://') || 
                               img.startsWith('/');
            if (!isValidUrl) {
              onAddToast(`Gambar Desktop Slide ${i + 1} harus berupa URL yang valid (dimulai dengan http://, https:// atau /)!`, 'error');
              return;
            }

            if (slide.mobileImage) {
              const mobileImg = slide.mobileImage;
              const isValidMobileUrl = mobileImg.startsWith('http://') || 
                                       mobileImg.startsWith('https://') || 
                                       mobileImg.startsWith('/');
              if (!isValidMobileUrl) {
                onAddToast(`Gambar Mobile Slide ${i + 1} harus berupa URL yang valid!`, 'error');
                return;
              }
            }

            const zoom = parseInt(slide.cropZoom || '100', 10);
            if (isNaN(zoom) || zoom < 100 || zoom > 180) {
              onAddToast(`Crop Zoom Slide ${i + 1} harus berupa angka antara 100 dan 180!`, 'error');
              return;
            }

            const validCropPositions = ['left center', 'center center', 'right center', 'center top', 'center bottom'];
            const pos = slide.cropPosition || 'center center';
            if (!validCropPositions.includes(pos)) {
              onAddToast(`Crop Position Slide ${i + 1} tidak valid! Pilih posisi yang tersedia.`, 'error');
              return;
            }

            const link = slide.buttonLink || '';
            if (!link) {
              onAddToast(`Tautan Tombol CTA Slide ${i + 1} wajib diisi!`, 'error');
              return;
            }
          }
        }
      }

      // Validation for Partners list if section is shown
      if (homepageCmsForm.partners?.show ?? true) {
        const list = homepageCmsForm.partners?.list || [];
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          const name = p.name || '';
          if (name.trim() === '') {
            onAddToast(`Nama Mitra ke-${i + 1} tidak boleh kosong!`, 'error');
            return;
          }
          if (name.trim().length < 3) {
            onAddToast(`Nama Mitra ke-${i + 1} ("${name}") minimal harus 3 karakter!`, 'error');
            return;
          }
          const desc = p.description ?? p.desc ?? '';
          if (desc.length > 150) {
            onAddToast(`Deskripsi Mitra ke-${i + 1} ("${name}") maksimal harus 150 karakter!`, 'error');
            return;
          }
        }
      }

      // Validation for Testimonials list if section is shown
      if (homepageCmsForm.testimonials?.show ?? true) {
        const list = homepageCmsForm.testimonials?.list || [];
        for (let i = 0; i < list.length; i++) {
          const t = list[i];
          const name = (t.name || '').trim();
          if (name === '') {
            onAddToast(`Nama Testimoni ke-${i + 1} tidak boleh kosong!`, 'error');
            return;
          }
          if (name.length < 3) {
            onAddToast(`Nama Testimoni ke-${i + 1} ("${name}") minimal harus 3 karakter!`, 'error');
            return;
          }
          const comment = (t.comment || t.review || '').trim();
          if (comment === '') {
            onAddToast(`Ulasan Testimoni ke-${i + 1} tidak boleh kosong!`, 'error');
            return;
          }
          if (comment.length < 10 || comment.length > 300) {
            onAddToast(`Ulasan Testimoni ke-${i + 1} ("${name}") harus antara 10 dan 300 karakter!`, 'error');
            return;
          }
          const rating = parseInt(t.rating ?? 5, 10);
          if (isNaN(rating) || rating < 1 || rating > 5) {
            onAddToast(`Rating Testimoni ke-${i + 1} ("${name}") harus antara 1 dan 5!`, 'error');
            return;
          }
        }
      }

      // Validation for Gallery section if shown
      if (homepageCmsForm.gallery?.show ?? true) {
        const badge = homepageCmsForm.gallery?.badge || '';
        if (badge.trim().length < 3) {
          onAddToast('Badge Galeri minimal harus 3 karakter!', 'error');
          return;
        }
        const title = homepageCmsForm.gallery?.title || '';
        if (title.trim().length < 5) {
          onAddToast('Judul Galeri minimal harus 5 karakter!', 'error');
          return;
        }
        const description = homepageCmsForm.gallery?.description || '';
        if (description.length > 300) {
          onAddToast('Deskripsi Galeri maksimal harus 300 karakter!', 'error');
          return;
        }
        const limit = parseInt(homepageCmsForm.gallery?.limit ?? 6, 10);
        if (isNaN(limit) || limit < 1 || limit > 12) {
          onAddToast('Limit Gambar Galeri harus antara 1 dan 12!', 'error');
          return;
        }
      }

      // Prepare images for the active slides list
      let processedSlides = [];
      if (homepageCmsForm.hero?.slides) {
        for (let i = 0; i < homepageCmsForm.hero.slides.length; i++) {
          const s = homepageCmsForm.hero.slides[i];
          const deskImg = s.desktopImage || s.image || '';
          const mobImg = s.mobileImage || '';
          processedSlides.push({
            ...s,
            image: deskImg,
            desktopImage: deskImg,
            mobileImage: mobImg
          });
        }
      }

      // Prepare images for the 4 benefit cards
      const processedStat1Image = homepageCmsForm.hero?.stat1Image || '';
      const processedStat2Image = homepageCmsForm.hero?.stat2Image || '';
      const processedStat3Image = homepageCmsForm.hero?.stat3Image || '';
      const processedStat4Image = homepageCmsForm.hero?.stat4Image || '';

      const processedFarmerImage = homepageCmsForm.farmer?.image || '';
      
      const processedPartnersList = [];
      const processedLogosList = [];
      const currentList = homepageCmsForm.partners?.list || homepageCmsForm.partners?.logos || [];
      for (let i = 0; i < currentList.length; i++) {
        const p = currentList[i];
        const logoVal = p.logo || p.image || '';
        const pLocation = p.location || '';
        const pDescription = p.description ?? p.desc ?? '';
        const pWebsite = p.website ?? p.url ?? '#';
        const pSortOrder = Number(p.sortOrder ?? p.order ?? (i + 1));
        const updatedPartner = {
          ...p,
          id: p.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `partner_${Date.now()}_${i}`),
          name: p.name || `Mitra ${i + 1}`,
          logo: logoVal,
          image: logoVal,
          location: pLocation,
          description: pDescription,
          desc: pDescription,
          website: pWebsite,
          url: pWebsite,
          sortOrder: pSortOrder,
          order: pSortOrder,
          active: p.active !== false
        };
        processedPartnersList.push(updatedPartner);
        processedLogosList.push(updatedPartner);
      }

      let processedTestimonialsList = [];
      if (homepageCmsForm.testimonials?.list) {
        for (let i = 0; i < homepageCmsForm.testimonials.list.length; i++) {
          const t = homepageCmsForm.testimonials.list[i];
          const avatarVal = t.avatar || '';
          const tComment = t.comment || t.review || '';
          processedTestimonialsList.push({
            ...t,
            comment: tComment,
            review: tComment,
            avatar: avatarVal
          });
        }
      }

      const processedTestimonialsBg = homepageCmsForm.testimonials?.backgroundImage || '';
      const processedGalleryBg = homepageCmsForm.gallery?.backgroundImage || '';

      // Bulk sync HeroBanners directly to database table public."HeroBanner"
      try {
        const heroRes = await fetch('/api/hero-banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slides: processedSlides })
        });
        if (heroRes.ok) {
          const heroData = await heroRes.json();
          if (Array.isArray(heroData)) {
            processedSlides = heroData;
          }
        }
      } catch (heroErr) {
        logger.error('Error syncing hero banners directly:', heroErr);
      }

      // Bulk sync Testimonials directly to database table public."Testimonial"
      try {
        const testiRes = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list: processedTestimonialsList })
        });
        if (testiRes.ok) {
          const testiData = await testiRes.json();
          if (Array.isArray(testiData)) {
            processedTestimonialsList = testiData;
          }
        }
      } catch (testiErr) {
        logger.error('Error syncing testimonials directly:', testiErr);
      }

      // Bulk sync Partners directly to database table public."Partner"
      try {
        const partnerRes = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list: processedPartnersList })
        });
        if (partnerRes.ok) {
          const partnerData = await partnerRes.json();
          if (Array.isArray(partnerData)) {
            processedPartnersList = partnerData;
            processedLogosList = partnerData;
          }
        }
      } catch (partnerErr) {
        logger.error('Error syncing partners directly:', partnerErr);
      }

      // Bulk sync HeroBenefits directly to database table public."HeroBenefit"
      const benefitCardsPayload = [1, 2, 3, 4].map((num, idx) => {
        const processedImg = num === 1 ? processedStat1Image : num === 2 ? processedStat2Image : num === 3 ? processedStat3Image : processedStat4Image;
        const currentImg = processedImg || homepageCmsForm.hero?.[`stat${num}Image`] || '';
        const titleVal = (homepageCmsForm.hero?.[`stat${num}Value`] || '').trim();
        const descVal = (homepageCmsForm.hero?.[`stat${num}Label`] || '').trim();
        return {
          id: homepageCmsForm.hero?.[`stat${num}Id`] || undefined,
          title: titleVal,
          description: descVal,
          value: titleVal,
          label: descVal,
          image: currentImg,
          sortOrder: idx,
          active: Boolean(titleVal || descVal || currentImg)
        };
      });

      try {
        const benefitRes = await fetch('/api/hero-benefits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ benefits: benefitCardsPayload })
        });
        if (!benefitRes.ok) {
          const errData = await benefitRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal menyimpan 4 Kartu Manfaat Hero ke database');
        }
        const savedBenefits = await benefitRes.json().catch(() => null);
        if (Array.isArray(savedBenefits) && savedBenefits.length > 0) {
          setHomepageCmsForm(prev => {
            const hero = { ...(prev?.hero || {}) };
            savedBenefits.forEach((item, idx) => {
              const num = idx + 1;
              hero[`stat${num}Id`] = item.id;
              hero[`stat${num}Value`] = item.value || '';
              hero[`stat${num}Label`] = item.label || '';
              hero[`stat${num}Image`] = item.image || '';
              hero[`stat${num}SortOrder`] = item.sortOrder ?? idx;
              hero[`stat${num}Active`] = item.active !== false;
            });
            hero.benefits = savedBenefits;
            return { ...prev, hero };
          });
        }
      } catch (benefitErr) {
        logger.error('Error syncing hero benefits directly:', benefitErr);
        throw benefitErr;
      }

      const finalizedCms = {
        ...homepageCmsForm,
        farmer: {
          ...homepageCmsForm.farmer,
          image: processedFarmerImage
        },
        partners: {
          ...homepageCmsForm.partners,
          list: processedPartnersList,
          logos: processedLogosList,
          speed: homepageCmsForm.partners?.speed ?? homepageCmsForm.partners?.marqueeSpeed ?? 35,
          marqueeSpeed: homepageCmsForm.partners?.speed ?? homepageCmsForm.partners?.marqueeSpeed ?? 35,
          autoplay: homepageCmsForm.partners?.autoplay ?? true,
          pauseOnHover: homepageCmsForm.partners?.pauseOnHover ?? true,
          gap: homepageCmsForm.partners?.gap ?? 24
        },
        hero: {
          ...homepageCmsForm.hero,
          slides: processedSlides,
          stat1Image: processedStat1Image,
          stat2Image: processedStat2Image,
          stat3Image: processedStat3Image,
          stat4Image: processedStat4Image
        },
        testimonials: {
          ...homepageCmsForm.testimonials,
          backgroundImage: processedTestimonialsBg,
          list: processedTestimonialsList
        },
        gallery: {
          ...homepageCmsForm.gallery,
          backgroundImage: processedGalleryBg
        }
      };

      const updatedSettings = {
        ...settingsForm,
        homepageCMS: JSON.stringify(finalizedCms)
      };
      
      const saveRes = await onSaveSettings(updatedSettings);
      if (saveRes && saveRes.success === false) {
        throw new Error(saveRes.error || 'Gagal menyimpan ke database');
      }

      setSettingsForm(updatedSettings);
      setHomepageCmsForm(finalizedCms);
      await loadHeroBenefits();
      onAddToast('Kisah & Editorial Halaman Utama berhasil diperbarui!', 'success');
      onAddActivityLog('Mengubah konten editorial halaman utama via CMS');
    } catch (err) {
      logger.error(err);
      onAddToast('Gagal menyimpan perubahan: ' + err.message, 'error');
    }
  };

  
  return (
    <div className="space-y-6">
      <form onSubmit={handleHomepageCmsSave} className="space-y-8 text-left w-full">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">Manajemen Halaman</span>
            <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Homepage CMS Editor</h3>
            <p className="text-xs text-gray-500 mt-1">Konfigurasikan seluruh visual, slogan, deskripsi, tombol, tautan, warna latar belakang, dan status aktif untuk setiap section secara realtime.</p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-3 overflow-x-auto">
            {[
              { id: 'hero', name: 'Hero' },
              { id: 'categories', name: 'Kategori' },
              { id: 'featuredProducts', name: 'Produk' },
              { id: 'partners', name: 'Mitra & Kemitraan' },
              { id: 'gallery', name: 'Galeri' },
              { id: 'testimonials', name: 'Testimoni' },
              { id: 'farmer', name: 'UMKM Story' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 text-[10px] font-sans uppercase tracking-wider rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-[#174C3C] text-white font-bold hover:bg-[#205E49] active:bg-[#123A2E] shadow-xs'
                    : 'bg-[#FCFCFC] text-[#174C3C] font-bold border border-[#DDE9DF] hover:border-[#174C3C] hover:shadow-xs'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          <div className="bg-white border border-gray-200/50 p-6 rounded-[20px] shadow-xs space-y-6">
            
            {/* HERO TAB */}
            {activeSubTab === 'hero' && (() => {
              const heroCms = homepageCmsForm.hero || {};
              const slides = heroCms.slides || [];
              
              const activeSlideIdxClamped = Math.min(activeSlideIdx, Math.max(0, slides.length - 1));

              const handleAddSlide = () => {
                const currentSlides = [...slides];
                if (currentSlides.length >= 6) {
                  onAddToast('Maksimal hanya diperbolehkan 6 slide Hero!', 'error');
                  return;
                }
                const newSlide = {
                  id: `hero-${Date.now()}`,
                  badge: `Slide Baru`,
                  title: 'Judul Baru',
                  subtitle: 'Subjudul Baru',
                  description: 'Deskripsi singkat mengenai slide baru ini.',
                  buttonText: 'Belanja Sekarang',
                  buttonLink: '/produk',
                  image: '',
                  desktopImage: '',
                  mobileImage: '',
                  cropPosition: 'center center',
                  cropZoom: '100',
                  altText: 'Deskripsi gambar slide',
                  background: '#ECF6ED',
                  active: true
                };
                currentSlides.push(newSlide);
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(currentSlides.length - 1);
                onAddToast('Slide baru ditambahkan!', 'success');
              };

              const handleDeleteSlide = (idx) => {
                const currentSlides = [...slides];
                if (currentSlides.length <= 1) {
                  onAddToast('Harus menyisakan minimal 1 slide!', 'error');
                  return;
                }
                currentSlides.splice(idx, 1);
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(Math.max(0, idx - 1));
                onAddToast('Slide berhasil dihapus!', 'success');
              };

              const handleMoveSlide = (idx, direction) => {
                const currentSlides = [...slides];
                const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                if (targetIdx < 0 || targetIdx >= currentSlides.length) return;
                const temp = currentSlides[idx];
                currentSlides[idx] = currentSlides[targetIdx];
                currentSlides[targetIdx] = temp;
                setHomepageCmsForm(prev => ({
                  ...prev,
                  hero: { ...prev.hero, slides: currentSlides }
                }));
                setActiveSlideIdx(targetIdx);
                onAddToast('Urutan slide berhasil diubah!', 'success');
              };

              const currentSlide = slides[activeSlideIdxClamped] || {
                id: '',
                badge: '',
                title: '',
                subtitle: '',
                description: '',
                buttonText: '',
                buttonLink: '',
                image: '',
                cropPosition: 'center center',
                cropZoom: '100',
                background: '#ECF6ED',
                active: true
              };

              return (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Editor Visual Section Hero (Multi-Slide)</h4>
                    <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                      <input
                        type="checkbox"
                        checked={heroCms.show ?? true}
                        onChange={(e) => setHomepageCmsForm(prev => ({
                          ...prev,
                          hero: { ...prev.hero, show: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                      />
                      Tampilkan Section Hero
                    </label>
                  </div>

                  {/* FORM EDITORS CONTAINER (TOP) */}
                  <div className="w-full space-y-6">
                      
                      {/* PENGATURAN SLIDESHOW */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">PENGATURAN SLIDESHOW UTAMA</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Autoplay Toggle */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Autoplay Slideshow</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.autoplay ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, autoplay: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Aktifkan Autoplay
                            </label>
                          </div>

                          {/* Autoplay Speed */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Kecepatan Transisi (Autoplay Speed)</label>
                            <select
                              value={heroCms.autoplaySpeed || '5000'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, autoplaySpeed: e.target.value }
                              }))}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10"
                            >
                              <option value="3000">3 Detik (3000ms)</option>
                              <option value="5000">5 Detik (5000ms)</option>
                              <option value="8000">8 Detik (8000ms)</option>
                              <option value="10000">10 Detik (10000ms)</option>
                            </select>
                          </div>

                          {/* Show Arrows */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Tombol Navigasi Panah (Arrows)</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.showArrows ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, showArrows: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Tampilkan Tombol Panah
                            </label>
                          </div>

                          {/* Show Dots */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Indikator Titik (Dots Indicator)</label>
                            <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                              <input
                                type="checkbox"
                                checked={heroCms.showDots ?? true}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, showDots: e.target.checked }
                                }))}
                                className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                              />
                              Tampilkan Titik Indikator
                            </label>
                          </div>

                          {/* Default First Slide Select */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Pilih Slide Pertama Tampil (Default First Slide)</label>
                            <select
                              value={heroCms.defaultFirstSlideIdx ?? 0}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, defaultFirstSlideIdx: parseInt(e.target.value, 10) }
                              }))}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10"
                            >
                              {slides.map((s, idx) => (
                                <option key={idx} value={idx}>
                                  Slide {idx + 1} - {s.badge || `Slide ${idx + 1}`} {s.active !== false ? '(🟢 Aktif)' : '(⚫ Nonaktif)'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* TATA LETAK & ESTETIKA PREMIUM */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">TATA LETAK & ESTETIKA PREMIUM</div>
                        
                        {/* Height Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Tinggi Hero Desktop: <span className="text-brand-green font-mono font-bold">{heroCms.desktopHeight ?? 420}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">300px</span>
                              <input
                                type="range"
                                min="300"
                                max="700"
                                step="10"
                                value={heroCms.desktopHeight ?? 420}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, desktopHeight: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">700px</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Tinggi Hero Mobile: <span className="text-brand-green font-mono font-bold">{heroCms.mobileHeight ?? 380}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">250px</span>
                              <input
                                type="range"
                                min="250"
                                max="600"
                                step="10"
                                value={heroCms.mobileHeight ?? 380}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, mobileHeight: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">600px</span>
                            </div>
                          </div>
                        </div>

                        {/* Effects Sliders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Kegelapan Overlay Gambar: <span className="text-brand-green font-mono font-bold">{heroCms.overlayOpacity ?? 0}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                step="5"
                                value={heroCms.overlayOpacity ?? 0}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, overlayOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">80%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Kekuatan Kabur Gambar (Blur): <span className="text-brand-green font-mono font-bold">{heroCms.blurStrength ?? 0}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0px</span>
                              <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={heroCms.blurStrength ?? 0}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, blurStrength: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">15px</span>
                            </div>
                          </div>
                        </div>

                        {/* Grain & Glow */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Kepekatan Grain Film: <span className="text-brand-green font-mono font-bold">{heroCms.grainOpacity ?? 2}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="1"
                                value={heroCms.grainOpacity ?? 2}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, grainOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">10%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Kekuatan Pancaran (Glow Opacity): <span className="text-brand-green font-mono font-bold">{heroCms.glowOpacity ?? 3}%</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={heroCms.glowOpacity ?? 3}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowOpacity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">15%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Pancaran (Glow Color)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroCms.glowColor || '#174C3C'}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowColor: e.target.value }
                                }))}
                                className="w-10 h-10 p-0 border border-gray-200 outline-none rounded-lg cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={heroCms.glowColor || '#174C3C'}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, glowColor: e.target.value }
                                }))}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="#174C3C"
                              />
                            </div>
                          </div>

                          {/* Swipe Settings */}
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Sensitivitas Swipe Mobile: <span className="text-brand-green font-mono font-bold">{heroCms.swipeSensitivity ?? 50}px</span></label>
                            <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">20px</span>
                              <input
                                type="range"
                                min="20"
                                max="120"
                                step="5"
                                value={heroCms.swipeSensitivity ?? 50}
                                onChange={(e) => setHomepageCmsForm(prev => ({
                                  ...prev,
                                  hero: { ...prev.hero, swipeSensitivity: parseInt(e.target.value, 10) }
                                }))}
                                className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">120px</span>
                            </div>
                          </div>
                        </div>

                        {/* Swipe Mobile Toggle */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Fitur Swipe Kiri/Kanan Mobile</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg">
                            <input
                              type="checkbox"
                              checked={heroCms.swipeEnabled ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { ...prev.hero, swipeEnabled: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                            />
                            Aktifkan Gestur Swipe Mobile
                          </label>
                        </div>
                      </div>

                      {/* SLIDES LIST MANAGEMENT */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                          <label className="font-jost text-[10px] uppercase tracking-wider text-gray-400 block font-bold">DAFTAR SLIDE ({slides.length}/6)</label>
                          {slides.length < 6 && (
                            <button
                              type="button"
                              onClick={handleAddSlide}
                              className="px-2.5 py-1 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white text-[9px] uppercase tracking-wider rounded font-bold transition-colors duration-200 cursor-pointer"
                            >
                              + Tambah Slide Baru
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {slides.map((slide, idx) => {
                            const isActiveTab = activeSlideIdxClamped === idx;
                            return (
                              <div 
                                key={idx}
                                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                  isActiveTab ? 'border-[#12372A] bg-[#12372A]/5' : 'border-gray-100 bg-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setActiveSlideIdx(idx)}
                                  className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isActiveTab ? 'bg-[#12372A] text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <div className="leading-tight">
                                    <div className="text-xs font-bold text-gray-800 font-jost">{slide.badge || `Slide ${idx + 1}`}</div>
                                    <div className="text-[10px] text-gray-400 font-mono flex gap-2">
                                      <span>{slide.active !== false ? '🟢 Aktif' : '⚫ Nonaktif'}</span>
                                      {heroCms.defaultFirstSlideIdx === idx && <span className="text-[#174C3C] font-bold">★ Pertama</span>}
                                    </div>
                                  </div>
                                </button>

                                <div className="flex items-center gap-1">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveSlide(idx, 'up')}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    title="Pindahkan Ke Atas"
                                  >
                                    ▲
                                  </button>
                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={idx === slides.length - 1}
                                    onClick={() => handleMoveSlide(idx, 'down')}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                                    title="Pindahkan Ke Bawah"
                                  >
                                    ▼
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlide(idx)}
                                    className="p-1 text-red-500 hover:text-red-700 cursor-pointer ml-1"
                                    title="Hapus Slide"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ACTIVE SLIDE DETAILED FORM */}
                      <div className="border border-gray-200 p-5 rounded-xl bg-white space-y-4 shadow-sm">
                        <div className="text-xs font-jost font-bold text-[#12372A] uppercase tracking-wider flex justify-between items-center border-b border-gray-100 pb-2">
                          <span>KONTEN DETAIL SLIDE {activeSlideIdxClamped + 1}: <span className="text-brand-green font-mono">{currentSlide.badge}</span></span>
                          <label className="flex items-center gap-1.5 cursor-pointer font-jost text-[10px] text-gray-500 font-bold normal-case">
                            <input
                              type="checkbox"
                              checked={currentSlide.active !== false}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'active', e.target.checked)}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                            />
                            Slide Aktif
                          </label>
                        </div>

                        {/* SLIDE BADGE & COLOR */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Kecil (Badge / Tab Name)</label>
                            <input
                              type="text"
                              value={currentSlide.badge || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'badge', e.target.value)}
                              placeholder="Masukkan label kecil, misal: 'Unggulan', 'Sayur Segar', 'Kemitraan'"
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Latar Belakang (Warna Default Latar)</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={currentSlide.background || '#ECF6ED'}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'background', e.target.value)}
                                className="w-10 h-10 p-0 border border-gray-200 outline-none rounded-lg cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={currentSlide.background || '#ECF6ED'}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'background', e.target.value)}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="#ECF6ED"
                              />
                            </div>
                          </div>
                        </div>

                        {/* TITLES */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Utama Slide (Baris 1)</label>
                          <input
                            type="text"
                            value={currentSlide.title || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'title', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Tulis judul utama yang menarik perhatian..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Subjudul Slide (Baris 2)</label>
                          <input
                            type="text"
                            value={currentSlide.subtitle || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'subtitle', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Masukkan subjudul pelengkap..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi Slide</label>
                          <textarea
                            rows={3}
                            value={currentSlide.description || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'description', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Tulis deskripsi singkat tentang slide ini..."
                          />
                        </div>

                        {/* BUTTONS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Teks Tombol CTA</label>
                            <input
                              type="text"
                              value={currentSlide.buttonText || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'buttonText', e.target.value)}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="Misal: Belanja Sekarang"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Tautan Tombol CTA</label>
                            <input
                              type="text"
                              value={currentSlide.buttonLink || ''}
                              onChange={(e) => updateSlideField(activeSlideIdxClamped, 'buttonLink', e.target.value)}
                              className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                              placeholder="/produk atau https://..."
                            />
                          </div>
                        </div>

                        {/* IMAGE FIELDS: DESKTOP & MOBILE BANNERS */}
                        <div className="space-y-4 pt-3 border-t border-gray-100">
                          {/* DESKTOP BANNER */}
                          <div className="border border-gray-200 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="font-jost text-[10px] uppercase tracking-wider text-[#12372A] block font-bold">
                                🖥️ Desktop Banner (Slide {activeSlideIdxClamped + 1})
                              </label>
                              {(currentSlide.desktopImage || currentSlide.image) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSlideField(activeSlideIdxClamped, 'image', '');
                                    updateSlideField(activeSlideIdxClamped, 'desktopImage', '');
                                    onAddToast('Gambar Desktop slide direset!', 'info');
                                  }}
                                  className="text-red-500 hover:text-red-700 font-jost text-[9px] uppercase tracking-wider cursor-pointer font-bold"
                                >
                                  Reset Desktop Banner
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentSlide.desktopImage || currentSlide.image || ''}
                                onChange={(e) => {
                                  updateSlideField(activeSlideIdxClamped, 'desktopImage', e.target.value);
                                  updateSlideField(activeSlideIdxClamped, 'image', e.target.value);
                                }}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="Masukkan URL gambar untuk desktop (wajib)…"
                              />
                              <label className="px-4 py-3 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[10px] uppercase tracking-widest cursor-pointer flex items-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                UPLOAD DESKTOP
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleHeroFileChange(e, activeSlideIdxClamped)}
                                />
                              </label>
                            </div>

                            {/* DESKTOP CROP & ZOOM */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Fokus Potong Desktop (Desktop Crop)</label>
                                <select
                                  value={currentSlide.desktopCrop || currentSlide.cropPosition || 'center center'}
                                  onChange={(e) => {
                                    updateSlideField(activeSlideIdxClamped, 'desktopCrop', e.target.value);
                                    updateSlideField(activeSlideIdxClamped, 'cropPosition', e.target.value);
                                  }}
                                  className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-9"
                                >
                                  <option value="left center">Kiri (left center)</option>
                                  <option value="center center">Tengah (center center)</option>
                                  <option value="right center">Kanan (right center)</option>
                                  <option value="center top">Atas (center top)</option>
                                  <option value="center bottom">Bawah (center bottom)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Zoom Desktop: <span className="text-brand-green font-bold font-mono">{currentSlide.desktopZoom || currentSlide.cropZoom || '100'}%</span></label>
                                <div className="flex items-center gap-2 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                                  <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                  <input
                                    type="range"
                                    min="100"
                                    max="180"
                                    step="5"
                                    value={currentSlide.desktopZoom || currentSlide.cropZoom || '100'}
                                    onChange={(e) => {
                                      updateSlideField(activeSlideIdxClamped, 'desktopZoom', e.target.value);
                                      updateSlideField(activeSlideIdxClamped, 'cropZoom', e.target.value);
                                    }}
                                    className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                  />
                                  <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* MOBILE BANNER */}
                          <div className="border border-gray-200 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="font-jost text-[10px] uppercase tracking-wider text-[#12372A] block font-bold">
                                📱 Mobile Banner (Slide {activeSlideIdxClamped + 1})
                              </label>
                              {currentSlide.mobileImage && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateSlideField(activeSlideIdxClamped, 'mobileImage', '');
                                    onAddToast('Gambar Mobile slide direset!', 'info');
                                  }}
                                  className="text-red-500 hover:text-red-700 font-jost text-[9px] uppercase tracking-wider cursor-pointer font-bold"
                                >
                                  Reset Mobile Banner
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentSlide.mobileImage || ''}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileImage', e.target.value)}
                                className="flex-1 text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono"
                                placeholder="Opsional: URL gambar khusus untuk mobile…"
                              />
                              <label className="px-4 py-3 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[10px] uppercase tracking-widest cursor-pointer flex items-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                UPLOAD MOBILE
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleHeroMobileFileChange(e, activeSlideIdxClamped)}
                                />
                              </label>
                            </div>

                            {/* MOBILE CROP & ZOOM */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              <div className="space-y-1">
                                <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Fokus Potong Mobile (Mobile Crop)</label>
                                <select
                                  value={currentSlide.mobileCrop || 'center center'}
                                  onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileCrop', e.target.value)}
                                  className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-9"
                                >
                                  <option value="left center">Kiri (left center)</option>
                                  <option value="center center">Tengah (center center)</option>
                                  <option value="right center">Kanan (right center)</option>
                                  <option value="center top">Atas (center top)</option>
                                  <option value="center bottom">Bawah (center bottom)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Zoom Mobile: <span className="text-brand-green font-bold font-mono">{currentSlide.mobileZoom || '100'}%</span></label>
                                <div className="flex items-center gap-2 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                                  <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                  <input
                                    type="range"
                                    min="100"
                                    max="180"
                                    step="5"
                                    value={currentSlide.mobileZoom || '100'}
                                    onChange={(e) => updateSlideField(activeSlideIdxClamped, 'mobileZoom', e.target.value)}
                                    className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                                  />
                                  <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* OVERLAY DARKNESS PER SLIDE */}
                          <div className="space-y-1 border border-gray-200 p-3.5 rounded-xl bg-gray-50/50">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">
                              Kegelapan Overlay Per-Slide: <span className="text-brand-green font-bold font-mono">{currentSlide.overlay ?? 0}%</span>
                            </label>
                            <div className="flex items-center gap-3 h-9 bg-white border border-gray-200 px-3 rounded-lg">
                              <span className="text-[9px] text-gray-400 font-mono">0% (Terang)</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={currentSlide.overlay ?? 0}
                                onChange={(e) => updateSlideField(activeSlideIdxClamped, 'overlay', parseInt(e.target.value, 10))}
                                className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] text-gray-400 font-mono">100% (Gelap)</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Teks SEO Gambar (Alt Text)</label>
                          <input
                            type="text"
                            value={currentSlide.altText || ''}
                            onChange={(e) => updateSlideField(activeSlideIdxClamped, 'altText', e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                            placeholder="Deskripsi untuk keterbacaan SEO dan aksesibilitas…"
                          />
                        </div>
                      </div>

                      {/* 4 BENEFIT CARDS SECTION */}
                      <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                        <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">4 KARTU MANFAAT TERKAIT</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((num) => (
                            <div key={num} className="border border-gray-200 p-3 rounded-xl bg-white space-y-2 shadow-xs">
                              <div className="text-[9px] font-jost font-bold text-[#12372A] uppercase tracking-wider">KARTU MANFAAT {num}</div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Judul Singkat</label>
                                <input
                                  type="text"
                                  value={homepageCmsForm.hero?.[`stat${num}Value`] || ''}
                                  onChange={(e) => setHomepageCmsForm(prev => ({
                                    ...prev,
                                    hero: { ...prev.hero, [`stat${num}Value`]: e.target.value }
                                  }))}
                                  className="w-full text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg font-bold text-[#12372A]"
                                  placeholder={`Misal: ${num === 1 ? 'Petani Lokal' : num === 2 ? 'Berkualitas' : num === 3 ? 'Segar' : 'Berkelanjutan'}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                                <textarea
                                  rows={2}
                                  value={homepageCmsForm.hero?.[`stat${num}Label`] || ''}
                                  onChange={(e) => setHomepageCmsForm(prev => ({
                                    ...prev,
                                    hero: { ...prev.hero, [`stat${num}Label`]: e.target.value }
                                  }))}
                                  className="w-full text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-600"
                                  placeholder="Tulis deskripsi manfaat ini…"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Ilustrasi Manfaat</label>
                                
                                {homepageCmsForm.hero?.[`stat${num}Image`] ? (
                                  <div className="space-y-2">
                                    <div className="relative w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={buildStorageUrl(homepageCmsForm.hero[`stat${num}Image`]) || null}
                                        alt={`Benefit ${num}`}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 font-medium rounded-lg text-[10px] px-2.5 py-1.5 hover:bg-gray-50 font-jost">
                                        Ganti Gambar
                                        <input
                                          type="file"
                                          accept=".png,.jpg,.jpeg,.webp"
                                          className="hidden"
                                          onChange={(e) => handleFeatureCardFileChange(e, num)}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setHomepageCmsForm(prev => ({
                                          ...prev,
                                          hero: { ...prev.hero, [`stat${num}Image`]: '' }
                                        }))}
                                        className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium rounded-lg text-[10px] px-2.5 py-1.5 font-jost"
                                      >
                                        Hapus Gambar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="text-[11px] text-gray-400 italic">Belum ada ilustrasi</div>
                                    <label className="cursor-pointer inline-block bg-[#12372A] text-white font-medium rounded-lg text-[10px] px-3 py-1.5 hover:bg-[#12372A]/90 font-jost">
                                      Upload Gambar
                                      <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp"
                                        className="hidden"
                                        onChange={(e) => handleFeatureCardFileChange(e, num)}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                  </div>

                  {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                  <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                          Pratinjau Live Website
                        </h5>
                        <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                      </div>

                      {/* Responsive Device Switcher */}
                      <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('tablet')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Tablet (768px)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Mobile (375px)
                        </button>
                      </div>
                    </div>

                    {/* LIVE PREVIEW FRAME */}
                    <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                      <div className={`transition-all duration-300 mx-auto w-full ${
                        previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                        previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                      }`}>
                        <Hero cms={{ ...homepageCmsForm.hero, allowInactive: true, defaultFirstSlideIdx: activeSlideIdxClamped }} />
                      </div>
                    </div>

                    {/* ACTIONS BAR CONTAINER */}
                    <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModalConfig({
                            title: 'Reset Section Hero',
                            itemName: 'Hero Section',
                            itemType: 'section',
                            message: 'Apakah Anda yakin ingin menyetel ulang bagian Hero saja ke setelan bawaan (default)?',
                            onConfirm: () => {
                              setHomepageCmsForm(prev => ({
                                ...prev,
                                hero: { slides: [], title: "", subtitle: "", badge: "", description: "", overlay: 0 }
                              }));
                              onAddToast('Bagian Hero diatur ulang ke default bawaan!', 'info');
                            }
                          });
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                      >
                        Reset Hero ke Default
                      </button>
                      <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                        Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* KATEGORI TAB */}
            {activeSubTab === 'categories' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Bagian Kelompok Hasil Bumi (Kategori)</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.categories?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                    Tampilkan Section Kategori
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6 pt-2">
                  <h4 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
                    Pengaturan Teks & Layout Section Kategori
                  </h4>

                  {/* Header Text Settings */}
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Judul Kecil (Badge)</label>
                    <input
                      type="text"
                      value={homepageCmsForm.categories?.badge || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, badge: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                      placeholder="Masukkan judul kecil untuk section Kategori, misal: PILIHAN KATEGORI"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Judul Utama</label>
                    <input
                      type="text"
                      value={homepageCmsForm.categories?.title || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, title: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                      placeholder="Masukkan judul utama, misal: Temukan Hasil Bumi untuk Setiap Kebutuhan"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                    <textarea
                      rows={3}
                      value={homepageCmsForm.categories?.description || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        categories: { ...prev.categories, description: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700"
                      placeholder="Tulis deskripsi singkat untuk section Kategori, misal: Dipilih langsung dari petani lokal Bangka..."
                    />
                  </div>

                  {/* Tampilan & Limit */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-4">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs">TAMPILAN & JUMLAH KATEGORI</h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Jumlah Maksimal Kategori Ditamplikan (1 - 10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={homepageCmsForm.categories?.limit ?? 5}
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) val = 1;
                            if (val < 1) val = 1;
                            if (val > 10) val = 10;
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, limit: val }
                            }));
                          }}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Hover Effect Card</label>
                        <select
                          value={homepageCmsForm.categories?.hoverEffect || 'lift'}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, hoverEffect: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 font-medium"
                        >
                          <option value="none">none (Tanpa Efek)</option>
                          <option value="scale">scale (Perbesar)</option>
                          <option value="lift">lift (Terangkat)</option>
                          <option value="glow">glow (Cahaya)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Opsi Kartu Kategori */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-3">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs">OPSI KARTU KATEGORI</h5>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={homepageCmsForm.categories?.showCategoryDescription ?? true}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, showCategoryDescription: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        />
                        Tampilkan Deskripsi Kategori
                      </label>
                    </div>
                  </div>

                  {/* Tombol Lihat Semua */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs">TOMBOL "LIHAT SEMUA KATEGORI"</h5>
                      <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                        <input
                          type="checkbox"
                          checked={homepageCmsForm.categories?.showViewAllButton ?? true}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            categories: { ...prev.categories, showViewAllButton: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                        />
                        Tampilkan Tombol
                      </label>
                    </div>

                    {homepageCmsForm.categories?.showViewAllButton !== false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Teks Tombol</label>
                          <input
                            type="text"
                            value={homepageCmsForm.categories?.viewAllButtonText || 'Lihat Semua Kategori'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, viewAllButtonText: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-medium text-gray-800"
                            placeholder="Masukkan teks tombol, misal: Lihat Semua Kategori"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Tautan Tombol</label>
                          <input
                            type="text"
                            value={homepageCmsForm.categories?.viewAllButtonLink || '/kategori'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { ...prev.categories, viewAllButtonLink: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg font-mono text-gray-800"
                            placeholder="/kategori"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kelola Individual Items Kategori */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/40 space-y-6">
                    <div>
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wider">Kelola Visual & Informasi Kategori Individual</h5>
                      <p className="text-[10px] text-gray-500 font-jost mt-1">
                        Atur gambar, posisi potong (crop position), zoom gambar, badge, serta deskripsi singkat untuk setiap kategori.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {categoriesForm.map((cat, index) => {
                        const imageUrl = buildStorageUrl(cat.image) || null;
                        
                        // Handle updating local fields instantly on blur/change
                        const handleUpdateField = (field, value) => {
                          const updated = categoriesForm.map((c, i) => {
                            if (i === index) {
                              return { ...c, [field]: value };
                            }
                            return c;
                          });
                          setCategoriesForm(updated);
                        };

                        // Hidden file upload handler
                        const handleFileUpload = async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            onAddToast('Mengunggah gambar kategori ke Supabase Storage...', 'info');
                            const res = await uploadFileToSupabase(file, 'categories', `category_${cat.slug || index}.jpg`);
                            if (res.success && res.url) {
                              handleUpdateField('image', res.url);
                              onAddToast(`Gambar Kategori "${cat.name}" berhasil diperbarui!`, 'success');
                            } else {
                              onAddToast(res.error || 'Gagal mengunggah gambar kategori', 'error');
                            }
                          }
                        };

                        return (
                          <div key={cat.id || cat.name} className="p-4 bg-white border border-gray-200/60 rounded-xl shadow-xs flex flex-col md:flex-row gap-5">
                            {/* 1. Preview Card Kecil */}
                            <div className="w-[140px] shrink-0 mx-auto md:mx-0">
                              <div className="text-[8px] font-jost font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center md:text-left">Preview Card</div>
                              <div className="h-[210px] w-[130px] rounded-lg border border-gray-100 overflow-hidden flex flex-col justify-between shadow-xs bg-white text-left mx-auto">
                                {/* Top Image Frame */}
                                <div className="h-[120px] w-full relative bg-gray-50 overflow-hidden shrink-0">
                                  {cat.metaTitle && (
                                    <span className="absolute top-1.5 left-1.5 z-20 text-[7px] font-bold text-[#174C3C] tracking-wide uppercase">
                                      {cat.metaTitle}
                                    </span>
                                  )}
                                  <div className="w-full h-full overflow-hidden">
                                    <img
                                      src={imageUrl || null}
                                      alt={cat.name}
                                      style={{
                                        objectPosition: cat.cropPosition || 'center center',
                                        transform: `scale(${parseFloat(cat.cropZoom || '100') / 100})`
                                      }}
                                      className="w-full h-full object-cover select-none pointer-events-none origin-center"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />
                                </div>
                                
                                {/* Bottom Content Frame */}
                                <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                                  <div className="space-y-0.5">
                                    <h6 className="text-[10px] font-semibold text-[#174C3C] tracking-tight line-clamp-1">
                                      {cat.name}
                                    </h6>
                                    {cat.description && (
                                      <p className="text-[8px] text-gray-400 font-normal leading-tight line-clamp-2">
                                        {cat.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-[#174C3C] font-semibold text-[8px] tracking-wide mt-1 flex items-center">
                                    <span>Lihat Kategori</span>
                                    <span className="ml-0.5">→</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Form Inputs */}
                            <div className="flex-1 space-y-3.5 bg-white text-left">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                <span className="font-jost font-bold text-xs text-[#174C3C]">{cat.name}</span>
                                <span className={`text-[8px] font-mono font-bold uppercase ${
                                  cat.status !== 'Nonaktif' ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {cat.status !== 'Nonaktif' ? '🟢 Aktif' : '⚫ Nonaktif'}
                                </span>
                              </div>

                              {/* URL Gambar & File Upload */}
                              <div className="space-y-1">
                                <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Gambar Kategori</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={cat.image || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], image: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('image', e.target.value)}
                                    className="flex-1 text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg font-mono text-gray-800"
                                    placeholder="Masukkan URL gambar kategori..."
                                  />
                                  <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                    UPLOAD
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleFileUpload}
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Badge kategori */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Badge Kategori</label>
                                  <input
                                    type="text"
                                    value={cat.metaTitle || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], metaTitle: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('metaTitle', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-800"
                                    placeholder="Masukkan badge, misal: Populer, Segar..."
                                  />
                                </div>

                                {/* Crop position */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Fokus Potong (Crop Position)</label>
                                  <select
                                    value={cat.cropPosition || 'center center'}
                                    onChange={(e) => handleUpdateField('cropPosition', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer text-gray-700 h-8"
                                  >
                                    <option value="left center">Kiri (left center)</option>
                                    <option value="center center">Tengah (center center)</option>
                                    <option value="right center">Kanan (right center)</option>
                                    <option value="center top">Atas (center top)</option>
                                    <option value="center bottom">Bawah (center bottom)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Deskripsi singkat */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Deskripsi Singkat</label>
                                  <input
                                    type="text"
                                    value={cat.description || ''}
                                    onChange={(e) => {
                                      const updated = [...categoriesForm];
                                      updated[index] = { ...updated[index], description: e.target.value };
                                      setCategoriesForm(updated);
                                    }}
                                    onBlur={(e) => handleUpdateField('description', e.target.value)}
                                    className="w-full text-[11px] p-2 bg-white border border-gray-200 outline-none rounded-lg text-gray-800"
                                    placeholder="Tulis deskripsi singkat kategori..."
                                  />
                                </div>

                                {/* Crop zoom */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Crop Zoom: <span className="text-brand-green font-bold font-mono">{cat.cropZoom || '100'}%</span></label>
                                  <div className="flex items-center gap-2 h-8 bg-white border border-gray-200 px-2 rounded-lg">
                                    <span className="text-[9px] text-gray-400 font-mono">100%</span>
                                    <input
                                      type="range"
                                      min="100"
                                      max="180"
                                      step="5"
                                      value={cat.cropZoom || '100'}
                                      onChange={(e) => handleUpdateField('cropZoom', e.target.value)}
                                      className="flex-1 accent-[#12372A] h-1 bg-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-[9px] text-gray-400 font-mono">180%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <Categories cms={{ ...homepageCmsForm.categories, show: true }} categories={categoriesForm} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Kategori',
                          itemName: 'Bagian Kategori',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Kategori saja ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              categories: { 
                                show: true, 
                                badge: "PILIHAN KATEGORI", 
                                title: "Temukan Hasil Bumi untuk Setiap Kebutuhan", 
                                description: "Dipilih langsung dari petani lokal Bangka dengan kualitas terbaik untuk kebutuhan sehari-hari Anda.", 
                                limit: 5, 
                                showCategoryDescription: true, 
                                showViewAllButton: true, 
                                viewAllButtonText: "Lihat Semua Kategori", 
                                viewAllButtonLink: "/kategori" 
                              }
                            }));
                            onAddToast('Bagian Kategori diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Kategori ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PRODUK TAB */}
            {activeSubTab === 'featuredProducts' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Bagian Rekomendasi / Produk Terpopuler</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.featuredProducts?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        featuredProducts: { ...prev.featuredProducts, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                    />
                    Tampilkan Section Produk
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                  {/* SECTION 1: KONTEN */}
                  <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                    <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">Pengaturan Konten</h5>
                    
                    <div className="space-y-1">
                      <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Judul Kecil (Badge)</label>
                      <input
                        type="text"
                        value={homepageCmsForm.featuredProducts?.badge || ''}
                        onChange={(e) => setHomepageCmsForm(prev => ({
                          ...prev,
                          featuredProducts: { ...prev.featuredProducts, badge: e.target.value }
                        }))}
                        className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                        placeholder="Masukkan judul kecil, misal: REKOMENDASI TERPOPULER"
                      />
                    </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Judul Utama</label>
                        <input
                          type="text"
                          value={homepageCmsForm.featuredProducts?.title || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            featuredProducts: { ...prev.featuredProducts, title: e.target.value }
                          }))}
                          className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          placeholder="Masukkan judul utama, misal: Produk Unggulan Hasil Bumi"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Deskripsi</label>
                        <textarea
                          rows={2}
                          value={homepageCmsForm.featuredProducts?.description || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            featuredProducts: { ...prev.featuredProducts, description: e.target.value }
                          }))}
                          className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          placeholder="Tulis deskripsi singkat untuk section produk…"
                        />
                      </div>
                    </div>

                    {/* SECTION 2: LATAR BELAKANG */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">02. Latar Belakang (Background)</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.featuredProducts?.background?.startsWith('#') ? homepageCmsForm.featuredProducts.background : '#F7F8F5'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.background || '#F7F8F5'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="#ECF6ED atau bg-white..."
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Gambar Latar Belakang (URL)</label>
                          <input
                            type="text"
                            value={homepageCmsForm.featuredProducts?.backgroundImage || ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, backgroundImage: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px]"
                            placeholder="URL gambar atau kosongi..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: LAYOUT */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">03. Layout & Padding</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Limit Produk Tampil (1-20)</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={homepageCmsForm.featuredProducts?.limit ?? 12}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, limit: Math.max(1, Math.min(20, parseInt(e.target.value) || 12)) }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Spasi Vertikal (Padding Y)</label>
                          <select
                            value={homepageCmsForm.featuredProducts?.paddingY || 'py-16'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, paddingY: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 bg-[image:none]"
                          >
                            <option value="py-8">py-8 (Lebih Rapat)</option>
                            <option value="py-12">py-12 (Sedang)</option>
                            <option value="py-16">py-16 (Standar)</option>
                            <option value="py-20">py-20 (Lebar)</option>
                            <option value="py-24">py-24 (Sangat Lebar)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: HOVER & SLIDER */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">04. Efek Hover & Pengaturan Slider</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Efek Hover Kartu</label>
                          <select
                            value={homepageCmsForm.featuredProducts?.hoverEffect || 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 bg-[image:none]"
                          >
                            <option value="none">Tanpa Efek (none)</option>
                            <option value="scale">Perbesar Sedikit (scale)</option>
                            <option value="lift">Melayang ke Atas (lift)</option>
                            <option value="glow">Efek Berpendar (glow)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Autoplay Interval</label>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[9px] font-mono text-gray-400 shrink-0">3s</span>
                            <input
                              type="range"
                              min="3000"
                              max="10000"
                              step="500"
                              value={homepageCmsForm.featuredProducts?.autoplaySpeed ?? 6000}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, autoplaySpeed: parseInt(e.target.value) }
                              }))}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              disabled={!(homepageCmsForm.featuredProducts?.autoplay ?? true)}
                            />
                            <span className="text-[9px] font-mono text-gray-400 shrink-0">10s</span>
                            <span className="text-[10px] font-mono text-brand-green font-bold shrink-0">({(homepageCmsForm.featuredProducts?.autoplaySpeed ?? 6000) / 1000}s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.autoplay ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, autoplay: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Aktifkan Autoplay
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showProgress ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showProgress: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Progress Indicator
                        </label>
                      </div>

                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showArrows ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showArrows: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Panah Navigasi
                        </label>
                      </div>
                    </div>

                    {/* SECTION 5: KARTU PRODUK */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">05. Elemen Kartu Produk</h5>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showCategory ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showCategory: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Kategori Produk
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showDiscountPrice ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showDiscountPrice: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Harga Diskon
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showUnit ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showUnit: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Satuan Unit (ex. PPN/kg)
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showWishlistButton ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showWishlistButton: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tombol Favorit (Heart)
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showCartButton ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showCartButton: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tombol Keranjang
                        </label>
                      </div>
                    </div>

                    {/* SECTION 6: TOMBOL CTA */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide border-b border-gray-100 pb-2">06. Tombol Aksi (CTA)</h5>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-[11px] text-gray-600 font-medium">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.featuredProducts?.showViewAllButton ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: { ...prev.featuredProducts, showViewAllButton: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Tombol Eksplorasi Utama
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Teks Tombol</label>
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.buttonText || 'Eksplorasi Katalog Lengkap'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, buttonText: e.target.value }
                              }))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg"
                              placeholder="Eksplorasi Katalog Lengkap"
                              disabled={!(homepageCmsForm.featuredProducts?.showViewAllButton ?? true)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Tautan Tombol (URL/Hash)</label>
                            <input
                              type="text"
                              value={homepageCmsForm.featuredProducts?.buttonLink || '/produk'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                featuredProducts: { ...prev.featuredProducts, buttonLink: e.target.value }
                              }))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px]"
                              placeholder="/produk atau #catalog"
                              disabled={!(homepageCmsForm.featuredProducts?.showViewAllButton ?? true)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 7: INTERACTIVE PRODUCT PRIORITY SYSTEM */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-4">
                      <div className="space-y-1 border-b border-gray-100 pb-2">
                        <h5 className="font-jost font-bold text-[#12372A] text-xs uppercase tracking-wide">07. Pilih & Urutkan Produk Unggulan</h5>
                        <p className="text-[10px] text-gray-500 font-jost leading-relaxed">
                          Daftar di bawah menampilkan semua produk dari database Anda. Centang produk untuk menambahkannya ke list **Selected Product IDs** dan **Order** di CMS. Atur urutan visual menggunakan tombol (▲/▼) secara dinamis tanpa mempengaruhi data produk master.
                        </p>
                      </div>

                      {/* Search Bar for products */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari produk sayuran..."
                          id="cms-product-search"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();
                            document.querySelectorAll('.cms-prod-item').forEach(el => {
                              const name = el.getAttribute('data-name')?.toLowerCase() || '';
                              if (name.includes(val)) {
                                el.classList.remove('hidden');
                              } else {
                                el.classList.add('hidden');
                              }
                            });
                          }}
                          className="w-full text-xs p-2.5 pl-8 bg-white border border-gray-200 outline-none rounded-lg font-jost"
                        />
                        <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
                      </div>

                      {/* Scrollable list of products */}
                      <div className="max-h-[350px] overflow-y-auto border border-gray-200/60 rounded-xl divide-y divide-gray-100 bg-white shadow-xs">
                        {products.filter(p => p.status !== 'Draft').map((p) => {
                          const selectedProductIds = homepageCmsForm.featuredProducts?.selectedProductIds || [];
                          const order = homepageCmsForm.featuredProducts?.order || [];
                          
                          // Check if featured either via CMS manually or legacy isFeatured flag
                          const isFeat = selectedProductIds.includes(p.id) || p.isFeatured;
                          
                          return (
                            <div 
                              key={p.id} 
                              data-name={p.name}
                              className="cms-prod-item p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isFeat}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    
                                    // 1. Update legacy isFeatured database state for backward compatibility
                                    const updatedProducts = products.map(prod => {
                                      if (prod.id === p.id) {
                                        return { ...prod, isFeatured: isChecked };
                                      }
                                      return prod;
                                    });
                                    onSaveProducts(updatedProducts);

                                    // 2. Update new CMS selectedProductIds and order state
                                    setHomepageCmsForm(prev => {
                                      const curFeat = prev.featuredProducts || {};
                                      let selIds = [...(curFeat.selectedProductIds || [])];
                                      let ordIds = [...(curFeat.order || [])];

                                      // Migrate legacy values to state if empty initially
                                      if (selIds.length === 0) {
                                        selIds = products.filter(prod => prod.isFeatured && prod.id !== p.id).map(prod => prod.id);
                                        ordIds = [...selIds];
                                      }

                                      if (isChecked) {
                                        if (!selIds.includes(p.id)) {
                                          selIds.push(p.id);
                                        }
                                        if (!ordIds.includes(p.id)) {
                                          ordIds.push(p.id);
                                        }
                                      } else {
                                        selIds = selIds.filter(id => id !== p.id);
                                        ordIds = ordIds.filter(id => id !== p.id);
                                      }

                                      return {
                                        ...prev,
                                        featuredProducts: {
                                          ...curFeat,
                                          selectedProductIds: selIds,
                                          order: ordIds
                                        }
                                      };
                                    });

                                    onAddToast(`Status Featured "${p.name}" berhasil diperbarui!`, 'success');
                                  }}
                                  className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                                />
                                <img 
                                  src={p.image || null} 
                                  alt={p.name} 
                                  className="w-10 h-10 object-cover rounded-md border border-gray-100 shrink-0" 
                                />
                                <div className="text-left leading-tight">
                                  <span className="font-jost text-xs font-semibold text-[#12372A] block leading-tight">{p.name}</span>
                                  <span className="font-jost text-[9px] text-gray-400 uppercase tracking-wider block mt-0.5">
                                    {p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || 'Hasil Panen'} • {formatRupiah(p.price)}
                                  </span>
                                </div>
                              </div>

                              {/* Sorting Up / Down buttons */}
                              {isFeat && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    title="Naikkan Urutan"
                                    onClick={() => {
                                      const curFeat = homepageCmsForm.featuredProducts || {};
                                      let ordIds = [...(curFeat.order || [])];
                                      
                                      // If order is empty, populate from isFeatured products
                                      if (ordIds.length === 0) {
                                        ordIds = products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      }
                                      // Make sure current product is in order array
                                      if (!ordIds.includes(p.id)) {
                                        ordIds.push(p.id);
                                      }

                                      const fIdx = ordIds.indexOf(p.id);
                                      if (fIdx > 0) {
                                        const temp = ordIds[fIdx];
                                        ordIds[fIdx] = ordIds[fIdx - 1];
                                        ordIds[fIdx - 1] = temp;

                                        // Update state
                                        setHomepageCmsForm(prev => ({
                                          ...prev,
                                          featuredProducts: {
                                            ...(prev.featuredProducts || {}),
                                            order: ordIds,
                                            selectedProductIds: prev.featuredProducts?.selectedProductIds?.length ? prev.featuredProducts.selectedProductIds : ordIds
                                          }
                                        }));

                                        // Optionally sort the database products too for legacy compatibility
                                        const reorderedProducts = [...products];
                                        reorderedProducts.sort((a, b) => {
                                          const idxA = ordIds.indexOf(a.id);
                                          const idxB = ordIds.indexOf(b.id);
                                          if (idxA === -1 && idxB === -1) return 0;
                                          if (idxA === -1) return 1;
                                          if (idxB === -1) return -1;
                                          return idxA - idxB;
                                        });
                                        onSaveProducts(reorderedProducts);

                                        onAddToast(`Urutan "${p.name}" berhasil dinaikkan!`, 'success');
                                      }
                                    }}
                                    disabled={(() => {
                                      const ordIds = homepageCmsForm.featuredProducts?.order || products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      return ordIds.indexOf(p.id) <= 0;
                                    })()}
                                    className="p-1 bg-white border border-gray-200 hover:border-[#12372A] disabled:opacity-30 disabled:hover:border-gray-200 text-[#12372A] rounded cursor-pointer transition-colors text-[9px] w-6 h-6 flex items-center justify-center font-bold"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    title="Turunkan Urutan"
                                    onClick={() => {
                                      const curFeat = homepageCmsForm.featuredProducts || {};
                                      let ordIds = [...(curFeat.order || [])];
                                      
                                      // If order is empty, populate from isFeatured products
                                      if (ordIds.length === 0) {
                                        ordIds = products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      }
                                      // Make sure current product is in order array
                                      if (!ordIds.includes(p.id)) {
                                        ordIds.push(p.id);
                                      }

                                      const fIdx = ordIds.indexOf(p.id);
                                      if (fIdx !== -1 && fIdx < ordIds.length - 1) {
                                        const temp = ordIds[fIdx];
                                        ordIds[fIdx] = ordIds[fIdx + 1];
                                        ordIds[fIdx + 1] = temp;

                                        // Update state
                                        setHomepageCmsForm(prev => ({
                                          ...prev,
                                          featuredProducts: {
                                            ...(prev.featuredProducts || {}),
                                            order: ordIds,
                                            selectedProductIds: prev.featuredProducts?.selectedProductIds?.length ? prev.featuredProducts.selectedProductIds : ordIds
                                          }
                                        }));

                                        // Optionally sort the database products too for legacy compatibility
                                        const reorderedProducts = [...products];
                                        reorderedProducts.sort((a, b) => {
                                          const idxA = ordIds.indexOf(a.id);
                                          const idxB = ordIds.indexOf(b.id);
                                          if (idxA === -1 && idxB === -1) return 0;
                                          if (idxA === -1) return 1;
                                          if (idxB === -1) return -1;
                                          return idxA - idxB;
                                        });
                                        onSaveProducts(reorderedProducts);

                                        onAddToast(`Urutan "${p.name}" berhasil diturunkan!`, 'success');
                                      }
                                    }}
                                    disabled={(() => {
                                      const ordIds = homepageCmsForm.featuredProducts?.order || products.filter(prod => prod.isFeatured).map(prod => prod.id);
                                      const fIdx = ordIds.indexOf(p.id);
                                      return fIdx === -1 || fIdx === ordIds.length - 1;
                                    })()}
                                    className="p-1 bg-white border border-gray-200 hover:border-[#12372A] disabled:opacity-30 disabled:hover:border-gray-200 text-[#12372A] rounded cursor-pointer transition-colors text-[9px] w-6 h-6 flex items-center justify-center font-bold"
                                  >
                                    ▼
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <FeaturedCarousel
                        products={products}
                        cms={homepageCmsForm.featuredProducts}
                        wishlist={[]}
                        onOpenProductDetail={(p) => onAddToast(`Preview Detail: ${p.name}`, 'info')}
                        onToggleWishlist={(p) => onAddToast(`Preview Wishlist: ${p.name}`, 'info')}
                        onAddToCart={(p) => onAddToast(`Preview Beli: ${p.name}`, 'success')}
                      />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Produk',
                          itemName: 'Bagian Produk Terpopuler',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Produk saja ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              featuredProducts: {
                                show: true,
                                badge: "REKOMENDASI TERPOPULER",
                                title: "Produk Unggulan Hasil Bumi",
                                description: "Koleksi hasil bumi terlaris yang langsung dipanen oleh para petani lokal Bangka.",
                                limit: 8,
                                mode: "manual"
                              }
                            }));
                            onAddToast('Bagian Produk Terpopuler diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Produk ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 07. UMKM STORY TAB */}
            {activeSubTab === 'farmer' && (() => {
              const publishedArticles = articles.filter(a => a && a.status !== 'Draft');
              const selectedIds = homepageCmsForm.farmer?.selectedArticleIds;
              const isCustomSelection = Array.isArray(selectedIds);
              
              let currentSelectedArticles = [];
              if (isCustomSelection && selectedIds.length > 0) {
                currentSelectedArticles = selectedIds
                  .map(id => articles.find(a => a && (String(a.id) === String(id) || a.slug === id)))
                  .filter(Boolean);
              } else {
                const fallbackArts = publishedArticles.filter(a => a.showOnHomepage !== false);
                currentSelectedArticles = fallbackArts.length > 0 ? fallbackArts : publishedArticles;
              }

              const filteredAvailableArticles = articles.filter(art => {
                const q = articleSearchQuery.toLowerCase();
                const matchesSearch = !q || art.title?.toLowerCase().includes(q) || art.category?.toLowerCase().includes(q) || art.excerpt?.toLowerCase().includes(q);
                const matchesCat = articleCategoryFilter === 'Semua' || art.category === articleCategoryFilter;
                return matchesSearch && matchesCat;
              });

              const categoriesList = ['Semua', ...new Set(articles.map(a => a.category).filter(Boolean))];

              return (
                <div className="space-y-6 text-left">
                  {/* HEADER SECTION & TOGGLE */}
                  <div className="border-b border-gray-200 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-sans font-bold text-[#174C3C] text-base">Bagian UMKM Story / Kisah Mitra Tani</h4>
                      <p className="text-xs text-gray-500 font-sans">Atur judul, subjudul, jumlah limit, serta seleksi artikel yang tampil pada carousel UMKM Story.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-gray-700 font-bold bg-[#FCFCFC] px-3.5 py-2 border border-[#DDE9DF] rounded-xl hover:border-[#174C3C] hover:shadow-xs transition-colors">
                      <input
                        type="checkbox"
                        checked={homepageCmsForm.farmer?.show ?? true}
                        onChange={(e) => setHomepageCmsForm(prev => ({
                          ...prev,
                          farmer: { ...prev.farmer, show: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-[#174C3C] rounded"
                      />
                      Tampilkan Section Kisah Mitra
                    </label>
                  </div>

                  {/* FORM EDITOR (TOP) */}
                  <div className="w-full space-y-6">
                      
                      {/* CARD 1: PENGATURAN TEKS SECTION */}
                      <div className="bg-white border border-[#DDE9DF] p-5 rounded-2xl shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                          <span className="p-2 bg-[#DCEFE0] text-[#174C3C] rounded-lg font-bold text-xs">A</span>
                          <div>
                            <h5 className="font-sans text-sm font-bold text-[#174C3C]">Teks & Tombol Section</h5>
                            <p className="text-[11px] text-gray-500">Judul utama, badge, dan tautan tombol ke halaman artikel.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Judul Kecil (Badge)</label>
                            <input
                              type="text"
                              value={homepageCmsForm.farmer?.badge || ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, badge: e.target.value }
                              }))}
                              placeholder="Misal: KISAH MITRA TANI"
                              className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Judul Utama Section *</label>
                            <input
                              type="text"
                              required
                              value={homepageCmsForm.farmer?.title || ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, title: e.target.value }
                              }))}
                              placeholder="Contoh: 15 Tahun Menjaga Hasil Tani Bersama Ibu Dewi"
                              className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Subjudul Section *</label>
                            <textarea
                              rows={2}
                              required
                              value={homepageCmsForm.farmer?.subtitle || ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, subtitle: e.target.value }
                              }))}
                              placeholder="Contoh: TaniCo tumbuh bersama petani lokal di Kabupaten Bangka."
                              className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans leading-relaxed"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Teks Tombol Aksi</label>
                            <input
                              type="text"
                              value={homepageCmsForm.farmer?.buttonText || ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, buttonText: e.target.value }
                              }))}
                              placeholder="Misal: Lihat Semua Cerita"
                              className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Tautan Tombol Aksi</label>
                            <input
                              type="text"
                              value={homepageCmsForm.farmer?.buttonLink || ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, buttonLink: e.target.value }
                              }))}
                              placeholder="Misal: /artikel"
                              className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <label className="font-sans text-[10px] uppercase tracking-wider text-[#174C3C] font-bold block">Maksimal Artikel Tampil (Limit)</label>
                              <span className="text-xs font-bold text-[#174C3C] bg-[#DCEFE0] px-2.5 py-0.5 rounded-full">{homepageCmsForm.farmer?.limit ?? 4} Artikel</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              step={1}
                              value={homepageCmsForm.farmer?.limit ?? 4}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: { ...prev.farmer, limit: parseInt(e.target.value, 10) }
                              }))}
                              className="w-full accent-[#174C3C] cursor-pointer"
                            />
                            <p className="text-[10px] text-gray-500">Membatasi jumlah artikel yang dapat digeser di carousel UMKM Story.</p>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: SELEKSI ARTIKEL & URUTAN TAMPILAN */}
                      <div className="bg-white border border-[#DDE9DF] p-5 rounded-2xl shadow-2xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-[#DCEFE0] text-[#174C3C] rounded-lg font-bold text-xs">B</span>
                            <div>
                              <h5 className="font-sans text-sm font-bold text-[#174C3C]">Seleksi Artikel & Urutan Tampilan</h5>
                              <p className="text-[11px] text-gray-500">Pilih dan atur urutan artikel yang tampil di homepage.</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#174C3C] bg-[#DCEFE0] px-2.5 py-1 rounded-full">
                              {isCustomSelection ? `Manual (${currentSelectedArticles.length} Dipilih)` : `Default (Semua Homepage = Ya)`}
                            </span>
                          </div>
                        </div>

                        {/* ACTION TOOLBAR */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FCFCFC] p-3 border border-[#DDE9DF] rounded-xl">
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={articleSearchQuery}
                              onChange={(e) => setArticleSearchQuery(e.target.value)}
                              placeholder="Cari artikel berdasarkan judul..."
                              className="w-full text-xs px-3 py-1.5 bg-white text-[#202020] border border-[#DDE9DF] rounded-lg outline-none focus:border-[#174C3C]"
                            />
                            <select
                              value={articleCategoryFilter}
                              onChange={(e) => setArticleCategoryFilter(e.target.value)}
                              className="text-xs px-2.5 py-1.5 bg-white text-[#202020] border border-[#DDE9DF] rounded-lg outline-none focus:border-[#174C3C]"
                            >
                              {categoriesList.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectAllArticles(publishedArticles)}
                              className="px-2.5 py-1 bg-white border border-[#DDE9DF] hover:bg-[#DCEFE0] text-[#174C3C] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Pilih seluruh artikel yang sudah diterbitkan"
                            >
                              ✓ Pilih Semua
                            </button>
                            <button
                              type="button"
                              onClick={handleClearSelectedArticles}
                              className="px-2.5 py-1 bg-white border border-[#DDE9DF] hover:bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Kosongkan seluruh pilihan artikel"
                            >
                              ✕ Kosongkan
                            </button>
                            <button
                              type="button"
                              onClick={handleResetToDefaultArticles}
                              className="px-2.5 py-1 bg-white border border-[#DDE9DF] hover:bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Gunakan logika otomatis (artikel dengan showOnHomepage = true)"
                            >
                              ↺ Mode Default
                            </button>
                          </div>
                        </div>

                        {/* SUBSECTION B1: DAFTAR ARTIKEL TERPILIH (DRAG & DROP REORDERING) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-[#174C3C] uppercase tracking-wider">
                              1. Artikel Terpilih ({currentSelectedArticles.length}) - Tentukan Urutan Tampilan
                            </h6>
                            <span className="text-[10px] text-gray-400">Gunakan ⋮⋮ atau tombol Panah untuk reorder</span>
                          </div>

                          {!isCustomSelection && (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                              <strong>💡 Mode Default Aktif:</strong> Artikel ditampilkan secara otomatis berdasarkan status centang <code>Tampilkan di Carousel UmkmStory Homepage</code> pada masing-masing artikel. Centang artikel di bawah ini untuk mengaktifkan <strong>Urutan Manual</strong>.
                            </div>
                          )}

                          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {currentSelectedArticles.map((art, idx) => (
                              <div
                                key={art.id || idx}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                  if (!isNaN(fromIdx)) handleArticleReorder(fromIdx, idx);
                                }}
                                className="flex items-center justify-between p-3 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl hover:border-[#174C3C] transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="cursor-grab text-gray-400 hover:text-[#174C3C] text-sm font-bold select-none" title="Tarik untuk mengubah urutan">
                                    ⋮⋮
                                  </span>
                                  <span className="w-5 h-5 bg-[#174C3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                    <img src={buildStorageUrl(art.image)} alt={art.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="text-left">
                                    <h6 className="text-xs font-bold text-[#174C3C] line-clamp-1">{art.title}</h6>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                      <span className="bg-[#DCEFE0] text-[#174C3C] px-1.5 py-0.2 rounded font-bold">{art.category || 'Edukasi'}</span>
                                      <span>• {art.author || 'Tim TaniCo'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleArticleReorder(idx, idx - 1)}
                                    disabled={idx === 0}
                                    className="p-1.5 bg-white border border-[#DDE9DF] rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs cursor-pointer"
                                    title="Geser ke Atas"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleArticleReorder(idx, idx + 1)}
                                    disabled={idx === currentSelectedArticles.length - 1}
                                    className="p-1.5 bg-white border border-[#DDE9DF] rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs cursor-pointer"
                                    title="Geser ke Bawah"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectArticle(art.id)}
                                    className="p-1.5 bg-white border border-rose-200 text-rose-600 rounded-md hover:bg-rose-50 text-xs cursor-pointer"
                                    title="Hapus dari daftar terpilih"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}

                            {currentSelectedArticles.length === 0 && (
                              <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-500">
                                Belum ada artikel yang dipilih. Silakan centang artikel dari daftar di bawah.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SUBSECTION B2: PILIH DARI SELURUH DATABASE ARTIKEL */}
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          <h6 className="text-xs font-bold text-[#174C3C] uppercase tracking-wider">
                            2. Pilih Artikel dari Database ({filteredAvailableArticles.length} Ditemukan)
                          </h6>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                            {filteredAvailableArticles.map((art) => {
                              const isChecked = isCustomSelection
                                ? currentSelectedArticles.some(a => a.id === art.id)
                                : art.showOnHomepage !== false;

                              return (
                                <label
                                  key={art.id}
                                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                                    isChecked
                                      ? 'bg-[#DCEFE0]/40 border-[#174C3C] shadow-2xs'
                                      : 'bg-white border-[#DDE9DF] hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleSelectArticle(art.id)}
                                    className="mt-1 w-4 h-4 accent-[#174C3C] rounded shrink-0 cursor-pointer"
                                  />
                                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200 mt-0.5">
                                    <img src={buildStorageUrl(art.image)} alt={art.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h6 className="text-xs font-bold text-[#174C3C] line-clamp-1">{art.title}</h6>
                                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{art.excerpt}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      <span className="text-[9px] bg-white border border-[#DDE9DF] px-1.5 py-0.2 rounded font-bold text-gray-600">
                                        {art.category || 'Edukasi'}
                                      </span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        art.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {art.status || 'Published'}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                  <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                          Pratinjau Live Website
                        </h5>
                        <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                      </div>

                      {/* Responsive Device Switcher */}
                      <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('tablet')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Tablet (768px)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Mobile (375px)
                        </button>
                      </div>
                    </div>

                    {/* LIVE PREVIEW FRAME */}
                    <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                      <div className={`transition-all duration-300 mx-auto w-full ${
                        previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                        previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                      }`}>
                        <UmkmStory cms={homepageCmsForm.farmer} />
                      </div>
                    </div>

                    {/* ACTIONS BAR CONTAINER */}
                    <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModalConfig({
                            title: 'Reset Section UMKM Story',
                            itemName: 'Bagian UMKM Story',
                            itemType: 'section',
                            message: 'Apakah Anda yakin ingin menyetel ulang bagian UMKM Story saja ke setelan bawaan (default)?',
                            onConfirm: () => {
                              setHomepageCmsForm(prev => ({
                                ...prev,
                                farmer: {
                                  show: true,
                                  badge: "KISAH PETANI LOKAL",
                                  title: "Perjalanan Hasil Bumi dari Ladang ke Meja Anda",
                                  description: "Mengenal lebih dekat para sosok petani hebat di balik kualitas terbaik bahan pangan pilihan.",
                                  limit: 6
                                }
                              }));
                              onAddToast('Bagian UMKM Story diatur ulang ke default bawaan!', 'info');
                            }
                          });
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                      >
                        Reset UMKM Story ke Default
                      </button>
                      <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                        Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MITRA & KEMITRAAN TAB */}
            {activeSubTab === 'partners' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Editor Section Mitra & Kemitraan</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold select-none">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.partners?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        partners: { ...prev.partners, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                    Tampilkan Section Mitra
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                    
                    {/* A. INFORMASI SECTION */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">A. Informasi Section</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Badge</label>
                          <input
                            type="text"
                            value={homepageCmsForm.partners?.badge ?? ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, badge: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                            placeholder="Masukkan badge, misal: JARINGAN KEMITRAAN"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul *</label>
                          <input
                            type="text"
                            required
                            value={homepageCmsForm.partners?.title ?? ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, title: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                            placeholder="Masukkan judul utama, misal: Mitra Tani & Lembaga Pendukung"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi</label>
                          <textarea
                            rows={2}
                            value={homepageCmsForm.partners?.description ?? ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, description: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                            placeholder="Tulis deskripsi singkat tentang kemitraan…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* B. LATAR BELAKANG */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">B. Latar Belakang (Background)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.partners?.background?.startsWith('#') ? homepageCmsForm.partners.background : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                partners: { ...prev.partners, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.partners?.background ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                partners: { ...prev.partners, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Gambar Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={homepageCmsForm.partners?.backgroundImage ?? ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                partners: { ...prev.partners, backgroundImage: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                              placeholder="URL gambar background (opsional)"
                            />
                            <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                              UPLOAD
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    onAddToast('Mengunggah background partner ke Supabase Storage...', 'info');
                                    const res = await uploadFileToSupabase(file, 'partners');
                                    if (res.success && res.url) {
                                      setHomepageCmsForm(prev => ({
                                        ...prev,
                                        partners: { ...prev.partners, backgroundImage: res.url }
                                      }));
                                      onAddToast('Gambar background berhasil diunggah ke Supabase!', 'success');
                                    } else {
                                      onAddToast(res.error || 'Gagal mengunggah background partner', 'error');
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. LAYOUT */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">C. Tata Letak (Layout)</div>
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Padding Y (Spasi Vertikal)</label>
                        <select
                          value={homepageCmsForm.partners?.paddingY ?? 'py-16'}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            partners: { ...prev.partners, paddingY: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                        >
                          <option value="py-8">py-8 (Sangat Rapat)</option>
                          <option value="py-12">py-12</option>
                          <option value="py-16">py-16 (Sedang)</option>
                          <option value="py-20">py-20</option>
                          <option value="py-24">py-24 (Sangat Lapang)</option>
                        </select>
                      </div>
                    </div>

                    {/* D. CAROUSEL & MARQUEE SETTINGS */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">D. Pengaturan Carousel & Marquee</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Autoplay */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Putar Otomatis (Autoplay)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.partners?.autoplay ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                partners: { ...prev.partners, autoplay: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4"
                            />
                            Aktifkan Autoplay
                          </label>
                        </div>

                        {/* Pause on Hover */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Jeda saat Hover (Pause on Hover)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.partners?.pauseOnHover ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                partners: { ...prev.partners, pauseOnHover: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4"
                            />
                            Jeda saat Diarahkan Kursor
                          </label>
                        </div>

                        {/* Kecepatan Carousel */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">
                            Kecepatan (Durasi Putar): <span className="text-brand-green font-mono font-bold">{homepageCmsForm.partners?.speed ?? homepageCmsForm.partners?.marqueeSpeed ?? 35}s</span>
                          </label>
                          <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                            <span className="text-[10px] text-gray-400 font-mono">10s</span>
                            <input
                              type="range"
                              min="10"
                              max="60"
                              step="1"
                              value={homepageCmsForm.partners?.speed ?? homepageCmsForm.partners?.marqueeSpeed ?? 35}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setHomepageCmsForm(prev => ({
                                  ...prev,
                                  partners: { ...prev.partners, speed: val, marqueeSpeed: val }
                                }));
                              }}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-400 font-mono">60s</span>
                          </div>
                        </div>

                        {/* Jarak Antar Logo (Gap) */}
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">
                            Jarak Antar-Logo (Gap): <span className="text-brand-green font-mono font-bold">{homepageCmsForm.partners?.gap ?? 24}px</span>
                          </label>
                          <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                            <span className="text-[10px] text-gray-400 font-mono">12px</span>
                            <input
                              type="range"
                              min="12"
                              max="80"
                              step="4"
                              value={homepageCmsForm.partners?.gap ?? 24}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setHomepageCmsForm(prev => ({
                                  ...prev,
                                  partners: { ...prev.partners, gap: val }
                                }));
                              }}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-400 font-mono">80px</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* E & F. HOVER EFFECT & FADE WIDTH */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">E & F. Efek Hover & Lebar Gradien</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Efek Hover</label>
                          <select
                            value={homepageCmsForm.partners?.hoverEffect ?? 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">none (Tanpa Efek)</option>
                            <option value="lift">lift (Terangkat)</option>
                            <option value="scale">scale (Perbesar)</option>
                            <option value="glow">glow (Cahaya)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Lebar Gradien Samping (Fade Width)</label>
                          <select
                            value={homepageCmsForm.partners?.fadeWidth ?? 'medium'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, fadeWidth: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="small">small (Sempit)</option>
                            <option value="medium">medium (Sedang)</option>
                            <option value="large">large (Lebar)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* G. EMPTY STATE */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">G. Kondisi Kosong (Empty State)</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Empty State</label>
                          <input
                            type="text"
                            value={homepageCmsForm.partners?.emptyTitle ?? ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, emptyTitle: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                            placeholder="Misal: Belum Ada Mitra Resmi"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi Empty State</label>
                          <textarea
                            rows={2}
                            value={homepageCmsForm.partners?.emptyDescription ?? ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { ...prev.partners, emptyDescription: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                            placeholder="Tulis pesan saat tidak ada mitra…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* H. DAFTAR MITRA */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest">H. Daftar Mitra & Kemitraan (Gunakan handles atau drag card untuk reorder)</div>
                        <button
                          type="button"
                          onClick={() => setHomepageCmsForm(prev => {
                            const list = [...(prev.partners?.list || [])];
                            const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `partner_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                            const newItem = {
                              id: newId,
                              name: 'Mitra Baru',
                              location: 'Indonesia',
                              description: 'Deskripsi mitra baru.',
                              desc: 'Deskripsi mitra baru.',
                              logo: '',
                              image: '',
                              website: '#',
                              url: '#',
                              active: true,
                              order: list.length + 1
                            };
                            list.push(newItem);
                            const logos = [...(prev.partners?.logos || [])];
                            logos.push(newItem);
                            return {
                              ...prev,
                              partners: { ...prev.partners, list, logos }
                            };
                          })}
                          className="px-3 py-1 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest rounded-lg font-bold cursor-pointer transition-colors duration-200"
                        >
                          + TAMBAH MITRA
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(homepageCmsForm.partners?.list || []).map((partner, index) => {
                          const partnerId = partner.id || ('legacy-' + index);
                          const pName = partner.name || '';
                          const pLocation = partner.location || '';
                          const pDescription = partner.description ?? partner.desc ?? '';
                          const pLogo = partner.logo || partner.image || '';
                          const pWebsite = partner.website ?? partner.url ?? '';
                          const pActive = partner.active ?? true;

                          const isNameValid = pName.trim().length >= 3;
                          const isDescValid = pDescription.length <= 150;

                          return (
                            <div
                              key={partnerId}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', index.toString());
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                handlePartnerReorder(fromIdx, index);
                              }}
                              className="p-4 border border-gray-200 rounded-xl bg-white space-y-3 shadow-xs relative hover:border-[#12372A]/40 transition-colors"
                            >
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2">
                                  {/* Drag Handle Icon */}
                                  <div className="text-gray-400 cursor-grab hover:text-[#12372A] select-none font-bold mr-1" title="Geser untuk mengubah urutan">
                                    ⋮⋮
                                  </div>
                                  <span className="font-jost text-[10px] font-bold text-brand-green">Mitra #{index + 1}</span>
                                  <span className={`text-[9px] font-bold font-jost uppercase tracking-wider ${pActive ? 'text-green-700' : 'text-gray-500'}`}>
                                    {pActive ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handlePartnerReorder(index, index - 1)}
                                    className="p-1 text-gray-400 hover:text-brand-green disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                                    title="Pindahkan ke Atas"
                                  >
                                    ▲
                                  </button>
                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={index === (homepageCmsForm.partners?.list || []).length - 1}
                                    onClick={() => handlePartnerReorder(index, index + 1)}
                                    className="p-1 text-gray-400 hover:text-brand-green disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                                    title="Pindahkan ke Bawah"
                                  >
                                    ▼
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmModalConfig({
                                        title: "Hapus Mitra",
                                        itemName: pName || "Tanpa Nama",
                                        itemType: "mitra",
                                        onConfirm: () => {
                                          setHomepageCmsForm(prev => {
                                            const list = (prev.partners?.list || []).filter((_, i) => i !== index);
                                            const logos = (prev.partners?.logos || []).filter((_, i) => i !== index);
                                            return { ...prev, partners: { ...prev.partners, list, logos } };
                                          });
                                          onAddToast('Mitra berhasil dihapus!', 'info');
                                         }
                                       });
                                     }}
                                    className="p-1 text-red-500 hover:text-red-700 ml-1 font-bold text-xs cursor-pointer"
                                    title="Hapus Mitra"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Nama Mitra *</label>
                                  <input
                                    type="text"
                                    required
                                    value={pName}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.partners?.list || [])];
                                      list[index] = { ...list[index], name: e.target.value };
                                      const logos = [...(prev.partners?.logos || [])];
                                      if (logos[index]) {
                                        logos[index] = { ...logos[index], name: e.target.value };
                                      }
                                      return { ...prev, partners: { ...prev.partners, list, logos } };
                                    })}
                                    className={`w-full text-xs p-2.5 bg-white border outline-none rounded-lg ${isNameValid ? 'border-gray-200 focus:border-[#12372A]' : 'border-red-300 focus:border-red-500'}`}
                                    placeholder="Masukkan nama mitra…"
                                  />
                                  {!isNameValid && (
                                    <span className="text-[8px] text-red-500 block font-jost">Nama mitra minimal harus 3 karakter.</span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Asal / Wilayah</label>
                                  <input
                                    type="text"
                                    value={pLocation}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.partners?.list || [])];
                                      list[index] = { ...list[index], location: e.target.value };
                                      const logos = [...(prev.partners?.logos || [])];
                                      if (logos[index]) {
                                        logos[index] = { ...logos[index], location: e.target.value };
                                      }
                                      return { ...prev, partners: { ...prev.partners, list, logos } };
                                    })}
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                                    placeholder="Contoh: Pemali, Bangka"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Deskripsi Singkat (Max 150 Karakter)</label>
                                  <input
                                    type="text"
                                    value={pDescription}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.partners?.list || [])];
                                      list[index] = { 
                                        ...list[index], 
                                        description: e.target.value,
                                        desc: e.target.value 
                                      };
                                      const logos = [...(prev.partners?.logos || [])];
                                      if (logos[index]) {
                                        logos[index] = { 
                                          ...logos[index], 
                                          description: e.target.value,
                                          desc: e.target.value 
                                        };
                                      }
                                      return { ...prev, partners: { ...prev.partners, list, logos } };
                                    })}
                                    className={`w-full text-xs p-2.5 bg-white border outline-none rounded-lg ${isDescValid ? 'border-gray-200 focus:border-[#12372A]' : 'border-red-300 focus:border-red-500'}`}
                                    placeholder="Misal: Kelompok Petani Padi Organik"
                                  />
                                  <div className="flex justify-between items-center text-[8px] mt-0.5 font-jost">
                                    <span className={isDescValid ? "text-gray-400" : "text-red-500"}>
                                      Maksimal 150 karakter.
                                    </span>
                                    <span className={pDescription.length > 150 ? "text-red-500 font-bold" : "text-gray-400"}>
                                      {pDescription.length}/150
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Tautan Website (URL)</label>
                                  <input
                                    type="text"
                                    value={pWebsite}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.partners?.list || [])];
                                      list[index] = { 
                                        ...list[index], 
                                        website: e.target.value,
                                        url: e.target.value 
                                      };
                                      const logos = [...(prev.partners?.logos || [])];
                                      if (logos[index]) {
                                        logos[index] = { 
                                          ...logos[index], 
                                          website: e.target.value,
                                          url: e.target.value 
                                        };
                                      }
                                      return { ...prev, partners: { ...prev.partners, list, logos } };
                                    })}
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                                    placeholder="https://example.com"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Partner Logo */}
                                <div className="space-y-1.5 text-left">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Logo Mitra</label>
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-12 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-1 shrink-0">
                                      {pLogo ? (
                                        <img src={buildStorageUrl(pLogo)} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                                      ) : (
                                        <span className="text-[8px] text-gray-400 uppercase tracking-widest text-center font-jost">NO LOGO</span>
                                      )}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        type="text"
                                        value={pLogo}
                                        onChange={(e) => setHomepageCmsForm(prev => {
                                          const list = [...(prev.partners?.list || [])];
                                          list[index] = { ...list[index], logo: e.target.value, image: e.target.value };
                                          const logos = [...(prev.partners?.logos || [])];
                                          if (logos[index]) {
                                            logos[index] = { ...logos[index], logo: e.target.value, image: e.target.value };
                                          }
                                          return { ...prev, partners: { ...prev.partners, list, logos } };
                                        })}
                                        className="flex-1 text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                                        placeholder="URL logo..."
                                      />
                                      <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                        UPLOAD
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handlePartnerLogoChange(e, index)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Kemitraan checkbox */}
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold font-jost">Status Keaktifan</label>
                                  <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg mt-1.5 select-none focus-within:border-[#12372A]">
                                    <input
                                      type="checkbox"
                                      checked={pActive}
                                      onChange={(e) => setHomepageCmsForm(prev => {
                                        const list = [...(prev.partners?.list || [])];
                                        list[index] = { ...list[index], active: e.target.checked };
                                        const logos = [...(prev.partners?.logos || [])];
                                        if (logos[index]) {
                                          logos[index] = { ...logos[index], active: e.target.checked };
                                        }
                                        return { ...prev, partners: { ...prev.partners, list, logos } };
                                      })}
                                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                                    />
                                    Mitra Aktif
                                  </label>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {(homepageCmsForm.partners?.list || []).length === 0 && (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                            <p className="text-xs text-gray-400 font-jost">Belum ada partner yang didaftarkan. Klik "+ Tambah Mitra" untuk memulai.</p>
                          </div>
                        )}
                      </div>
                    </div>
                </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <PartnersCarousel cms={homepageCmsForm.partners} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Mitra',
                          itemName: 'Bagian Mitra',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Mitra ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              partners: { list: [], logos: [] }
                            }));
                            onAddToast('Bagian Mitra diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Mitra ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GALERI TAB */}
            {activeSubTab === 'gallery' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Bagian Galeri Foto Lanskap</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.gallery?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        gallery: { ...prev.gallery, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                    />
                    Tampilkan Section Galeri
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                  {/* A. INFORMASI SECTION */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                    <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">A. Informasi Section</div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Kecil (Badge) *</label>
                        <input
                          type="text"
                          required
                          value={homepageCmsForm.gallery?.badge || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, badge: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan badge, misal: GALERI TANI"
                        />
                      </div>
                    </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Utama *</label>
                        <input
                          type="text"
                          required
                          value={homepageCmsForm.gallery?.title || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, title: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan judul utama, misal: Dokumentasi Kebun & Aktivitas"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi</label>
                        <textarea
                          rows={2}
                          value={homepageCmsForm.gallery?.description || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            gallery: { ...prev.gallery, description: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                          placeholder="Tulis deskripsi singkat galeri…"
                        />
                      </div>
                    </div>

                    {/* B. LATAR BELAKANG */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">B. Latar Belakang (Background)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.background?.startsWith('#') ? homepageCmsForm.gallery.background : '#F4F8F4'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.background ?? '#F4F8F4'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#F4F8F4"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Gambar Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.backgroundImage ?? ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, backgroundImage: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                              placeholder="URL gambar background (opsional)"
                            />
                            <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                              UPLOAD
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    onAddToast('Mengunggah background galeri ke Supabase Storage...', 'info');
                                    const res = await uploadFileToSupabase(file, 'gallery');
                                    if (res.success && res.url) {
                                      setHomepageCmsForm(prev => ({
                                        ...prev,
                                        gallery: { ...prev.gallery, backgroundImage: res.url }
                                      }));
                                      onAddToast('Gambar background galeri berhasil diunggah ke Supabase!', 'success');
                                    } else {
                                      onAddToast(res.error || 'Gagal mengunggah background galeri', 'error');
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. LAYOUT */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">C. Tata Letak (Layout)</div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Limit Gambar Tampil (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={homepageCmsForm.gallery?.limit ?? 6}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, limit: parseInt(e.target.value, 10) || 6 }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Padding Y (Spasi Vertikal)</label>
                          <select
                            value={homepageCmsForm.gallery?.paddingY ?? 'py-16'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, paddingY: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="py-8">py-8 (Sangat Rapat)</option>
                            <option value="py-12">py-12</option>
                            <option value="py-16">py-16 (Sedang)</option>
                            <option value="py-20">py-20</option>
                            <option value="py-24">py-24 (Sangat Lapang)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Efek Hover Kartu</label>
                          <select
                            value={homepageCmsForm.gallery?.hoverEffect ?? 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">none (Tanpa Efek)</option>
                            <option value="lift">lift (Terangkat)</option>
                            <option value="scale">scale (Perbesar)</option>
                            <option value="glow">glow (Cahaya)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Gaya Kartu (Card Style)</label>
                          <select
                            value={homepageCmsForm.gallery?.cardStyle ?? 'modern'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, cardStyle: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="classic">Classic (Tradisional)</option>
                            <option value="modern">Modern (Bersih & Tipis)</option>
                            <option value="minimalist">Minimalist (Tanpa Batas)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Bayangan Kartu (Card Shadow)</label>
                          <select
                            value={homepageCmsForm.gallery?.cardShadow ?? 'soft'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { ...prev.gallery, cardShadow: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">None (Tanpa Bayangan)</option>
                            <option value="sm">sm (Tipis)</option>
                            <option value="soft">soft (Sangat Lembut)</option>
                            <option value="lg">lg (Tegas)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* D. CARD COLORS */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">D. Tampilan Kartu (Card Colors)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Latar Belakang Kartu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.cardBackground?.startsWith('#') ? homepageCmsForm.gallery.cardBackground : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBackground: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.cardBackground ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBackground: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Batas (Border) Kartu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.gallery?.cardBorder?.startsWith('#') ? homepageCmsForm.gallery.cardBorder : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBorder: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.gallery?.cardBorder ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, cardBorder: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* E. TOGGLES */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">E. Fitur & Interaksi (Toggles)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold font-jost">Efek Pijar (Glow Effect)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg mt-1 select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.gallery?.showGlow ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, showGlow: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                            />
                            Aktifkan Efek Glow Kartu
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold font-jost">Pop-up Gambar (Lightbox)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg mt-1 select-none focus-within:border-[#12372A]">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.gallery?.showLightbox ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                gallery: { ...prev.gallery, showLightbox: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                            />
                            Aktifkan Fitur Lightbox
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* GALERI ITEM MANAGEMENT REMINDER */}
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 space-y-1.5">
                      <p className="font-jost font-bold uppercase tracking-wider text-[10px]">💡 Manajemen Koleksi Foto Galeri</p>
                      <p className="text-[11px] leading-relaxed text-emerald-700/90 font-jost">
                        Formulir di atas berfungsi untuk mengatur estetika visual section (judul, latar belakang, efek, limit, dll). Untuk menambah, mengubah deskripsi, atau menghapus foto-foto spesifik dari database Galeri, silakan gunakan menu **Gallery Management** pada sidebar admin kiri.
                      </p>
                    </div>
                  </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <Gallery cms={homepageCmsForm.gallery} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Galeri',
                          itemName: 'Bagian Galeri',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Galeri ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              gallery: { list: [] }
                            }));
                            onAddToast('Bagian Galeri diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Galeri ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TESTIMONI TAB */}
            {activeSubTab === 'testimonials' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <h4 className="font-jost font-bold text-[#12372A] text-sm uppercase tracking-wider">Bagian Testimoni Konsumen</h4>
                  <label className="flex items-center gap-2 cursor-pointer font-jost text-[10px] text-gray-500 font-bold">
                    <input
                      type="checkbox"
                      checked={homepageCmsForm.testimonials?.show ?? true}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        testimonials: { ...prev.testimonials, show: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                    />
                    Tampilkan Section Testimoni
                  </label>
                </div>

                {/* FORM EDITOR (TOP) */}
                <div className="w-full space-y-6">
                  {/* A. PENGATURAN UTAMA */}
                  <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                    <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">A. Pengaturan Utama</div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Kecil (Badge)</label>
                        <input
                          type="text"
                          value={homepageCmsForm.testimonials?.badge || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, badge: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan badge, misal: TESTIMONI PELANGGAN"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Utama</label>
                        <input
                          type="text"
                          value={homepageCmsForm.testimonials?.title || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, title: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          placeholder="Masukkan judul utama, misal: Apa Kata Mereka?"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi</label>
                        <textarea
                          rows={2}
                          value={homepageCmsForm.testimonials?.description || ''}
                          onChange={(e) => setHomepageCmsForm(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, description: e.target.value }
                          }))}
                          className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                          placeholder="Tulis deskripsi singkat tentang testimoni…"
                        />
                      </div>
                    </div>

                    {/* B. LATAR BELAKANG */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">B. Latar Belakang (Background)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.testimonials?.background?.startsWith('#') ? homepageCmsForm.testimonials.background : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, background: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.testimonials?.background ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, background: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Gambar Latar Belakang</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={homepageCmsForm.testimonials?.backgroundImage ?? ''}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, backgroundImage: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                              placeholder="URL gambar background (opsional)"
                            />
                            <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                              UPLOAD
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleTestimonialsBgFileChange}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* C. TATA LETAK & SLIDER */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">C. Tata Letak & Slider (Layout & Slider)</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Padding Y (Spasi Vertikal)</label>
                          <select
                            value={homepageCmsForm.testimonials?.paddingY ?? 'py-16'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, paddingY: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="py-8">py-8 (Sangat Rapat)</option>
                            <option value="py-12">py-12</option>
                            <option value="py-16">py-16 (Sedang)</option>
                            <option value="py-20">py-20</option>
                            <option value="py-24">py-24 (Sangat Lapang)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Layout Tampilan</label>
                          <select
                            value={homepageCmsForm.testimonials?.layout ?? 'carousel'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, layout: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="carousel">Carousel (Samping)</option>
                            <option value="grid">Grid (Kotak-Kotak)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Maksimal Testimoni Tampil</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={homepageCmsForm.testimonials?.maxItems ?? 6}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, maxItems: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 6)) }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Autoplay Carousel</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.testimonials?.autoplay ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, autoplay: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                              disabled={homepageCmsForm.testimonials?.layout === 'grid'}
                            />
                            Aktifkan Autoplay
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">
                            Kecepatan Autoplay: <span className="text-brand-green font-mono font-bold">{(homepageCmsForm.testimonials?.autoplaySpeed ?? 5000) / 1000}s</span>
                          </label>
                          <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                            <span className="text-[10px] text-gray-400 font-mono">3s</span>
                            <input
                              type="range"
                              min="3000"
                              max="10000"
                              step="500"
                              value={homepageCmsForm.testimonials?.autoplaySpeed ?? 5000}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, autoplaySpeed: parseInt(e.target.value, 10) }
                              }))}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              disabled={homepageCmsForm.testimonials?.layout === 'grid' || !(homepageCmsForm.testimonials?.autoplay ?? true)}
                            />
                            <span className="text-[10px] text-gray-400 font-mono">10s</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Geseran Layar Sentuh (Swipe Mobile)</label>
                          <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none">
                            <input
                              type="checkbox"
                              checked={homepageCmsForm.testimonials?.swipeEnabled ?? true}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, swipeEnabled: e.target.checked }
                              }))}
                              className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                            />
                            Aktifkan Geser (Swipe)
                          </label>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">
                            Sensitivitas Swipe: <span className="text-brand-green font-mono font-bold">{homepageCmsForm.testimonials?.swipeSensitivity ?? 50}px</span>
                          </label>
                          <div className="flex items-center gap-2 h-10 bg-white border border-gray-200 px-3 rounded-lg">
                            <span className="text-[10px] text-gray-400 font-mono">10px</span>
                            <input
                              type="range"
                              min="10"
                              max="200"
                              step="5"
                              value={homepageCmsForm.testimonials?.swipeSensitivity ?? 50}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, swipeSensitivity: parseInt(e.target.value, 10) }
                              }))}
                              className="flex-1 accent-[#12372A] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                              disabled={!(homepageCmsForm.testimonials?.swipeEnabled ?? true)}
                            />
                            <span className="text-[10px] text-gray-400 font-mono">200px</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* D. TAMPILAN ELEMEN KARTU */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">D. Tampilan Elemen Kartu</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.testimonials?.showRating ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, showRating: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Penilaian Bintang (Rating)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none">
                          <input
                            type="checkbox"
                            checked={homepageCmsForm.testimonials?.showAvatar ?? true}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, showAvatar: e.target.checked }
                            }))}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                          />
                          Tampilkan Foto Profil (Avatar)
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Gaya Kartu (Card Style)</label>
                          <select
                            value={homepageCmsForm.testimonials?.cardStyle ?? 'modern'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, cardStyle: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="modern">Modern (Sudut Bulat + Bayangan Lembut)</option>
                            <option value="minimal">Minimal (Sudut Sedikit Bulat + Border Tipis)</option>
                            <option value="glass">Glass (Kaca Transparan + Blur Latar)</option>
                            <option value="bordered">Bordered (Batas Tebal Retro)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Efek Bayangan Kartu (Card Shadow)</label>
                          <select
                            value={homepageCmsForm.testimonials?.cardShadow ?? 'soft'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, cardShadow: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">Tanpa Bayangan (None)</option>
                            <option value="soft">Sangat Lembut (Soft)</option>
                            <option value="medium">Sedang (Medium)</option>
                            <option value="strong">Tebal (Strong)</option>
                            <option value="glow">Pendaran Hijau (Glow)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Efek Interaksi Hover (Hover Effect)</label>
                          <select
                            value={homepageCmsForm.testimonials?.hoverEffect ?? 'lift'}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, hoverEffect: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer h-10 text-gray-700 focus:border-[#12372A]"
                          >
                            <option value="none">Tanpa Efek (None)</option>
                            <option value="lift">Terangkat + Bayangan (Lift)</option>
                            <option value="scale">Perbesar Sedikit (Scale)</option>
                            <option value="glow">Pendaran Hijau Saat Sentuh (Glow)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Latar Belakang Kartu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.testimonials?.cardBackground?.startsWith('#') ? homepageCmsForm.testimonials.cardBackground : '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, cardBackground: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.testimonials?.cardBackground ?? '#FFFFFF'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, cardBackground: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Warna Batas Kartu (Card Border)</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageCmsForm.testimonials?.cardBorder?.startsWith('#') ? homepageCmsForm.testimonials.cardBorder : '#E7E7E7'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, cardBorder: e.target.value }
                              }))}
                              className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0 shrink-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={homepageCmsForm.testimonials?.cardBorder ?? '#E7E7E7'}
                              onChange={(e) => setHomepageCmsForm(prev => ({
                                ...prev,
                                testimonials: { ...prev.testimonials, cardBorder: e.target.value }
                              }))}
                              className="flex-1 text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                              placeholder="#E7E7E7"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* E. KONDISI KOSONG (EMPTY STATE) */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">E. Tampilan Kondisi Kosong (Empty State)</div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Judul Pesan Kosong</label>
                          <input
                            type="text"
                            value={homepageCmsForm.testimonials?.emptyTitle || ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, emptyTitle: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                            placeholder="Misal: Belum Ada Testimoni"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-jost text-[9px] uppercase tracking-wider text-gray-500 block font-bold">Deskripsi Pesan Kosong</label>
                          <textarea
                            rows={2}
                            value={homepageCmsForm.testimonials?.emptyDescription || ''}
                            onChange={(e) => setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { ...prev.testimonials, emptyDescription: e.target.value }
                            }))}
                            className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg text-gray-700 leading-relaxed focus:border-[#12372A]"
                            placeholder="Tulis pesan saat testimoni kosong…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* F. DAFTAR TESTIMONI */}
                    <div className="border border-gray-100 p-4 rounded-xl bg-gray-50/30 space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <div className="text-[10px] font-jost font-bold text-gray-400 uppercase tracking-widest">F. Daftar Testimoni Pelanggan</div>
                        <button
                          type="button"
                          onClick={() => setHomepageCmsForm(prev => {
                            const list = [...(prev.testimonials?.list || [])];
                            const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'testi_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                            list.push({
                              id: newId,
                              name: 'Nama Pelanggan',
                              role: 'Pelanggan Setia',
                              location: 'Indonesia',
                              avatar: '',
                              rating: 5,
                              comment: 'Ulasan baru yang sangat menyenangkan dari pelanggan setia.',
                              review: 'Ulasan baru yang sangat menyenangkan dari pelanggan setia.',
                              active: true
                            });
                            return {
                              ...prev,
                              testimonials: { ...prev.testimonials, list }
                            };
                          })}
                          className="px-3 py-1 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest rounded-lg font-bold cursor-pointer transition-colors duration-200"
                        >
                          + TAMBAH TESTIMONI
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(homepageCmsForm.testimonials?.list || []).map((testi, index) => {
                          const testiId = testi.id || ('testi-legacy-' + index);
                          const tName = testi.name || '';
                          const tRole = testi.role || '';
                          const tLocation = testi.location || '';
                          const tAvatar = testi.avatar || '';
                          const tRating = testi.rating ?? 5;
                          const tReview = testi.comment || testi.review || '';
                          const tActive = testi.active ?? true;

                          const isNameValid = tName.trim().length >= 3;
                          const isReviewValid = tReview.trim().length >= 10 && tReview.trim().length <= 300;

                          return (
                            <div 
                              key={testiId} 
                              draggable={true}
                              onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                if (!isNaN(fromIdx)) {
                                  handleTestimonialReorder(fromIdx, index);
                                }
                              }}
                              className="p-4 border border-gray-200 rounded-xl bg-white space-y-3 shadow-xs relative hover:border-[#12372A]/40 transition-colors"
                            >
                              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 font-bold text-sm select-none" title="Tarik untuk mengubah urutan">
                                    ⋮⋮
                                  </span>
                                  <span className="font-jost text-[10px] font-bold text-brand-green">Testimoni #{index + 1}</span>
                                  <span className={`text-[9px] font-bold font-jost uppercase tracking-wider ${tActive ? 'text-green-700' : 'text-gray-500'}`}>
                                    {tActive ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Move Up */}
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handleTestimonialReorder(index, index - 1)}
                                    className="p-1 text-gray-400 hover:text-brand-green disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                                    title="Pindahkan ke Atas"
                                  >
                                    ▲
                                  </button>
                                  {/* Move Down */}
                                  <button
                                    type="button"
                                    disabled={index === (homepageCmsForm.testimonials?.list || []).length - 1}
                                    onClick={() => handleTestimonialReorder(index, index + 1)}
                                    className="p-1 text-gray-400 hover:text-brand-green disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                                    title="Pindahkan ke Bawah"
                                  >
                                    ▼
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmModalConfig({
                                        title: "Hapus Testimoni",
                                        itemName: tName || "Tanpa Nama",
                                        itemType: "testimoni",
                                        onConfirm: () => {
                                          setHomepageCmsForm(prev => {
                                            const list = (prev.testimonials?.list || []).filter((_, i) => i !== index);
                                            return { ...prev, testimonials: { ...prev.testimonials, list } };
                                          });
                                          onAddToast('Testimoni berhasil dihapus!', 'info');
                                         }
                                       });
                                     }}
                                    className="p-1 text-red-500 hover:text-red-700 ml-1 font-bold text-xs cursor-pointer"
                                    title="Hapus Testimoni"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Nama Pelanggan *</label>
                                  <input
                                    type="text"
                                    required
                                    value={tName}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.testimonials?.list || [])];
                                      list[index] = { ...list[index], name: e.target.value };
                                      return { ...prev, testimonials: { ...prev.testimonials, list } };
                                    })}
                                    className={`w-full text-xs p-2.5 bg-white border outline-none rounded-lg ${isNameValid ? 'border-gray-200 focus:border-[#12372A]' : 'border-red-300 focus:border-red-500'}`}
                                    placeholder="Nama lengkap atau panggilan…"
                                  />
                                  {!isNameValid && (
                                    <span className="text-[8px] text-red-500 block font-jost">Nama pelanggan minimal harus 3 karakter.</span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Peran (Role) / Keterangan</label>
                                  <input
                                    type="text"
                                    value={tRole}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.testimonials?.list || [])];
                                      list[index] = { ...list[index], role: e.target.value };
                                      return { ...prev, testimonials: { ...prev.testimonials, list } };
                                    })}
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                                    placeholder="Contoh: Ibu Rumah Tangga, Pelanggan Setia"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Asal / Wilayah</label>
                                  <input
                                    type="text"
                                    value={tLocation}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.testimonials?.list || [])];
                                      list[index] = { ...list[index], location: e.target.value };
                                      return { ...prev, testimonials: { ...prev.testimonials, list } };
                                    })}
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg focus:border-[#12372A]"
                                    placeholder="Contoh: Sungailiat, Bangka"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Penilaian (Rating)</label>
                                  <select
                                    value={tRating}
                                    onChange={(e) => setHomepageCmsForm(prev => {
                                      const list = [...(prev.testimonials?.list || [])];
                                      list[index] = { ...list[index], rating: parseInt(e.target.value, 10) };
                                      return { ...prev, testimonials: { ...prev.testimonials, list } };
                                    })}
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 outline-none rounded-lg cursor-pointer focus:border-[#12372A]"
                                  >
                                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                                    <option value={2}>⭐⭐ (2 Bintang)</option>
                                    <option value={1}>⭐ (1 Bintang)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Ulasan (10 - 300 Karakter) *</label>
                                <textarea
                                  rows={3}
                                  required
                                  value={tReview}
                                  onChange={(e) => setHomepageCmsForm(prev => {
                                    const list = [...(prev.testimonials?.list || [])];
                                    list[index] = { ...list[index], comment: e.target.value, review: e.target.value };
                                    return { ...prev, testimonials: { ...prev.testimonials, list } };
                                  })}
                                  className={`w-full text-xs p-2.5 bg-white border outline-none rounded-lg ${isReviewValid ? 'border-gray-200 focus:border-[#12372A]' : 'border-red-300 focus:border-red-500'}`}
                                  placeholder="Tuliskan ulasan pelanggan di sini…"
                                />
                                <div className="flex justify-between items-center text-[8px] font-jost mt-0.5">
                                  <span className={isReviewValid ? "text-gray-400" : "text-red-500"}>
                                    Harus antara 10 dan 300 karakter.
                                  </span>
                                  <span className={tReview.length < 10 || tReview.length > 300 ? "text-red-500 font-bold" : "text-gray-400"}>
                                    {tReview.length}/300
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Testimonial Avatar */}
                                <div className="space-y-1.5 text-left col-span-2">
                                  <label className="font-jost text-[8px] uppercase tracking-wider text-gray-400 block font-bold">Foto Profil (Avatar)</label>
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                                      {tAvatar ? (
                                        <img src={buildStorageUrl(tAvatar)} alt="Preview Avatar" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[8px] text-gray-400 uppercase tracking-widest text-center font-jost">NO PIC</span>
                                      )}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        type="text"
                                        value={tAvatar}
                                        onChange={(e) => setHomepageCmsForm(prev => {
                                          const list = [...(prev.testimonials?.list || [])];
                                          list[index] = { ...list[index], avatar: e.target.value };
                                          return { ...prev, testimonials: { ...prev.testimonials, list } };
                                        })}
                                        className="flex-1 text-xs p-2 bg-white border border-gray-200 outline-none rounded-lg font-mono text-[10px] focus:border-[#12372A]"
                                        placeholder="URL avatar…"
                                      />
                                      <label className="px-3 py-2 bg-[#12372A] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-jost text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center shrink-0 rounded-lg font-bold transition-colors duration-200">
                                        UPLOAD
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleTestimonialAvatarChange(e, index)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Keaktifan testimoni checkbox */}
                                <div className="space-y-1 col-span-2">
                                  <label className="flex items-center gap-2 cursor-pointer font-jost text-xs text-gray-700 h-10 px-3 bg-white border border-gray-200 rounded-lg select-none focus-within:border-[#12372A]">
                                    <input
                                      type="checkbox"
                                      checked={tActive}
                                      onChange={(e) => setHomepageCmsForm(prev => {
                                        const list = [...(prev.testimonials?.list || [])];
                                        list[index] = { ...list[index], active: e.target.checked };
                                        return { ...prev, testimonials: { ...prev.testimonials, list } };
                                      })}
                                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green w-4 h-4 cursor-pointer"
                                    />
                                    Testimoni Aktif (Tampilkan di Beranda)
                                  </label>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {(homepageCmsForm.testimonials?.list || []).length === 0 && (
                          <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/20">
                            <p className="text-xs text-gray-400 font-jost">Belum ada testimoni yang terdaftar. Klik "+ Tambah Testimoni" untuk memulai.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>

                {/* REALTIME LIVE PREVIEW CONTAINER (BELOW FORM EDITOR) */}
                <div className="w-full space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <h5 className="font-sans text-xs font-bold uppercase tracking-wider text-[#174C3C]">
                        Pratinjau Live Website
                      </h5>
                      <span className="text-[10px] bg-[#174C3C]/10 text-[#174C3C] font-bold font-mono px-2 py-0.5 rounded-full">REALTIME</span>
                    </div>

                    {/* Responsive Device Switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'desktop' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'tablet' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Tablet (768px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                          previewDevice === 'mobile' ? 'bg-[#174C3C] text-white shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Mobile (375px)
                      </button>
                    </div>
                  </div>

                  {/* LIVE PREVIEW FRAME */}
                  <div className="bg-[#FAFBF9] border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-sm p-3 min-h-[300px] flex justify-center items-start">
                    <div className={`transition-all duration-300 mx-auto w-full ${
                      previewDevice === 'mobile' ? 'max-w-[375px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' :
                      previewDevice === 'tablet' ? 'max-w-[768px] shadow-lg border border-gray-300 rounded-xl overflow-hidden bg-white' : 'w-full'
                    }`}>
                      <Testimonials cms={homepageCmsForm.testimonials} testimonials={homepageCmsForm.testimonials?.list || []} />
                    </div>
                  </div>

                  {/* ACTIONS BAR CONTAINER */}
                  <div className="bg-[#12372A]/5 border border-[#12372A]/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModalConfig({
                          title: 'Reset Section Testimoni',
                          itemName: 'Bagian Testimoni',
                          itemType: 'section',
                          message: 'Apakah Anda yakin ingin menyetel ulang bagian Testimoni saja ke setelan bawaan (default)?',
                          onConfirm: () => {
                            setHomepageCmsForm(prev => ({
                              ...prev,
                              testimonials: { list: [] }
                            }));
                            onAddToast('Bagian Testimoni diatur ulang ke default bawaan!', 'info');
                          }
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-jost text-[10px] uppercase tracking-widest rounded-lg font-bold transition-all cursor-pointer text-center"
                    >
                      Reset Testimoni ke Default
                    </button>
                    <p className="text-[9px] text-gray-400 text-center sm:text-right leading-tight max-w-[250px]">
                      Setiap perubahan langsung diperbarui di pratinjau. Klik tombol <b>Simpan</b> di bawah halaman untuk menyimpan secara permanen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 08. FOOTER TAB */}
            {activeSubTab === 'footer' && (
              <div className="space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#12372A] text-white text-[10px] font-jost flex items-center justify-center rounded-full font-bold">08</span>
                  <h4 className="font-jost font-bold text-[#12372A] text-sm">Konfigurasi Footer Halaman</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Teks Logo / Nama Brand</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.logoText || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, logoText: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan teks logo atau nama brand"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Nama Lengkap Website</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.websiteName || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, websiteName: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan nama lengkap website"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Deskripsi / Manifesto Singkat Footer</label>
                  <textarea
                    rows={3}
                    value={homepageCmsForm.footer?.description || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, description: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Tulis deskripsi singkat atau manifesto untuk footer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Alamat Fisik Kebun / Kantor</label>
                  <input
                    type="text"
                    value={homepageCmsForm.footer?.address || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, address: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.whatsapp || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, whatsapp: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan nomor WhatsApp"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Alamat Email</label>
                    <input
                      type="text"
                      value={homepageCmsForm.footer?.email || ''}
                      onChange={(e) => setHomepageCmsForm(prev => ({
                        ...prev,
                        footer: { ...prev.footer, email: e.target.value }
                      }))}
                      className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                      placeholder="Masukkan alamat email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-jost text-[9px] uppercase tracking-wider text-gray-400 block">Teks Hak Cipta (Copyright)</label>
                  <input
                    type="text"
                    value={homepageCmsForm.footer?.copyright || ''}
                    onChange={(e) => setHomepageCmsForm(prev => ({
                      ...prev,
                      footer: { ...prev.footer, copyright: e.target.value }
                    }))}
                    className="w-full text-xs p-3 bg-white border border-gray-200 outline-none rounded-lg"
                    placeholder="Masukkan teks hak cipta, misal: © 2025 TaniCo. All rights reserved."
                  />
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-4 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-[#F5F3E7] font-jost text-[10px] uppercase tracking-widest transition-colors duration-200 rounded-lg font-bold shadow-md cursor-pointer"
            >
              Simpan & Terapkan Perubahan Halaman Utama
            </button>
          </div>
        </form>

      <DeleteConfirmModal
        isOpen={Boolean(confirmModalConfig)}
        title={confirmModalConfig?.title || 'Konfirmasi'}
        itemName={confirmModalConfig?.itemName || ''}
        itemType={confirmModalConfig?.itemType || 'data'}
        message={confirmModalConfig?.message}
        onConfirm={() => {
          if (confirmModalConfig?.onConfirm) {
            confirmModalConfig.onConfirm();
          }
          setConfirmModalConfig(null);
        }}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}