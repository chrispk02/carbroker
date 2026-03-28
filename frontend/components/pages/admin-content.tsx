'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Car, Eye, TrendingUp, ShieldCheck, BarChart3,
  Search, Crown, EyeOff, CheckCircle, Loader2, Trash2,
  UserCheck, ShoppingBag, ListChecks, Activity, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  Clock, Star, Home, ChevronRight, LogOut, Settings, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import type { AdminData, AdminUser, AdminCar, AdminKyc, SiteConfig } from '@/lib/supabase/queries/admin'
import { useLocale } from '@/lib/i18n/locale-context'
import { useAuth } from '@/lib/auth/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Formatters ───────────────────────────────────────────────
function formatPrice(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ'
  if (n >= 1_000_000) return Math.round(n / 1_000_000) + ' tr'
  return n.toLocaleString('vi-VN')
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function shortDate(d: string) {
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

type StatusMap = Record<string, { label: string; color: string; dot: string }>
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280']

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, bg, trend }: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; color: string; bg: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUpRight className="size-3 text-emerald-500 shrink-0" />}
            {trend === 'down' && <ArrowDownRight className="size-3 text-red-500 shrink-0" />}
            {trend === 'neutral' && <Minus className="size-3 text-gray-400 shrink-0" />}
            <p className="text-[11px] text-gray-500 truncate">{sub}</p>
          </div>
        </div>
        <div className={`ml-3 flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, statusMap }: { status: string; statusMap: StatusMap }) {
  const cfg = statusMap[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.color}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Main Component ───────────────────────────────────────────
interface Props { data: AdminData; siteConfig: SiteConfig }

export function AdminContent({ data, siteConfig: initialSiteConfig }: Props) {
  const { locale, dictionary: t } = useLocale()
  const { user: authUser, logout } = useAuth()
  const { stats, growth } = data
  const [tab, setTab] = useState<'overview' | 'users' | 'cars' | 'content' | 'kyc'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [users, setUsers] = useState<AdminUser[]>(data.users)
  const [cars, setCars] = useState<AdminCar[]>(data.cars)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [kyc, setKyc] = useState<AdminKyc[]>(data.kyc)
  const [kycFilter, setKycFilter] = useState<string>('all')
  const [kycSelected, setKycSelected] = useState<AdminKyc | null>(null)
  const [kycDocUrls, setKycDocUrls] = useState<Record<string, string>>({})
  const [kycLoadingDocs, setKycLoadingDocs] = useState(false)
  const [kycRejectMode, setKycRejectMode] = useState(false)
  const [kycRejectReason, setKycRejectReason] = useState('')
  const [kycActionLoading, setKycActionLoading] = useState(false)

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState<'buyer' | 'seller'>('buyer')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const [cfg, setCfg] = useState<SiteConfig>(initialSiteConfig)
  const [cfgSaving, setCfgSaving] = useState(false)
  const [cfgSaved, setCfgSaved] = useState(false)
  const [cfgError, setCfgError] = useState<string | null>(null)

  const statusMap: StatusMap = {
    active: { label: t.admin.statusActive, color: 'bg-emerald-100 text-emerald-700 ring-emerald-200/50', dot: 'bg-emerald-500' },
    hidden: { label: t.admin.statusHidden, color: 'bg-gray-100 text-gray-600 ring-gray-200/50',          dot: 'bg-gray-400' },
    sold:   { label: t.admin.statusSold,   color: 'bg-blue-100 text-blue-700 ring-blue-200/50',           dot: 'bg-blue-500' },
    draft:  { label: t.admin.statusDraft,  color: 'bg-amber-100 text-amber-700 ring-amber-200/50',        dot: 'bg-amber-500' },
  }

  const avgPrice = useMemo(() => {
    const active = data.cars.filter(c => c.status === 'active' && c.price_vnd > 0)
    if (!active.length) return 0
    return Math.round(active.reduce((s, c) => s + c.price_vnd, 0) / active.length)
  }, [data.cars])

  const conversionRate = useMemo(() => {
    if (!stats.totalCars) return 0
    return Math.round((stats.soldCars / stats.totalCars) * 100)
  }, [stats])

  const topBrands = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of data.cars) map.set(c.brand, (map.get(c.brand) ?? 0) + 1)
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([brand, count]) => ({ brand, count }))
  }, [data.cars])

  const statusPieData = useMemo(() => [
    { name: t.admin.statusActive, value: stats.activeCars },
    { name: t.admin.statusSold,   value: stats.soldCars },
    { name: t.admin.statusDraft,  value: data.cars.filter(c => c.status === 'draft').length },
    { name: t.admin.statusHidden, value: data.cars.filter(c => c.status === 'hidden').length },
  ].filter(d => d.value > 0), [stats, data.cars, t])

  const verifiedCount = data.cars.filter(c => c.verified).length

  const filteredUsers = useMemo(() => users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  }), [users, search, roleFilter])

  const filteredCars = useMemo(() => cars.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.seller_email.toLowerCase().includes(search.toLowerCase()) ||
      (c.seller_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [cars, search, statusFilter])

  // ── Actions ──────────────────────────────────────────────
  async function toggleAdmin(userId: string, current: boolean) {
    setLoadingId(userId)
    const res = await fetch('/api/admin/toggle-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: !current }),
    })
    if (res.ok) setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
    setLoadingId(null)
  }

  async function deleteUser(userId: string) {
    if (!confirm('Xoá người dùng này? Hành động không thể hoàn tác.')) return
    setLoadingId(userId + '_del')
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    } else {
      alert(`Không thể xoá: ${json.error ?? 'Lỗi không xác định'}`)
    }
    setLoadingId(null)
  }

  async function setCarStatus(carId: string, status: string) {
    setLoadingId(carId)
    const res = await fetch('/api/admin/car-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carId, status }),
    })
    if (res.ok) setCars(prev => prev.map(c => c.id === carId ? { ...c, status } : c))
    setLoadingId(null)
  }

  async function handleCreateUser(e: React.SyntheticEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, fullName: newFullName, role: newRole }),
    })
    const json = await res.json()
    setCreateLoading(false)
    if (!res.ok) { setCreateError(json.error ?? 'Có lỗi xảy ra'); return }
    setCreateSuccess(true)
    setNewEmail(''); setNewPassword(''); setNewFullName(''); setNewRole('buyer')
    setTimeout(() => { setCreateSuccess(false); setShowCreateUser(false) }, 2000)
  }

  async function handleSaveConfig(e: React.SyntheticEvent) {
    e.preventDefault()
    setCfgSaving(true)
    setCfgError(null)
    const res = await fetch('/api/admin/site-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: cfg }),
    })
    const json = await res.json()
    setCfgSaving(false)
    if (!res.ok) { setCfgError(json.error ?? 'Có lỗi xảy ra'); return }
    setCfgSaved(true)
    setTimeout(() => setCfgSaved(false), 3000)
  }

  const pendingKycCount = kyc.filter(k => k.status === 'pending').length

  async function openKycDocs(item: AdminKyc) {
    setKycSelected(item)
    setKycRejectMode(false)
    setKycRejectReason('')
    const paths = [item.cccd_front_path, item.cccd_back_path, item.business_license_path].filter(Boolean) as string[]
    if (!paths.length) return
    setKycLoadingDocs(true)
    const params = paths.map(p => `path=${encodeURIComponent(p)}`).join('&')
    const res = await fetch(`/api/admin/kyc-sign?${params}`)
    const json = await res.json() as { urls: Record<string, string> }
    setKycDocUrls(json.urls ?? {})
    setKycLoadingDocs(false)
  }

  async function handleKycReview(action: 'approve' | 'reject') {
    if (!kycSelected) return
    setKycActionLoading(true)
    const res = await fetch('/api/admin/kyc-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kycId: kycSelected.id, action, rejectReason: kycRejectReason }),
    })
    if (res.ok) {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      setKyc(prev => prev.map(k => k.id === kycSelected.id ? { ...k, status: newStatus, reject_reason: kycRejectReason || null } : k))
      setKycSelected(prev => prev ? { ...prev, status: newStatus as AdminKyc['status'] } : null)
      setKycRejectMode(false)
    }
    setKycActionLoading(false)
  }

  const filteredKyc = kycFilter === 'all' ? kyc : kyc.filter(k => k.status === kycFilter)

  const kycStatusStyle: Record<string, { label: string; color: string }> = {
    pending:   { label: t.kyc.statusPending,   color: 'bg-amber-100 text-amber-700' },
    reviewing: { label: t.kyc.statusReviewing, color: 'bg-blue-100 text-blue-700' },
    approved:  { label: t.kyc.statusApproved,  color: 'bg-emerald-100 text-emerald-700' },
    rejected:  { label: t.kyc.statusRejected,  color: 'bg-red-100 text-red-700' },
  }

  const statCards = [
    { label: t.admin.statTotalUsers,   value: stats.totalUsers,   sub: `+${stats.newUsersToday} ${t.admin.todaySuffix}`,  icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-50',    trend: stats.newUsersToday > 0 ? 'up' : 'neutral' },
    { label: t.admin.statSellerBuyer,  value: `${stats.totalSellers} / ${stats.totalBuyers}`, sub: `${stats.totalSellers ? Math.round(stats.totalSellers / stats.totalUsers * 100) : 0}% ${t.admin.isSeller}`, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'neutral' },
    { label: t.admin.statActiveCars,   value: stats.activeCars,   sub: `${stats.soldCars} ${t.admin.soldSuffix} · +${stats.newCarsToday} ${t.admin.todaySuffix}`, icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: stats.newCarsToday > 0 ? 'up' : 'neutral' },
    { label: t.admin.statTotalViews,   value: stats.totalViews,   sub: `${stats.totalCars} ${t.admin.totalListingsSuffix}`, icon: Eye,     color: 'text-orange-600', bg: 'bg-orange-50', trend: 'up' },
    { label: t.admin.statAvgPrice,     value: avgPrice ? formatPrice(avgPrice) : '—', sub: t.admin.activeCarsLabel, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'neutral' },
    { label: t.admin.statConversion,   value: `${conversionRate}%`, sub: `${stats.soldCars} / ${stats.totalCars} ${t.admin.totalListingsSuffix}`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', trend: conversionRate > 20 ? 'up' : 'neutral' },
  ] as const

  // ── Sidebar nav items ────────────────────────────────────
  const navItems = [
    { key: 'overview', label: t.admin.tabOverview, icon: BarChart3 },
    { key: 'users',    label: `${t.admin.colUser}`, icon: Users, badge: users.length },
    { key: 'cars',     label: t.admin.colListing,   icon: Car,   badge: cars.length },
    { key: 'content',  label: t.admin.tabContent,   icon: Settings },
    { key: 'kyc',      label: t.kyc.adminTabKyc,    icon: ShieldCheck, badge: pendingKycCount || undefined, badgeRed: true },
  ] as const

  // Page title per tab
  const pageTitle: Record<typeof tab, string> = {
    overview: t.admin.tabOverview,
    users:    t.admin.colUser,
    cars:     t.admin.colListing,
    content:  t.admin.tabContent,
    kyc:      t.kyc.adminTabKyc,
  }

  function switchTab(key: typeof tab) {
    setTab(key)
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f3f4]">

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">CarBroker</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quản lý</p>
          {navItems.map(({ key, label, icon: Icon, badge, badgeRed }) => (
            <button
              key={key}
              onClick={() => switchTab(key as typeof tab)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                tab === key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('size-4 shrink-0', tab === key ? 'text-blue-600' : 'text-gray-400')} />
              <span className="flex-1 truncate">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className={cn(
                  'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  badgeRed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          <Link
            href={`/${locale}`}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Home className="size-4 text-gray-400" />
            <span>Về trang chủ</span>
          </Link>
          <button
            onClick={() => { setRefreshing(true); setTimeout(() => { setRefreshing(false); window.location.reload() }, 400) }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className={cn('size-4 text-gray-400', refreshing && 'animate-spin')} />
            <span>{t.admin.refresh}</span>
          </button>
          {/* User info */}
          <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {(authUser?.name?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{authUser?.name ?? 'Admin'}</p>
              <p className="truncate text-[10px] text-gray-400">{authUser?.email ?? ''}</p>
            </div>
            <button onClick={logout} title="Đăng xuất" className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">{pageTitle[tab]}</span>
            {tab !== 'overview' && (
              <>
                <ChevronRight className="size-3.5" />
                <span className="text-gray-400">
                  {tab === 'users' ? `${filteredUsers.length} kết quả` :
                   tab === 'cars' ? `${filteredCars.length} kết quả` :
                   tab === 'kyc' ? `${filteredKyc.length} kết quả` : ''}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="size-3.5" />
            <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">

            {/* ══ TAB: OVERVIEW ══════════════════════════════ */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stat grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                  {statCards.map((card) => (
                    <StatCard key={card.label} {...card} trend={card.trend as 'up' | 'down' | 'neutral'} />
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="mb-1 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="size-4 text-blue-500" />{t.admin.chartGrowth}
                    </p>
                    <p className="mb-4 text-xs text-gray-400">{t.admin.chartGrowthDesc}</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={growth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gCars" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip labelFormatter={(l) => `Ngày ${shortDate(l as string)}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#gUsers)" name={t.admin.seriesUsers} dot={false} />
                        <Area type="monotone" dataKey="cars"  stroke="#10b981" strokeWidth={2} fill="url(#gCars)"  name={t.admin.seriesCars}  dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="mb-1 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="size-4 text-purple-500" />{t.admin.chartStatus}
                    </p>
                    <p className="mb-4 text-xs text-gray-400">{stats.totalCars} tổng · {verifiedCount} {t.admin.verifiedCountLabel}</p>
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="shrink-0 space-y-2">
                        {statusPieData.map((item, i) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-500">{item.name}</span>
                            <span className="ml-auto font-semibold tabular-nums pl-3">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand bar + recent lists */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="size-4 text-orange-500" />{t.admin.chartBrand}
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topBrands} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="brand" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name={t.admin.seriesCars} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="size-4 text-yellow-500" />{t.admin.recentUsers}
                      </p>
                      <button onClick={() => switchTab('users')} className="text-xs text-blue-600 hover:underline">{t.admin.viewAll}</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {data.users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-3 py-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(u.full_name?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{u.full_name || <span className="text-gray-400 italic">{t.admin.noName}</span>}</p>
                            <p className="truncate text-xs text-gray-400">{u.email}</p>
                          </div>
                          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', u.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                            {u.role === 'seller' ? t.admin.sellerRole : t.admin.buyerRole}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent cars */}
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Car className="size-4 text-emerald-500" />{t.admin.recentListings}
                    </p>
                    <button onClick={() => switchTab('cars')} className="text-xs text-blue-600 hover:underline">{t.admin.viewAll}</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.cars.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center gap-3 py-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                          {c.brand.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{c.title}</p>
                          <p className="text-xs text-gray-400">{c.seller_name ?? c.seller_email} · {formatDate(c.created_at)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(c.price_vnd)}</p>
                          <StatusBadge status={c.status} statusMap={statusMap} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: USERS ══════════════════════════════════ */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                      <Input placeholder={t.admin.searchUsers} className="pl-8 text-sm w-64 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex rounded-lg border bg-white p-0.5 gap-0.5 text-xs shadow-sm">
                      {(['all', 'seller', 'buyer'] as const).map(r => (
                        <button key={r} onClick={() => setRoleFilter(r)} className={cn('rounded-md px-3 py-1.5 font-medium transition-colors', roleFilter === r ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-900')}>
                          {r === 'all' ? t.admin.allRoles : r === 'seller' ? t.admin.sellerRole : t.admin.buyerRole}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowCreateUser(true); setCreateError(null); setCreateSuccess(false) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <UserCheck className="size-3.5" />{t.admin.createUser}
                  </button>
                </div>

                {/* Create user modal */}
                {showCreateUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowCreateUser(false) }}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-semibold text-gray-900">{t.admin.createUserTitle}</h2>
                          <p className="text-xs text-gray-400 mt-0.5">{t.admin.createUserSubtitle}</p>
                        </div>
                        <button onClick={() => setShowCreateUser(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <X className="size-4" />
                        </button>
                      </div>
                      {createSuccess ? (
                        <div className="flex flex-col items-center gap-3 py-6">
                          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle className="size-7 text-emerald-600" />
                          </div>
                          <p className="font-medium text-emerald-700">{t.admin.createSuccessMsg}</p>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500">{t.admin.fullNameLabel}</label>
                            <Input placeholder="Nguyễn Văn A" value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500">Email <span className="text-red-500">*</span></label>
                            <Input type="email" placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500">{t.admin.passwordLabel} <span className="text-red-500">*</span></label>
                            <Input type="password" placeholder={t.admin.passwordHint} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-500">{t.admin.roleLabel}</label>
                            <div className="flex gap-2">
                              {(['buyer', 'seller'] as const).map(r => (
                                <button key={r} type="button" onClick={() => setNewRole(r)} className={cn('flex-1 rounded-lg border py-2 text-sm font-medium transition-colors', newRole === r ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                                  {r === 'buyer' ? t.admin.buyerRole : t.admin.sellerRole}
                                </button>
                              ))}
                            </div>
                          </div>
                          {createError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{createError}</p>}
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => setShowCreateUser(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t.admin.cancel}</button>
                            <button type="submit" disabled={createLoading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                              {createLoading ? <Loader2 className="size-4 animate-spin" /> : null}{t.admin.createUser}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Users table */}
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colUser}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colPhone}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colType}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colListings}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colJoined}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colPermission}</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">{t.admin.noDataRow}</td></tr>
                        ) : filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {(u.full_name?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 leading-tight flex items-center gap-1">
                                    {u.full_name || <span className="text-gray-400 italic">{t.admin.noName}</span>}
                                    {u.is_admin && <Crown className="size-3 text-yellow-500" />}
                                  </p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{u.phone || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', u.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                                {u.role === 'seller' ? <Car className="size-3" /> : <ShoppingBag className="size-3" />}
                                {u.role === 'seller' ? t.admin.sellerRole : t.admin.buyerRole}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex size-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{u.car_count}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.created_at)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleAdmin(u.id, u.is_admin)}
                                disabled={loadingId === u.id || loadingId === u.id + '_del'}
                                className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border', u.is_admin ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50')}
                              >
                                {loadingId === u.id ? <Loader2 className="size-3 animate-spin" /> : <Crown className="size-3" />}
                                {u.is_admin ? t.admin.adminLabel : t.admin.grantAdmin}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => deleteUser(u.id)}
                                disabled={loadingId === u.id + '_del' || loadingId === u.id}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                {loadingId === u.id + '_del' ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                                Xoá
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: CARS ══════════════════════════════════ */}
            {tab === 'cars' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                      <Input placeholder={t.admin.searchCars} className="pl-8 text-sm w-72 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex rounded-lg border bg-white p-0.5 gap-0.5 text-xs shadow-sm">
                      {(['all', 'active', 'draft', 'hidden', 'sold'] as const).map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={cn('rounded-md px-3 py-1.5 font-medium transition-colors', statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-900')}>
                          {s === 'all' ? t.admin.allRoles : statusMap[s]?.label ?? s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{filteredCars.length} {t.admin.results}</p>
                </div>

                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colListing}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colSeller}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colPrice}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colStatus}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colViews}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colDate}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colActions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredCars.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">{t.admin.noDataRow}</td></tr>
                        ) : filteredCars.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">{c.brand.slice(0, 2).toUpperCase()}</div>
                                <div>
                                  <p className="font-medium text-gray-900 leading-tight line-clamp-1 max-w-[180px]">{c.title}</p>
                                  <p className="text-xs text-gray-400">{c.brand} · {c.year}{c.verified && <span className="ml-1 text-emerald-600">✓</span>}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{c.seller_name || '—'}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[140px]">{c.seller_email}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(c.price_vnd)}</td>
                            <td className="px-4 py-3"><StatusBadge status={c.status} statusMap={statusMap} /></td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 text-gray-400 text-xs"><Eye className="size-3" />{c.view_count}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.created_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {c.status !== 'active' && (
                                  <button onClick={() => setCarStatus(c.id, 'active')} disabled={loadingId === c.id} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                                    {loadingId === c.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}{t.admin.approve}
                                  </button>
                                )}
                                {c.status !== 'hidden' && (
                                  <button onClick={() => setCarStatus(c.id, 'hidden')} disabled={loadingId === c.id} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                                    <EyeOff className="size-3" />{t.admin.hideAction}
                                  </button>
                                )}
                                {c.status !== 'sold' && (
                                  <button onClick={() => setCarStatus(c.id, 'sold')} disabled={loadingId === c.id} className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors">
                                    <Activity className="size-3" />{t.admin.markSold}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: CONTENT ════════════════════════════════ */}
            {tab === 'content' && (
              <form onSubmit={handleSaveConfig} className="space-y-6 max-w-4xl">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="mb-1 text-sm font-semibold text-gray-900">{t.admin.heroSection}</p>
                  <p className="mb-5 text-xs text-gray-400">{t.admin.heroBannerDesc}</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.badgeVi}</label>
                        <Input value={cfg.hero_badge_vi} onChange={e => setCfg(p => ({ ...p, hero_badge_vi: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.badgeEn}</label>
                        <Input value={cfg.hero_badge_en} onChange={e => setCfg(p => ({ ...p, hero_badge_en: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.titleViLabel}</label>
                        <Input value={cfg.hero_title_vi} onChange={e => setCfg(p => ({ ...p, hero_title_vi: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.titleEnLabel}</label>
                        <Input value={cfg.hero_title_en} onChange={e => setCfg(p => ({ ...p, hero_title_en: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.descViLabel}</label>
                        <textarea rows={3} value={cfg.hero_subtitle_vi} onChange={e => setCfg(p => ({ ...p, hero_subtitle_vi: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{t.admin.descEnLabel}</label>
                        <textarea rows={3} value={cfg.hero_subtitle_en} onChange={e => setCfg(p => ({ ...p, hero_subtitle_en: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="mb-1 text-sm font-semibold text-gray-900">{t.admin.statsSection}</p>
                  <p className="mb-5 text-xs text-gray-400">{t.admin.stats4Numbers}</p>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      { key: 'stats_cars_value',   icon: '🚗', label: t.admin.statsCarsLabel },
                      { key: 'stats_users_value',  icon: '👥', label: t.admin.statsUsersLabel },
                      { key: 'stats_deals_value',  icon: '✅', label: t.admin.statsDealsLabel },
                      { key: 'stats_rating_value', icon: '⭐', label: t.admin.statsRatingLabel },
                    ].map(({ key, icon, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">{icon} {label}</label>
                        <Input value={cfg[key as keyof SiteConfig]} onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))} className="text-center font-semibold" />
                      </div>
                    ))}
                  </div>
                </div>

                {cfgError && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{cfgError}</p>}
                {cfgSaved && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                    <CheckCircle className="size-4" /> {t.admin.saved}
                  </div>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={cfgSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm">
                    {cfgSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    {cfgSaving ? t.admin.saving : t.admin.save}
                  </button>
                </div>
              </form>
            )}

            {/* ══ TAB: KYC ══════════════════════════════════ */}
            {tab === 'kyc' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'pending', 'reviewing', 'approved', 'rejected'] as const).map(f => (
                    <button key={f} onClick={() => setKycFilter(f)} className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-sm', kycFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900')}>
                      {f === 'all' ? t.kyc.adminKycAll
                        : f === 'pending'   ? `${t.kyc.adminKycPending} (${kyc.filter(k => k.status === 'pending').length})`
                        : f === 'reviewing' ? t.kyc.adminKycReviewing
                        : f === 'approved'  ? t.kyc.adminKycApproved
                        : t.kyc.adminKycRejected}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colUser}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.kyc.adminColType}</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:table-cell">{t.kyc.adminColSubmitted}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colStatus}</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.colActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredKyc.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">—</td></tr>
                      ) : filteredKyc.map(item => {
                        const style = kycStatusStyle[item.status]
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{item.user_full_name ?? '—'}</p>
                              <p className="text-xs text-gray-400">{item.user_email}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {item.seller_type === 'individual' ? t.kyc.typeIndividual : t.kyc.typeBusiness}
                            </td>
                            <td className="hidden px-4 py-3 text-xs text-gray-400 sm:table-cell">{formatDate(item.submitted_at)}</td>
                            <td className="px-4 py-3">
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', style.color)}>{style.label}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => openKycDocs(item)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                {t.kyc.adminKycViewDocs}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* KYC modal */}
                {kycSelected && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{kycSelected.user_full_name ?? kycSelected.user_email}</p>
                          <p className="text-xs text-gray-400">{kycSelected.user_email} · {kycSelected.seller_type === 'individual' ? t.kyc.typeIndividual : t.kyc.typeBusiness}</p>
                        </div>
                        <button onClick={() => setKycSelected(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="space-y-5 p-6">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-gray-50 p-4 text-sm">
                          {kycSelected.cccd_number  && <><span className="text-gray-400">{t.kyc.cccdNumber}</span><span className="font-medium text-gray-900">{kycSelected.cccd_number}</span></>}
                          {kycSelected.cccd_name    && <><span className="text-gray-400">{t.kyc.cccdName}</span><span className="font-medium text-gray-900">{kycSelected.cccd_name}</span></>}
                          {kycSelected.cccd_dob     && <><span className="text-gray-400">{t.kyc.cccdDob}</span><span className="text-gray-900">{kycSelected.cccd_dob}</span></>}
                          {kycSelected.cccd_address && <><span className="text-gray-400">{t.kyc.cccdAddress}</span><span className="text-gray-900">{kycSelected.cccd_address}</span></>}
                          {kycSelected.business_name    && <><span className="text-gray-400">{t.kyc.businessName}</span><span className="font-medium text-gray-900">{kycSelected.business_name}</span></>}
                          {kycSelected.business_tax_id  && <><span className="text-gray-400">{t.kyc.businessTaxId}</span><span className="text-gray-900">{kycSelected.business_tax_id}</span></>}
                          {kycSelected.business_address && <><span className="text-gray-400">{t.kyc.businessAddress}</span><span className="text-gray-900">{kycSelected.business_address}</span></>}
                        </div>
                        {kycLoadingDocs ? (
                          <div className="flex justify-center py-6"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {[
                              { path: kycSelected.cccd_front_path, label: t.kyc.cccdFront },
                              { path: kycSelected.cccd_back_path,  label: t.kyc.cccdBack },
                              { path: kycSelected.business_license_path, label: t.kyc.businessLicense },
                            ].filter(d => d.path).map(({ path, label }) => (
                              <div key={path}>
                                <p className="mb-1.5 text-xs font-medium text-gray-400">{label}</p>
                                {kycDocUrls[path!] ? (
                                  <a href={kycDocUrls[path!]} target="_blank" rel="noopener noreferrer">
                                    <img src={kycDocUrls[path!]} alt={label} className="w-full rounded-xl border object-cover hover:opacity-90 transition-opacity" />
                                  </a>
                                ) : (
                                  <div className="flex h-24 items-center justify-center rounded-xl border bg-gray-50 text-xs text-gray-400">{path}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Status:</span>
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', kycStatusStyle[kycSelected.status].color)}>
                            {kycStatusStyle[kycSelected.status].label}
                          </span>
                          {kycSelected.reject_reason && <span className="text-xs text-red-500">— {kycSelected.reject_reason}</span>}
                        </div>
                        {(kycSelected.status === 'pending' || kycSelected.status === 'reviewing') && !kycRejectMode && (
                          <div className="flex gap-3">
                            <button onClick={() => handleKycReview('approve')} disabled={kycActionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                              {kycActionLoading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}{t.kyc.adminKycApprove}
                            </button>
                            <button onClick={() => setKycRejectMode(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                              {t.kyc.adminKycReject}
                            </button>
                          </div>
                        )}
                        {kycRejectMode && (
                          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-medium text-gray-900">{t.kyc.adminKycRejectReason}</p>
                            <textarea value={kycRejectReason} onChange={e => setKycRejectReason(e.target.value)} placeholder={t.kyc.adminKycRejectPlaceholder} rows={3} className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => handleKycReview('reject')} disabled={!kycRejectReason.trim() || kycActionLoading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                                {kycActionLoading && <Loader2 className="size-3.5 animate-spin" />}{t.kyc.adminKycReject}
                              </button>
                              <button onClick={() => setKycRejectMode(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t.kyc.back}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
