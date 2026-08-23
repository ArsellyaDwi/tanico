import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/dbActions'; // <- pakai alias @/
import { isRateLimited, getClientIp } from '@/utils/rateLimit';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=No+code', url.origin));
    }

    // 1. Tukar code dengan access_token dari Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      logger.error('Google token error:', tokenData);
      return NextResponse.redirect(new URL('/login?error=Google+token+failed', url.origin));
    }

    // 2. Ambil user info dari Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      return NextResponse.redirect(new URL('/login?error=No+email+from+Google', url.origin));
    }

    // 3. Cari atau buat user di database
    let user = await findUserByEmail(userInfo.email);
    if (!user) {
      user = await createUser({
        name: userInfo.name || 'Pengguna Google',
        email: userInfo.email,
        password: '',
        provider: 'Google',
        roleName: 'CUSTOMER',
      });
    } else {
      // Cek admin
      const roleName = (user.role?.name || '').toUpperCase();
      if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login?error=Admin+cannot+login+with+Google', url.origin));
      }
    }

    // 4. Buat JWT (atau pakai token dari Google)
    // Di sini kita pakai access_token Google sebagai session token (atau bisa buat sendiri)
    const jwtToken = tokenData.access_token;

    // 5. Redirect ke success page dengan token + user
    const redirectUrl = new URL('/auth/google/success', url.origin);
    redirectUrl.searchParams.set('token', jwtToken);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: userInfo.picture || user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role?.name || 'CUSTOMER',
    })));

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    logger.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=Server+error', request.url));
  }
}