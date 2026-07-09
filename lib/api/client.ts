export const TOKEN_COOKIE = 'admin_token'

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set')
  return base.replace(/\/+$/, '')
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function setToken(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export interface PageMeta {
  page: number
  per_page: number
  total: number
  last_page: number
}

interface ErrorPayload {
  message: string
  code: string
  details?: Record<string, string[]>
}

interface Envelope<T> {
  data: T
  meta?: PageMeta
  error: ErrorPayload | null
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function errorMessage(payload: ErrorPayload): string {
  // Surface per-field validation messages instead of the generic message
  if (payload.details && Object.keys(payload.details).length > 0) {
    return Object.values(payload.details).flat().join(' ')
  }
  return payload.message
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
  const url = new URL(getApiBaseUrl() + path)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  const token = getToken()
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  })

  let envelope: Envelope<T>
  try {
    envelope = await res.json()
  } catch {
    throw new ApiError(`Unexpected response from the API (HTTP ${res.status})`, 'SERVER_ERROR', res.status)
  }

  if (!res.ok || envelope.error) {
    const error = envelope.error ?? { message: `Request failed (HTTP ${res.status})`, code: 'SERVER_ERROR' }
    if (res.status === 401 && error.code === 'UNAUTHENTICATED' && typeof window !== 'undefined') {
      clearToken()
      window.location.assign('/login')
    }
    throw new ApiError(errorMessage(error), error.code, res.status, error.details)
  }

  return { data: envelope.data, meta: envelope.meta }
}

export async function api<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { data } = await apiFetch<T>(path, options)
  return data
}
