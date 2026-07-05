'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Page, TextField, Button, Banner, Box, Text } from '@shopify/polaris'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <Page title="">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <Text variant="heading2xl" as="h1" alignment="center">
            Admin Login
          </Text>
          <div className="mt-6">
            <Card>
              <Box padding="400">
                {error && <Banner tone="critical">{error}</Banner>}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <div className="mt-4" onKeyDown={handleKeyDown}>
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                  />
                </div>
                <div className="mt-6">
                  <Button variant="primary" onClick={handleLogin} disabled={loading} fullWidth>
                    {loading ? 'Logging in...' : 'Log in'}
                  </Button>
                </div>
              </Box>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  )
}
