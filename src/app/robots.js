export default function robots() {
  const baseUrl = process.env.APP_URL || 'https://tanico.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/checkout',
          '/akun/*',
          '/payment/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
