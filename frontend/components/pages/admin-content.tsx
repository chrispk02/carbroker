'use client'

import { useState, useMemo } from 'react'
import {
  Users, Car, Eye, TrendingUp, ShieldCheck, BarChart3,
  Search, Crown, EyeOff, CheckCircle, Loader2,
  UserCheck, ShoppingBag, ListChecks, Activity, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  Clock, Star,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import type { AdminData, AdminUser, AdminCar, SiteConfig } from '@/lib/supabase/queries/admin'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

// ── Constants ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  active:  { label: 'Đang bán', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200/50', dot: 'bg-emerald-500' },
  hidden:  { label: 'Ẩn',       color: 'bg-gray-100 text-gray-600 ring-gray-200/50',          dot: 'bg-gray-400' },
  sold:    { label: 'Đã bán',   color: 'bg-blue-100 text-blue-700 ring-blue-200/50',           dot: 'bg-blue-500' },
  draft:   { label: 'Nháp',     color: 'bg-amber-100 text-amber-700 ring-amber-200/50',        dot: 'bg-amber-500' },
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280']

// ── Subcomponents ────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, bg, trend,
}: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; color: string; bg: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <div className="mt-1 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight className="size-3 text-emerald-500 shrink-0" />}
              {trend === 'down' && <ArrowDownRight className="size-3 text-red-500 shrink-0" />}
              {trend === 'neutral' && <Minus className="size-3 text-muted-foreground shrink-0" />}
              <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
            </div>
          </div>
          <div className={`ml-3 flex size-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`size-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
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
  const { stats, growth } = data
  const [tab, setTab] = useState<'overview' | 'users' | 'cars' | 'content'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [users, setUsers] = useState<AdminUser[]>(data.users)
  const [cars, setCars] = useState<AdminCar[]>(data.cars)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // ── Create user modal state ───────────────────────────────
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState<'buyer' | 'seller'>('buyer')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  // ── Site config editor state ──────────────────────────────
  const [cfg, setCfg] = useState<SiteConfig>(initialSiteConfig)
  const [cfgSaving, setCfgSaving] = useState(false)
  const [cfgSaved, setCfgSaved] = useState(false)
  const [cfgError, setCfgError] = useState<string | null>(null)

  // ── Derived analytics ────────────────────────────────────
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
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([brand, count]) => ({ brand, count }))
  }, [data.cars])

  const statusPieData = useMemo(() => [
    { name: 'Đang bán', value: stats.activeCars },
    { name: 'Đã bán',   value: stats.soldCars },
    { name: 'Nháp',     value: data.cars.filter(c => c.status === 'draft').length },
    { name: 'Ẩn',       value: data.cars.filter(c => c.status === 'hidden').length },
  ].filter(d => d.value > 0), [stats, data.cars])

  const verifiedCount = data.cars.filter(c => c.verified).length

  // ── Filters ──────────────────────────────────────────────
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

  // ── Create user ──────────────────────────────────────────
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

  // ── Save site config ──────────────────────────────────────
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

  // ── Stat cards data ──────────────────────────────────────
  const statCards = [
    {
      label: 'Tổng người dùng',
      value: stats.totalUsers,
      sub: `+${stats.newUsersToday} hôm nay`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: stats.newUsersToday > 0 ? 'up' : 'neutral',
    },
    {
      label: 'Người bán / Người mua',
      value: `${stats.totalSellers} / ${stats.totalBuyers}`,
      sub: `${stats.totalSellers ? Math.round(stats.totalSellers / stats.totalUsers * 100) : 0}% là người bán`,
      icon: UserCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: 'neutral',
    },
    {
      label: 'Tin đang bán',
      value: stats.activeCars,
      sub: `${stats.soldCars} đã bán · +${stats.newCarsToday} hôm nay`,
      icon: ListChecks,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: stats.newCarsToday > 0 ? 'up' : 'neutral',
    },
    {
      label: 'Tổng lượt xem',
      value: stats.totalViews,
      sub: `${stats.totalCars} tổng tin đăng`,
      icon: Eye,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: 'up',
    },
    {
      label: 'Giá trung bình',
      value: avgPrice ? formatPrice(avgPrice) : '—',
      sub: 'Xe đang bán',
      icon: DollarSign,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      trend: 'neutral',
    },
    {
      label: 'Tỉ lệ bán thành công',
      value: `${conversionRate}%`,
      sub: `${stats.soldCars} / ${stats.totalCars} tin đăng`,
      icon: TrendingUp,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      trend: conversionRate > 20 ? 'up' : 'neutral',
    },
  ] as const

  const tabs = [
    { key: 'overview', label: 'Tổng quan',                   icon: BarChart3 },
    { key: 'users',    label: `Người dùng (${users.length})`, icon: Users },
    { key: 'cars',     label: `Tin đăng (${cars.length})`,    icon: Car },
    { key: 'content',  label: 'Nội dung trang',               icon: ShieldCheck },
  ] as const

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Quản lý toàn bộ hệ thống CarBroker</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRefreshing(true); setTimeout(() => { setRefreshing(false); window.location.reload() }, 500) }}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} trend={card.trend as 'up' | 'down' | 'neutral'} />
            ))}
          </div>

          {/* ── Tab Navigation ── */}
          <div className="mb-6 flex items-center gap-1 rounded-xl border bg-background p-1 w-fit shadow-sm">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key as typeof tab); setSearch(''); setStatusFilter('all'); setRoleFilter('all') }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  tab === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════
              TAB: OVERVIEW
          ══════════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-6">

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Growth area chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="size-4 text-muted-foreground" />
                      Tăng trưởng 14 ngày qua
                    </CardTitle>
                    <CardDescription className="text-xs">Người dùng mới và tin đăng mới</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={growth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCars" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={(l) => `Ngày ${shortDate(l as string)}`}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#colorUsers)" name="Người dùng mới" dot={false} />
                        <Area type="monotone" dataKey="cars"  stroke="#10b981" strokeWidth={2} fill="url(#colorCars)"  name="Tin đăng mới"  dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status pie chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Activity className="size-4 text-muted-foreground" />
                      Phân bổ trạng thái tin đăng
                    </CardTitle>
                    <CardDescription className="text-xs">Tổng {stats.totalCars} tin đăng · {verifiedCount} đã xác minh</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={statusPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="shrink-0 space-y-2">
                        {statusPieData.map((item, i) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="ml-auto font-semibold tabular-nums pl-3">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top brands */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Star className="size-4 text-muted-foreground" />
                      Hãng xe phổ biến nhất
                    </CardTitle>
                    <CardDescription className="text-xs">Top 6 hãng theo số tin đăng</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topBrands.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={topBrands} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis dataKey="brand" type="category" tick={{ fontSize: 11 }} width={60} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="count" fill="#8b5cf6" name="Tin đăng" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Summary metrics */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      Chỉ số tổng hợp
                    </CardTitle>
                    <CardDescription className="text-xs">Hiệu suất hệ thống</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    {[
                      { label: 'Tỉ lệ người bán / người mua', value: stats.totalUsers ? `${Math.round(stats.totalSellers / stats.totalUsers * 100)}%` : '—', note: `${stats.totalSellers} người bán` },
                      { label: 'Lượt xem / tin đăng',         value: stats.totalCars ? Math.round(stats.totalViews / stats.totalCars).toLocaleString() : '—', note: 'Trung bình' },
                      { label: 'Tỉ lệ chuyển đổi (bán)',      value: `${conversionRate}%`, note: `${stats.soldCars} xe đã bán` },
                      { label: 'Tin xác minh',                value: `${verifiedCount}/${stats.totalCars}`, note: stats.totalCars ? `${Math.round(verifiedCount / stats.totalCars * 100)}% đã xác minh` : '—' },
                      { label: 'Người dùng mới hôm nay',      value: stats.newUsersToday, note: `+${stats.newCarsToday} tin đăng mới` },
                      { label: 'Giá trung bình xe đang bán',  value: avgPrice ? formatPrice(avgPrice) : '—', note: `${stats.activeCars} tin active` },
                    ].map(({ label, value, note }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div>
                          <p className="text-xs font-medium text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground">{note}</p>
                        </div>
                        <p className="text-sm font-bold text-foreground tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent cars */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="size-4 text-muted-foreground" />
                      Tin đăng gần đây
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">5 tin đăng mới nhất</CardDescription>
                  </div>
                  <button onClick={() => setTab('cars')} className="text-xs text-accent hover:underline">Xem tất cả →</button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {data.cars.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center gap-3 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                          {c.brand.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.seller_name ?? c.seller_email} · {formatDate(c.created_at)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-foreground">{formatPrice(c.price_vnd)}</p>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                    {data.cars.length === 0 && (
                      <p className="py-6 text-center text-sm text-muted-foreground">Chưa có tin đăng nào</p>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: USERS
          ══════════════════════════════════════════════════════ */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm tên, email, SĐT..."
                      className="pl-8 text-sm w-64"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex rounded-lg border bg-background p-0.5 gap-0.5 text-xs">
                    {(['all', 'seller', 'buyer'] as const).map(r => (
                      <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${roleFilter === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {r === 'all' ? 'Tất cả' : r === 'seller' ? 'Người bán' : 'Người mua'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{filteredUsers.length} kết quả</p>
                  <button
                    onClick={() => { setShowCreateUser(true); setCreateError(null); setCreateSuccess(false) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <UserCheck className="size-3" />
                    Tạo user mới
                  </button>
                </div>
              </div>

              {/* Create user modal */}
              {showCreateUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateUser(false) }}>
                  <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Tạo user mới</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Tài khoản sẽ được kích hoạt ngay</p>
                      </div>
                      <button onClick={() => setShowCreateUser(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">✕</button>
                    </div>

                    {createSuccess ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
                          <CheckCircle className="size-7 text-emerald-600" />
                        </div>
                        <p className="font-medium text-emerald-700">Tạo user thành công!</p>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Họ và tên</label>
                          <Input placeholder="Nguyễn Văn A" value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Email <span className="text-destructive">*</span></label>
                          <Input type="email" placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Mật khẩu <span className="text-destructive">*</span></label>
                          <Input type="password" placeholder="Tối thiểu 6 ký tự" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Loại tài khoản</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['buyer', 'seller'] as const).map(r => (
                              <button key={r} type="button" onClick={() => setNewRole(r)}
                                className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${newRole === r ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}>
                                {r === 'seller' ? <Car className="size-4" /> : <ShoppingBag className="size-4" />}
                                {r === 'seller' ? 'Người bán' : 'Người mua'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {createError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{createError}</p>}
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => setShowCreateUser(false)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Hủy</button>
                          <button type="submit" disabled={createLoading} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                            {createLoading ? <Loader2 className="mx-auto size-4 animate-spin" /> : 'Tạo user'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người dùng</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số điện thoại</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Loại</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tin đăng</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày đăng ký</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quyền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Không có dữ liệu</td></tr>
                      ) : filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {(u.full_name?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground leading-tight flex items-center gap-1">
                                  {u.full_name || <span className="text-muted-foreground italic">Chưa đặt tên</span>}
                                  {u.is_admin && <Crown className="size-3 text-yellow-500" />}
                                </p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{u.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              u.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.role === 'seller' ? <Car className="size-3" /> : <ShoppingBag className="size-3" />}
                              {u.role === 'seller' ? 'Người bán' : 'Người mua'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {u.car_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(u.created_at)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleAdmin(u.id, u.is_admin)}
                              disabled={loadingId === u.id}
                              title={u.is_admin ? 'Thu hồi quyền admin' : 'Cấp quyền admin'}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                                u.is_admin
                                  ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {loadingId === u.id
                                ? <Loader2 className="size-3 animate-spin" />
                                : <Crown className="size-3" />
                              }
                              {u.is_admin ? 'Admin' : 'Cấp admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: CARS
          ══════════════════════════════════════════════════════ */}
          {tab === 'cars' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm tiêu đề, hãng, người bán..."
                      className="pl-8 text-sm w-72"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex rounded-lg border bg-background p-0.5 gap-0.5 text-xs">
                    {(['all', 'active', 'draft', 'hidden', 'sold'] as const).map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        {s === 'all' ? 'Tất cả' : STATUS_MAP[s]?.label ?? s}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{filteredCars.length} kết quả</p>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tin đăng</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Người bán</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giá</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lượt xem</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ngày đăng</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCars.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Không có dữ liệu</td></tr>
                      ) : filteredCars.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                                {c.brand.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground leading-tight line-clamp-1 max-w-[180px]">{c.title}</p>
                                <p className="text-xs text-muted-foreground">{c.brand} · {c.year}{c.verified && <span className="ml-1 text-emerald-600">✓</span>}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{c.seller_name || '—'}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{c.seller_email}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatPrice(c.price_vnd)}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Eye className="size-3" />{c.view_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(c.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {c.status !== 'active' && (
                                <button
                                  onClick={() => setCarStatus(c.id, 'active')}
                                  disabled={loadingId === c.id}
                                  title="Kích hoạt"
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                >
                                  {loadingId === c.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                                  Duyệt
                                </button>
                              )}
                              {c.status !== 'hidden' && (
                                <button
                                  onClick={() => setCarStatus(c.id, 'hidden')}
                                  disabled={loadingId === c.id}
                                  title="Ẩn tin"
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                                >
                                  <EyeOff className="size-3" />
                                  Ẩn
                                </button>
                              )}
                              {c.status !== 'sold' && (
                                <button
                                  onClick={() => setCarStatus(c.id, 'sold')}
                                  disabled={loadingId === c.id}
                                  title="Đánh dấu đã bán"
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                  <Activity className="size-3" />
                                  Đã bán
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: CONTENT
          ══════════════════════════════════════════════════════ */}
          {tab === 'content' && (
            <form onSubmit={handleSaveConfig} className="space-y-6">

              {/* Hero section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Hero Section</CardTitle>
                  <CardDescription className="text-xs">Phần banner đầu trang chủ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Badge (Tiếng Việt)</label>
                      <Input value={cfg.hero_badge_vi} onChange={e => setCfg(p => ({ ...p, hero_badge_vi: e.target.value }))} placeholder="Nền tảng mua bán xe uy tín #1 Việt Nam" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Badge (English)</label>
                      <Input value={cfg.hero_badge_en} onChange={e => setCfg(p => ({ ...p, hero_badge_en: e.target.value }))} placeholder="Vietnam's #1 Trusted Car Marketplace" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Tiêu đề (Tiếng Việt)</label>
                      <Input value={cfg.hero_title_vi} onChange={e => setCfg(p => ({ ...p, hero_title_vi: e.target.value }))} placeholder="Mua bán xe ô tô an toàn, minh bạch" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Tiêu đề (English)</label>
                      <Input value={cfg.hero_title_en} onChange={e => setCfg(p => ({ ...p, hero_title_en: e.target.value }))} placeholder="Buy & Sell Cars Safely, Transparently" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Mô tả (Tiếng Việt)</label>
                      <textarea
                        rows={3}
                        value={cfg.hero_subtitle_vi}
                        onChange={e => setCfg(p => ({ ...p, hero_subtitle_vi: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        placeholder="Kết nối người mua và người bán..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Mô tả (English)</label>
                      <textarea
                        rows={3}
                        value={cfg.hero_subtitle_en}
                        onChange={e => setCfg(p => ({ ...p, hero_subtitle_en: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        placeholder="Connect buyers and sellers..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Số liệu nổi bật</CardTitle>
                  <CardDescription className="text-xs">4 con số hiển thị bên dưới hero section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      { key: 'stats_cars_value',   icon: '🚗', label: 'Xe đang bán' },
                      { key: 'stats_users_value',  icon: '👥', label: 'Người dùng' },
                      { key: 'stats_deals_value',  icon: '✅', label: 'Giao dịch thành công' },
                      { key: 'stats_rating_value', icon: '⭐', label: 'Đánh giá' },
                    ].map(({ key, icon, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{icon} {label}</label>
                        <Input
                          value={cfg[key as keyof SiteConfig]}
                          onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="1.200+"
                          className="text-center font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save button */}
              {cfgError && (
                <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{cfgError}</p>
              )}
              {cfgSaved && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <CheckCircle className="size-4" /> Đã lưu thành công! Trang chủ sẽ cập nhật sau vài giây.
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={cfgSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {cfgSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                  {cfgSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  )
}
