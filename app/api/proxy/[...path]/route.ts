import { NextRequest } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is not set')

// /sanctum/csrf-cookie lives at the domain root, not under /api
const DOMAIN_ROOT = API_BASE.replace(/\/api\/?$/i, '')

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const joined = path.join('/')

  const targetBase = joined.startsWith('sanctum/') ? DOMAIN_ROOT : API_BASE
  const url = new URL(`${targetBase}/${joined}`)
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const method = req.method
  const token = req.cookies.get('admin_token')?.value

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': req.headers.get('content-type') || 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  // Forward Laravel session & CSRF cookies + header (needed for Sanctum/Session auth)
  const xsrf = req.cookies.get('XSRF-TOKEN')?.value
  const session = req.cookies.get('laravel_session')?.value
  const cookieParts: string[] = []
  if (xsrf) {
    cookieParts.push(`XSRF-TOKEN=${xsrf}`)
    headers['X-XSRF-TOKEN'] = xsrf
  }
  if (session) cookieParts.push(`laravel_session=${session}`)
  if (cookieParts.length > 0) headers.Cookie = cookieParts.join('; ')

  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined

  // Don't follow redirects — auth endpoints return 302 on success;
  // we need the original JSON response, not the redirect target.
  const response = await fetch(url, {
    method,
    headers,
    redirect: 'manual',
    ...(body !== undefined && { body }),
  })

  // Read the upstream body (auto-decompresses gzip)
  const upstreamBody = await response.text()

  // Forward headers from upstream, stripping ones that don't apply
  // to our re-encoded response (content-encoding and content-length
  // are wrong since we decompressed the body; transfer-encoding is
  // a hop-by-hop header; set-cookie is handled separately below)
  const SKIP = new Set(['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding'])
  const rawSetCookie = response.headers.get('set-cookie')
  const setCookie = rawSetCookie?.replace(/;\s*secure\s*(?=;|$)/gi, '')
  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    if (!SKIP.has(key.toLowerCase())) responseHeaders[key] = value
  })

  // 204 No Content can't have a body per HTTP spec
  if (response.status === 204) {
    return new Response(null, { status: 204, headers: { ...(setCookie ? { 'set-cookie': setCookie } : {}) } })
  }

  return new Response(upstreamBody, {
    status: response.status,
    headers: {
      ...responseHeaders,
      'content-type': 'application/json; charset=utf-8',
      ...(setCookie ? { 'set-cookie': setCookie } : {}),
    },
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
