import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Jika akses di root (/), langsung redirect ke /login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi matcher: hanya jalankan middleware ini pada root path
export const config = {
  matcher: ['/'],
};