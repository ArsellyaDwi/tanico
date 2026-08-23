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

  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get('tanico_session')?.value;
    let isValidAdmin = false;

    if (sessionToken) {
      const payload = await verifySessionToken(sessionToken);
      if (payload) {
        const role = payload.role || '';
        const roleUpper = role.toUpperCase();
        if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
          isValidAdmin = true;
        }
      }
    }

    if (isAdminApi) {
      if (!isValidAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
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