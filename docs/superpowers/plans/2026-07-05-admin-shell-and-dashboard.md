# Admin Shell + Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin layout shell (sidebar, header, auth) and dashboard page with stat cards.

**Architecture:** Next.js 16 App Router with `app/(dashboard)` route group for authenticated pages. Polaris `Frame` + `Navigation` + `TopBar` for the layout shell. Server Components for data fetching, Client Components for interactive parts. Supabase service-role client for admin data queries.

**Tech Stack:** Next.js 16, @shopify/polaris v13, @supabase/supabase-js, @supabase/ssr, Tailwind CSS v4

---

### Task 1: Install dependencies and create Supabase clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `.env.local` (template)

- [ ] **Step 1: Install packages**

```bash
npm install @supabase/supabase-js @supabase/ssr --legacy-peer-deps
```

- [ ] **Step 2: Create browser client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 3: Create server client**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}

export async function createSessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

- [ ] **Step 4: Create .env.local template**

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

### Task 2: Set up auth proxy (Next.js 16 middleware replacement) and login page

**Files:**
- Create: `proxy.ts`
- Create: `app/login/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create proxy.ts for session guard**

```ts
// proxy.ts
import { type NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/listings') && !pathname.startsWith('/payments') && !pathname.startsWith('/shops') && !pathname.startsWith('/users') && !pathname.startsWith('/packages') && !pathname.startsWith('/offers') && !pathname.startsWith('/categories') && !pathname.startsWith('/reports') && !pathname.startsWith('/notifications') && !pathname.startsWith('/banners') && !pathname.startsWith('/featured-credits') && !pathname.startsWith('/locations') && !pathname.startsWith('/settings')) {
    return NextResponse.next()
  }

  const supabaseAuthCookie = request.cookies.get('sb-auth-token')
  if (!supabaseAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
```

- [ ] **Step 2: Create login page**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Page, TextField, Button, Banner, Spinner, Box, Text } from '@shopify/polaris'
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

  return (
    <Page>
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <Text variant="heading2xl" as="h1" alignment="center">
            Admin Login
          </Text>
          <div className="mt-6">
            <Card>
              <Box>
                {error && <Banner tone="critical">{error}</Banner>}
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <div className="mt-4">
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
                    {loading ? <Spinner accessibilityLabel="Logging in" /> : 'Log in'}
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
```

- [ ] **Step 3: Update root layout for Polaris CSS**

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import '@shopify/polaris/build/esm/styles.css'
import { Providers } from './providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vendo Admin",
  description: "Mobile Market Admin Dashboard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

### Task 3: Create Polaris AppProvider and authenticated layout

**Files:**
- Create: `app/providers.tsx`
- Create: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create AppProvider wrapper**

```tsx
// app/providers.tsx
'use client'

import { AppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'
import { usePathname } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={enTranslations}>
      {children}
    </AppProvider>
  )
}
```

- [ ] **Step 2: Create authenticated dashboard layout with Polaris Frame**

```tsx
// app/(dashboard)/layout.tsx
'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Frame,
  Navigation,
  TopBar,
  Icon,
} from '@shopify/polaris'
import {
  HomeMajor,
  ClipboardListMajor,
  CashDollarMajor,
  StoreMajor,
  PeopleMajor,
  PackageMajor,
  MegaphoneMajor,
  CollectionsMajor,
  AlertMinor,
  NotificationMajor,
  ImageMajor,
  StarMajor,
  LocationMajor,
  SettingsMajor,
} from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: HomeMajor },
  { label: 'Pending Listings', path: '/listings', icon: ClipboardListMajor },
  { label: 'Pending Payments', path: '/payments', icon: CashDollarMajor },
  { label: 'Shops', path: '/shops', icon: StoreMajor },
  { label: 'Users', path: '/users', icon: PeopleMajor },
  { label: 'Packages', path: '/packages', icon: PackageMajor },
  { label: 'Offers/Campaigns', path: '/offers', icon: MegaphoneMajor },
  { label: 'Categories', path: '/categories', icon: CollectionsMajor },
  { label: 'Reports', path: '/reports', icon: AlertMinor },
  { label: 'Notifications', path: '/notifications', icon: NotificationMajor },
  { label: 'Banners', path: '/banners', icon: ImageMajor },
  { label: 'Featured Credits', path: '/featured-credits', icon: StarMajor },
  { label: 'Locations', path: '/locations', icon: LocationMajor },
  { label: 'Settings', path: '/settings', icon: SettingsMajor },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={() => setMobileNavOpen(!mobileNavOpen)}
      secondaryMenu={
        <TopBar.UserMenu
          name="Admin"
          initials="A"
          actions={[{ items: [{ content: 'Logout', onAction: handleLogout }] }]}
        />
      }
    />
  )

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={NAV_ITEMS.map((item) => ({
          label: item.label,
          icon: item.icon,
          url: item.path,
          selected: pathname === item.path || pathname.startsWith(item.path + '/'),
        }))}
      />
    </Navigation>
  )

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavOpen}
      onNavigationDismiss={() => setMobileNavOpen(false)}
    >
      {children}
    </Frame>
  )
}
```

---

### Task 4: Create route redirect and dashboard data queries

**Files:**
- Create: `app/(dashboard)/page.tsx` (root of dashboard group → redirect)
- Create: `lib/supabase/queries.ts`

- [ ] **Step 1: Root dashboard group redirects to /dashboard**

```tsx
// app/(dashboard)/page.tsx
import { redirect } from 'next/navigation'

export default function DashboardGroupRoot() {
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create dashboard query helpers**

```ts
// lib/supabase/queries.ts
import { createAdminClient } from './server'

export async function getDashboardStats() {
  const supabase = await createAdminClient()

  const [
    { count: totalUsers },
    { count: totalListings },
    { count: totalShops },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    totalListings: totalListings ?? 0,
    totalShops: totalShops ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
  }
}

export async function getPendingCounts() {
  const supabase = await createAdminClient()

  const callRPC = async (rpcName: string) => {
    const { data, error } = await supabase.rpc(rpcName, { p_limit: 1, p_offset: 0 })
    if (error) return 0
    return Array.isArray(data) ? data.length : 0
  }

  // Use RPCs to get pending counts
  const pendingListings = (await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')).count ?? 0

  const pendingPayments = (await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')).count ?? 0

  const pendingShops = (await supabase
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .eq('approval_status', 'pending')).count ?? 0

  const pendingReports = (await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')).count ?? 0

  return { pendingListings, pendingPayments, pendingShops, pendingReports }
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>
export type PendingCounts = Awaited<ReturnType<typeof getPendingCounts>>
```

---

### Task 5: Build shared wrapper components

**Files:**
- Create: `components/admin/StatCard.tsx`
- Create: `components/admin/StatusBadge.tsx`
- Create: `components/admin/ReasonModal.tsx`

- [ ] **Step 1: StatCard wrapper**

```tsx
// components/admin/StatCard.tsx
import { Card, Text, Box, Inline } from '@shopify/polaris'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: number | string
  link?: string
  tone?: 'success' | 'critical' | 'warning' | 'info'
}

export function StatCard({ label, value, link, tone }: StatCardProps) {
  const content = (
    <Card padding="400" roundedAbove="sm">
      <Box>
        <Text variant="headingXl" as="p" tone={tone}>
          {value}
        </Text>
        <Text variant="bodyMd" as="p" tone="subdued">
          {label}
        </Text>
      </Box>
    </Card>
  )

  if (link) {
    return <Link href={link}>{content}</Link>
  }

  return content
}
```

- [ ] **Step 2: StatusBadge wrapper**

```tsx
// components/admin/StatusBadge.tsx
import { Badge } from '@shopify/polaris'

const STATUS_TONE_MAP: Record<string, 'success' | 'critical' | 'warning' | 'info' | 'attention' | 'new'> = {
  approved: 'success',
  active: 'success',
  pending: 'warning',
  rejected: 'critical',
  blocked: 'critical',
  suspended: 'critical',
  draft: 'info',
  paused: 'attention',
  removed: 'critical',
  expired: 'critical',
  sold: 'info',
  resolved: 'success',
  dismissed: 'info',
  cancelled: 'critical',
  failed: 'critical',
  sending: 'attention',
  sent: 'success',
  scheduled: 'info',
  true: 'success',
  false: 'critical',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = STATUS_TONE_MAP[status.toLowerCase()] ?? 'info'
  return <Badge tone={tone}>{status}</Badge>
}
```

- [ ] **Step 3: ReasonModal wrapper**

```tsx
// components/admin/ReasonModal.tsx
'use client'

import { useState } from 'react'
import { Modal, TextField, Button } from '@shopify/polaris'

interface ReasonModalProps {
  open: boolean
  title: string
  onSubmit: (reason: string) => void
  onClose: () => void
  submitLabel?: string
}

export function ReasonModal({ open, title, onSubmit, onClose, submitLabel = 'Submit' }: ReasonModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSubmit(reason)
    setSubmitting(false)
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={{
        content: submitLabel,
        onAction: handleSubmit,
        disabled: !reason.trim() || submitting,
        loading: submitting,
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <Modal.Section>
        <TextField
          label="Reason"
          value={reason}
          onChange={setReason}
          multiline={3}
          placeholder="Enter the reason..."
          autoFocus
        />
      </Modal.Section>
    </Modal>
  )
}
```

---

### Task 6: Build Dashboard page with stat cards

**Files:**
- Create: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create Dashboard page**

```tsx
// app/(dashboard)/dashboard/page.tsx
import { Page, Layout, Card, Text, Banner, Button, Inline, BlockStack } from '@shopify/polaris'
import { getDashboardStats, getPendingCounts } from '@/lib/supabase/queries'
import { StatCard } from '@/components/admin/StatCard'
import { StatusBadge } from '@/components/admin/StatusBadge'

export default async function DashboardPage() {
  const [stats, pending] = await Promise.all([
    getDashboardStats().catch(() => null),
    getPendingCounts().catch(() => null),
  ])

  if (!stats || !pending) {
    return (
      <Page title="Dashboard">
        <Banner tone="critical">
          Failed to load dashboard data. Check your Supabase connection and make sure you are logged in as an admin.
        </Banner>
      </Page>
    )
  }

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Users" value={stats.totalUsers} tone="info" />
              <StatCard label="Active Listings" value={stats.totalListings} tone="success" />
              <StatCard label="Active Shops" value={stats.totalShops} tone="success" />
              <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} tone="info" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Pending Listings" value={pending.pendingListings} link="/listings" tone="warning" />
              <StatCard label="Pending Payments" value={pending.pendingPayments} link="/payments" tone="warning" />
              <StatCard label="Pending Shops" value={pending.pendingShops} link="/shops" tone="warning" />
              <StatCard label="Pending Reports" value={pending.pendingReports} link="/reports" tone="critical" />
            </div>
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Text variant="headingMd" as="h2">Quick Actions</Text>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="primary" url="/listings">Review Pending Listings</Button>
              <Button variant="secondary" url="/payments">Review Pending Payments</Button>
              <Button variant="secondary" url="/shops/pending">Review Pending Shops</Button>
              <Button variant="secondary" url="/reports">Review Reports</Button>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
```

---

### Task 7: Verify build passes

**Files:** None

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors.
