import { api, clearToken, setToken } from './client'

export interface AuthUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_admin: boolean
  account_status: string
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { user, token } = await api<{ user: AuthUser; token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  setToken(token)
  return user
}

export async function logout(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST' })
  } catch {
    // Revoking the token server-side is best-effort; always clear it locally
  }
  clearToken()
}

export async function getMe(): Promise<AuthUser> {
  return api<AuthUser>('/auth/me')
}
