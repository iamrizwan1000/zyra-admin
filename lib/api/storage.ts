import { getToken } from './client'

// Private-bucket files (payment proofs, shop documents) require the admin Bearer
// token — a plain <img src> or <a href> won't send it, so fetch them as blobs.
export async function fetchPrivateFile(url: string): Promise<Blob> {
  const token = getToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) throw new Error(`Failed to load file (HTTP ${res.status})`)
  return res.blob()
}

export async function openPrivateFile(url: string): Promise<void> {
  const blob = await fetchPrivateFile(url)
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener')
  // Give the new tab time to load before releasing the object URL
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
