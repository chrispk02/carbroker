'use client'

import { useState } from 'react'
import {
  Users, Car, Eye, TrendingUp, ShieldCheck, BarChart3,
  Search, Crown, EyeOff, CheckCircle, XCircle, Loader2,
  UserCheck, ShoppingBag, ListChecks, Activity,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { AdminData, AdminUser, AdminCar } from '@/lib/supabase/queries/admin'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:  { label: 'Đang bán',   color: 'bg-emerald-100 text-emerald-700' },
  hidden:  { label: 'Ẩn',         color: 'bg-gray-100 text-gray-600' },
  sold:    { label: 'Đã bán',     color: 'bg-blue-100 text-blue-700' },
  draft:   { label: 'Nháp',       color: 'bg-yellow-100 text-yellow-700' },
}

interface Props { data: AdminData }

export function AdminContent({ data }: Props) {
  const { stats, growth } = data
  const [tab, setTab] = useState<'users' | 'cars'>('users')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>(data.users)
  const [cars, setCars] = useState<AdminCar[]>(data.cars)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // ── Filter ──────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  const filteredCars = cars.filter(c =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.brand.toLowerCase().includes(search.toLowerCase()) ||
    c.seller_email.toLowerCase().includes(search.toLowerCase()) ||
    (c.seller_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Actions ─────────────────────────────────────────────────
  async function toggleAdmin(userId: string, current: boolean) {
    setLoadingId(userId)
    const res = await fetch('/api/admin/toggle-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isAdmin: !current }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u))
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
    if (res.ok) {
      setCars(prev => prev.map(c => c.id === carId ? { ...c, status } : c))
    }
    setLoadingId(null)
  }

  // ── Stat cards ───────────────────────────────────────────────
  const statCards = [
    { label: 'Tổng người dùng',  value: stats.totalUsers,   sub: `+${stats.newUsersToday} hôm nay`,   icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Người bán',        value: stats.totalSellers, sub: `${stats.totalBuyers} người mua`,     icon: UserCheck,  color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Tin đăng active',  value: stats.activeCars,   sub: `${stats.soldCars} đã bán · +${stats.newCarsToday} hôm nay`, icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tổng lượt xem',   value: stats.totalViews,   sub: `${stats.totalCars} tổng tin đăng`,  icon: Eye,        color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Quản lý toàn bộ hệ thống CarBroker</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`size-4 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Tăng trưởng người dùng (14 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(l) => `Ngày ${shortDate(l)}`} />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} name="Người dùng mới" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  Tin đăng mới (14 ngày)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(l) => `Ngày ${shortDate(l)}`} />
                    <Bar dataKey="cars" fill="#10b981" name="Tin đăng mới" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabs + Search */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-lg border p-1 gap-1 w-fit">
              {(['users', 'cars'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch('') }}
                  className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'users' ? <><Users className="size-3.5" /> Người dùng ({users.length})</> : <><Car className="size-3.5" /> Tin đăng ({cars.length})</>}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm..." className="pl-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Users Table */}
          {tab === 'users' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Người dùng</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Số điện thoại</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Loại</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tin đăng</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày đăng ký</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {(u.full_name?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground leading-tight">
                                {u.full_name || 'Chưa cập nhật'}
                                {u.is_admin && <Crown className="ml-1 inline size-3 text-yellow-500" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.role === 'seller' ? <Car className="size-3" /> : <ShoppingBag className="size-3" />}
                            {u.role === 'seller' ? 'Người bán' : 'Người mua'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{u.car_count}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleAdmin(u.id, u.is_admin)}
                            disabled={loadingId === u.id}
                            title={u.is_admin ? 'Thu hồi quyền admin' : 'Cấp quyền admin'}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                              u.is_admin
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {loadingId === u.id
                              ? <Loader2 className="size-3 animate-spin" />
                              : u.is_admin ? <><Crown className="size-3" />Admin</> : 'Cấp admin'
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Cars Table */}
          {tab === 'cars' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tin đăng</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Người bán</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Giá</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trạng thái</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lượt xem</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày đăng</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCars.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                    ) : filteredCars.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground leading-tight line-clamp-1 max-w-[200px]">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.brand} · {c.year}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.seller_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{c.seller_email}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{formatPrice(c.price_vnd)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_MAP[c.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_MAP[c.status]?.label ?? c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{c.view_count}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {c.status !== 'active' && (
                              <button onClick={() => setCarStatus(c.id, 'active')} disabled={loadingId === c.id} title="Kích hoạt" className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                                {loadingId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                              </button>
                            )}
                            {c.status !== 'hidden' && (
                              <button onClick={() => setCarStatus(c.id, 'hidden')} disabled={loadingId === c.id} title="Ẩn tin" className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-50">
                                <EyeOff className="size-3.5" />
                              </button>
                            )}
                            {c.status !== 'sold' && (
                              <button onClick={() => setCarStatus(c.id, 'sold')} disabled={loadingId === c.id} title="Đánh dấu đã bán" className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                                <Activity className="size-3.5" />
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
          )}

        </div>
      </div>
    </>
  )
}
