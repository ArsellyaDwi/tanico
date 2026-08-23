import '@/app/globals.css';
import ClientCursor from '@/components/ui/ClientCursor';
import ClientFontLoader from '@/components/ui/ClientFontLoader';

const baseUrl = process.env.APP_URL || 'https://tanico.id';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'TaniCo',
    template: '%s | TaniCo'
  },
  description: 'Platform e-commerce belanja sayur segar, organik, dan hidroponik langsung dari petani lokal Bangka. Panen pagi, kirim siang.',
  keywords: ['sayur segar', 'sayur organik bangka', 'hidroponik bangka', 'tanico', 'belanja sayur online', 'petani lokal'],
  authors: [{ name: 'TaniCo Indonesia' }],
  creator: 'TaniCo',
  publisher: 'TaniCo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  alternates: {
    canonical: './'
  },
  openGraph: {
    title: 'TaniCo',
    description: 'Nikmati sayuran segar berkualitas tinggi bebas pestisida sintetis langsung dari kebun kemitraan lokal Bangka.',
    url: baseUrl,
    siteName: 'TaniCo',
    locale: 'id_ID',
    type: 'website',
    images: []
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaniCo',
    description: 'Belanja sayur segar langsung dari kebun lokal Bangka.',
    images: []
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TaniCo',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description: 'Platform belanja sayuran segar, organik, dan hidroponik langsung dari petani lokal Bangka.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Raya Pemali No. 45',
      addressLocality: 'Sungailiat',
      addressRegion: 'Bangka',
      addressCountry: 'ID'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+628127300400',
      contactType: 'Customer Service',
      areaServed: 'ID',
      availableLanguage: 'Indonesian'
    }
  };

  return (
    <html lang="id">
      <body className="bg-[#FCFCFC] text-[#174C3C] font-sans antialiased selection:bg-[#DCEFE0] selection:text-[#174C3C]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ClientFontLoader />
        <ClientCursor />
        {children}
      </body>
    </html>
  );
}
