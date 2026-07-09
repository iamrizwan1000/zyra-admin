'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Frame,
  Navigation,
  TopBar,
} from '@shopify/polaris'
import {
  HomeIcon,
  ClipboardIcon,
  CashDollarIcon,
  StoreIcon,
  PersonIcon,
  PackageIcon,
  MegaphoneIcon,
  CollectionIcon,
  AlertTriangleIcon,
  NotificationIcon,
  ImageIcon,
  StarIcon,
  LocationIcon,
  SettingsIcon,
} from '@shopify/polaris-icons'
import { logout } from '@/lib/api/auth'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { label: 'Pending Listings', path: '/listings', icon: ClipboardIcon },
  { label: 'Pending Payments', path: '/payments', icon: CashDollarIcon },
  { label: 'Shops', path: '/shops', icon: StoreIcon },
  { label: 'Users', path: '/users', icon: PersonIcon },
  { label: 'Packages', path: '/packages', icon: PackageIcon },
  { label: 'Offers/Campaigns', path: '/offers', icon: MegaphoneIcon },
  { label: 'Categories', path: '/categories', icon: CollectionIcon },
  { label: 'Reports', path: '/reports', icon: AlertTriangleIcon },
  { label: 'Notifications', path: '/notifications', icon: NotificationIcon },
  { label: 'Banners', path: '/banners', icon: ImageIcon },
  { label: 'Featured Credits', path: '/featured-credits', icon: StarIcon },
  { label: 'Locations', path: '/locations', icon: LocationIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [router])

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={() => setMobileNavOpen(!mobileNavOpen)}
      userMenu={
        <TopBar.UserMenu
          name="Admin"
          initials="A"
          open={userMenuOpen}
          onToggle={() => setUserMenuOpen(!userMenuOpen)}
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
          onClick: () => router.push(item.path),
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
      <div className="admin-content">{children}</div>
    </Frame>
  )
}
