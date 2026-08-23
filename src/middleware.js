import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

async function verifySessionToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // LOG 1: Pastikan middleware berjalan
  console.log('🔹 MIDDLEWARE RUNNING:', pathname);

  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    console.log('🔸 Admin path detected:', pathname);

    if (pathname === '/api/admin/auth/login') {
      console.log('✅ Login API - allow');
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get('tanico_session')?.value;
    console.log('🔸 Cookie tanico_session:', sessionToken ? 'ADA' : 'TIDAK ADA');

    let isValidAdmin = false;

    if (sessionToken) {
      const payload = await verifySessionToken(sessionToken);
      console.log('🔸 Payload after verify:', payload);
      if (payload) {
        const role = payload.role || '';
        const roleUpper = role.toUpperCase();
        if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
          isValidAdmin = true;
        }
      }
    }
    console.log('🔸 isValidAdmin:', isValidAdmin);

    if (isAdminApi) {
      if (!isValidAdmin) {
        console.log('❌ API blocked - invalid admin');
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
      console.log('✅ API allowed');
      return NextResponse.next();
    }

    const isLoginPage = pathname === '/admin/login';
    if (isLoginPage) {
      if (isValidAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    if (!isValidAdmin) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      if (sessionToken) {
        response.cookies.set('tanico_session', '', { path: '/', maxAge: 0 });
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};