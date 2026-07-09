import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard', '/listings', '/payments', '/shops',
  '/users', '/packages', '/offers', '/categories',
  '/reports', '/notifications', '/banners',
  '/featured-credits', '/locations', '/settings',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const hasSession = Boolean(request.cookies.get('admin_token')?.value)

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
