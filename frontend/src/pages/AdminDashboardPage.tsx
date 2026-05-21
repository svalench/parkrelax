import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  format,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  differenceInCalendarDays,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  History,
  BarChart3,
  Home,
  Users,
  BedDouble,
  Loader2,
  LogOut,
  Search,
  TrendingUp,
  CreditCard,
  Activity,
  Clock,
  Plus,
  Trash2,
  XCircle,
  Images,
  Star,
  Bike,
  Mail,
  Pencil,
  Flame,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import AccommodationManager from '@/components/AccommodationManager'
import { BookingSettingsCard } from '@/components/BookingSettingsCard'
import RentalManager from '@/components/RentalManager'
import BanyaManager from '@/components/BanyaManager'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

const API_BASE = '/api'

/* ── Types ─────────────────────────────────────────────────────── */

interface WeekBooking {
  id: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  startDate: string
  endDate: string
  adults: number
  children: number
  status: string
  daysLeft?: number
}

interface WeekHouse {
  id: number
  name: string
  typeName?: string
  bookings: WeekBooking[]
  isOccupied: boolean
  occupiedDays: number
}

interface WeekData {
  weekStart: string
  weekEnd: string
  totalHouses: number
  totalDays: number
  occupiedDays: number
  freeDays: number
  occupancyRate: number
  houses: WeekHouse[]
}

interface HistoryItem {
  id: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  startDate: string
  endDate: string
  adults: number
  children: number
  status: string
  accommodation?: { id: number; name: string; typeName?: string }
  createdAt?: string
}

interface StatsData {
  totalBookings: number
  monthBookings: number
  todayBookings: number
  activeBookings: number
  estimatedRevenue: number
  statusCounts: Record<string, number>
}

interface OccupancyType {
  typeId: number
  typeName: string
  totalHouses: number
  totalDays: number
  occupiedDays: number
  occupancyRate: number
}

interface OccupancyData {
  periodStart: string
  periodEnd: string
  types: OccupancyType[]
}

interface AccommodationOption {
  id: number
  name: string
}

interface TypeOption {
  id: number
  name: string
}

interface ReviewItem {
  id: number
  name: string
  rating: number
  text: string
  avatarUrl?: string | null
  yandexReviewId?: string | null
  isActive: boolean
  createdAt?: string | null
}

/* ── Helpers ───────────────────────────────────────────────────── */

function statusColor(status: string) {
  switch (status) {
    case 'confirmed':
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'confirmed':
      return 'Подтверждено'
    case 'paid':
      return 'Оплачено'
    case 'pending':
      return 'Ожидание'
    case 'cancelled':
      return 'Отменено'
    default:
      return status
  }
}

const COLORS = ['#8BA84B', '#1e6091', '#e76f51', '#f4a261', '#2a9d8f', '#e9c46a', '#264653']

/* ── Page ──────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<{ id: number; username: string; name?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  /* Auth */
  useEffect(() => {
    fetch(`${API_BASE}/admin-auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAdmin(data))
      .finally(() => setAuthLoading(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const res = await fetch(`${API_BASE}/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginForm),
    })
    if (res.ok) {
      const data = await res.json()
      setAdmin(data)
    } else {
      setLoginError('Неверное имя пользователя или пароль')
    }
  }

  const handleLogout = async () => {
    await fetch(`${API_BASE}/admin-auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    setAdmin(null)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightgray">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightgray px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Вход в админ-панель</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Логин</label>
                <Input
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Пароль</label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <Button type="submit" className="w-full bg-brand hover:bg-brand-hover">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lightgray">
      <div className="container-main py-6 md:py-8 pt-24 md:pt-28">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-dark flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-brand" />
              Админ-панель
            </h1>
            <p className="text-graytext mt-1">Управление бронированиями и статистика</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-graytext">{admin.name || admin.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>

        <BookingSettingsCard />

        <Tabs defaultValue="week" className="space-y-6">
          <TabsList className="bg-white border shadow-sm overflow-x-auto whitespace-nowrap w-full">
            <TabsTrigger value="month" className="gap-1.5">
              <CalendarRange className="w-4 h-4" />
              Месяц
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Неделя
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-4 h-4" />
              История
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="occupancy" className="gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="accommodations" className="gap-1.5">
              <Images className="w-4 h-4" />
              Размещения
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5">
              <Star className="w-4 h-4" />
              Отзывы
            </TabsTrigger>
            <TabsTrigger value="rentals" className="gap-1.5">
              <Bike className="w-4 h-4" />
              Аренда
            </TabsTrigger>
            <TabsTrigger value="banya" className="gap-1.5">
              <Flame className="w-4 h-4" />
              Баня
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="w-4 h-4" />
              Почта
            </TabsTrigger>
          </TabsList>

          <TabsContent value="month">
            <MonthTab />
          </TabsContent>
          <TabsContent value="week">
            <WeekTab />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
          <TabsContent value="occupancy">
            <OccupancyTab />
          </TabsContent>
          <TabsContent value="accommodations">
            <AccommodationManager />
          </TabsContent>
          <TabsContent value="reviews">
            <ReviewsTab />
          </TabsContent>
          <TabsContent value="rentals">
            <RentalManager />
          </TabsContent>
          <TabsContent value="banya">
            <BanyaManager />
          </TabsContent>
          <TabsContent value="email">
            <EmailTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* ── Month Tab ─────────────────────────────────────────────────── */

interface MonthData {
  monthStart: string
  monthEnd: string
  days: string[]
  houses: WeekHouse[]
}

function MonthTab() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [data, setData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<WeekBooking | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formInitial, setFormInitial] = useState<{ accommodationId?: number; startDate?: string; endDate?: string }>({})
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadData = () => {
    setLoading(true)
    const dateParam = format(currentDate, 'yyyy-MM-dd')
    fetch(`${API_BASE}/admin/dashboard/month?date=${dateParam}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [currentDate])

  const prevMonth = () => setCurrentDate((d) => subMonths(d, 1))
  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1))

  const days = data?.days ?? []
  const daysInMonth = days.length
  const monthStartDate = data ? parseISO(data.monthStart) : new Date()

  const renderCells = (house: WeekHouse) => {
    if (!data) return null
    const skip = new Array(daysInMonth).fill(false)
    const cells: React.ReactNode[] = []

    for (let i = 0; i < daysInMonth; i++) {
      if (skip[i]) continue

      const booking = house.bookings.find((b) => {
        const bStart = parseISO(b.startDate)
        const startIndex = differenceInCalendarDays(bStart, monthStartDate)
        return startIndex === i
      })

      if (booking) {
        const bStart = parseISO(booking.startDate)
        const bEnd = parseISO(booking.endDate)
        let startIndex = differenceInCalendarDays(bStart, monthStartDate)
        if (startIndex < 0) startIndex = 0
        let endIndex = differenceInCalendarDays(bEnd, monthStartDate)
        if (endIndex > daysInMonth) endIndex = daysInMonth
        const span = endIndex - startIndex

        for (let j = startIndex; j < endIndex; j++) skip[j] = true

        cells.push(
          <td key={`${house.id}-b${booking.id}`} colSpan={Math.max(1, span)} className="p-0.5">
            <button
              className={`w-full rounded-md px-2 py-1.5 text-xs border text-left cursor-pointer hover:opacity-90 transition-opacity ${statusColor(booking.status)}`}
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="font-semibold truncate">{booking.customerName}</div>
              <div className="opacity-80 truncate text-[10px]">{booking.customerPhone}</div>
            </button>
          </td>
        )
      } else {
        cells.push(
          <td
            key={`${house.id}-d${i}`}
            className="text-center text-xs text-graytext p-0.5 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => {
              const day = days[i]
              const nextDay = format(parseISO(day), 'yyyy-MM-dd')
              setFormInitial({ accommodationId: house.id, startDate: nextDay, endDate: nextDay })
              setShowForm(true)
            }}
          >
            —
          </td>
        )
      }
    }

    return cells
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="bg-white border rounded-xl px-4 py-2 text-sm font-medium min-w-[160px] text-center capitalize">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-brand hover:bg-brand-hover gap-1"
            size="sm"
            onClick={() => {
              setFormInitial({})
              setShowForm(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Новое бронирование
          </Button>
          <Badge variant="outline" className="gap-1">
            <CalendarRange className="w-3.5 h-3.5" />
            {daysInMonth} дн.
          </Badge>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border shadow-sm p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : !data || data.houses.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
          <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-graytext">Нет данных о домах</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="sticky left-0 bg-slate-50 text-left px-3 py-2 font-semibold text-dark min-w-[160px] z-10 border-r">
                    Дом
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className={`text-center px-0.5 py-2 font-semibold text-dark min-w-[34px] ${[0, 6].includes(parseISO(d).getDay()) ? 'bg-slate-100/50 text-graytext' : ''}`}
                    >
                      <div className="text-[10px] text-graytext uppercase">{format(parseISO(d), 'EEE', { locale: ru })}</div>
                      <div>{format(parseISO(d), 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.houses.map((house) => (
                  <tr key={house.id} className="border-b last:border-0 hover:bg-slate-50/60">
                    <td className="sticky left-0 bg-white px-3 py-2 border-r z-10">
                      <div className="font-medium text-dark">{house.name}</div>
                      <div className="text-xs text-graytext">{house.typeName || '—'}</div>
                    </td>
                    {renderCells(house)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(v) => !v && setSelectedBooking(null)}
        onRefresh={loadData}
        onEdit={(b) => setEditingId(b.id)}
      />
      <BookingFormDialog
        open={showForm || editingId !== null}
        onOpenChange={(v) => {
          setShowForm(v)
          if (!v) setEditingId(null)
        }}
        initialData={formInitial}
        onSuccess={() => {
          loadData()
          setEditingId(null)
        }}
        editingId={editingId}
      />
    </div>
  )
}

/* ── Booking Detail Dialog ───────────────────────────────────── */

function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  onRefresh,
  onEdit,
}: {
  booking: WeekBooking | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onRefresh: () => void
  onEdit?: (booking: WeekBooking) => void
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleCancel = async () => {
    if (!booking) return
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (res.ok) {
        toast.success('Бронирование отменено')
        onOpenChange(false)
        onRefresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка отмены')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleDelete = async () => {
    if (!booking) return
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/bookings/${booking.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Бронирование удалено')
        setShowDeleteConfirm(false)
        onOpenChange(false)
        onRefresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Бронирование #{booking?.id}</DialogTitle>
          </DialogHeader>
          {booking && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-graytext">Клиент</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graytext">Телефон</span>
                <span className="font-medium">{booking.customerPhone}</span>
              </div>
              {booking.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-graytext">Email</span>
                  <span className="font-medium">{booking.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-graytext">Заезд — Выезд</span>
                <span className="font-medium">
                  {format(parseISO(booking.startDate), 'dd.MM.yyyy')} — {format(parseISO(booking.endDate), 'dd.MM.yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-graytext">Гости</span>
                <span className="font-medium">{booking.adults + booking.children} чел.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graytext">Статус</span>
                <Badge variant="outline" className={statusColor(booking.status)}>
                  {statusLabel(booking.status)}
                </Badge>
              </div>
              {booking.daysLeft && booking.daysLeft > 0 && (
                <div className="flex justify-between">
                  <span className="text-graytext">Осталось</span>
                  <span className="font-medium">{booking.daysLeft} дн.</span>
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t">
                {onEdit && (
                  <Button variant="outline" className="flex-1 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => { onEdit(booking); onOpenChange(false) }}>
                    <Pencil className="w-4 h-4" />
                    Редактировать
                  </Button>
                )}
                {booking.status !== 'cancelled' && (
                  <Button variant="outline" className="flex-1 gap-1 text-amber-700 border-amber-200 hover:bg-amber-50" onClick={handleCancel}>
                    <XCircle className="w-4 h-4" />
                    Отменить
                  </Button>
                )}
                <Button variant="outline" className="flex-1 gap-1 text-red-700 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бронирование?</AlertDialogTitle>
            <AlertDialogDescription>
              Бронирование #{booking?.id} будет безвозвратно удалено. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ── Booking Form Dialog ──────────────────────────────────────── */

interface BookingFormData {
  accommodationId: string
  startDate: string
  endDate: string
  customerName: string
  customerPhone: string
  customerEmail: string
  people: number
  status: string
  notes: string
}

function BookingFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
  editingId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialData?: { accommodationId?: number; startDate?: string; endDate?: string }
  onSuccess: () => void
  editingId?: number | null
}) {
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [form, setForm] = useState<BookingFormData>({
    accommodationId: initialData?.accommodationId ? String(initialData.accommodationId) : '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    people: 1,
    status: 'confirmed',
    notes: '',
  })

  useEffect(() => {
    fetch(`${API_BASE}/accommodation/objects?activeOnly=false`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setAccommodations(data))
  }, [])

  useEffect(() => {
    if (open && editingId) {
      setLoadingBooking(true)
      fetch(`${API_BASE}/admin/dashboard/bookings/${editingId}`, { credentials: 'include' })
        .then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({}))
            toast.error(err.detail || 'Не удалось загрузить бронирование')
            return null
          }
          return r.json()
        })
        .then((data) => {
          if (data) {
            setForm({
              accommodationId: data.accommodationId ? String(data.accommodationId) : '',
              startDate: data.startDate?.slice?.(0, 10) || data.startDate || '',
              endDate: data.endDate?.slice?.(0, 10) || data.endDate || '',
              customerName: data.customerName || '',
              customerPhone: data.customerPhone || '',
              customerEmail: data.customerEmail || '',
              people: data.adults || 1,
              status: data.status || 'confirmed',
              notes: data.notes || '',
            })
          }
        })
        .finally(() => setLoadingBooking(false))
    } else if (open) {
      setForm({
        accommodationId: initialData?.accommodationId ? String(initialData.accommodationId) : '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        people: 1,
        status: 'confirmed',
        notes: '',
      })
    }
  }, [open, initialData, editingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.accommodationId || !form.startDate || !form.endDate || !form.customerName || !form.customerPhone) {
      toast.error('Заполните обязательные поля')
      return
    }
    if (form.endDate <= form.startDate) {
      toast.error('Дата выезда должна быть позже даты заезда')
      return
    }
    setLoading(true)
    try {
      const url = editingId
        ? `${API_BASE}/admin/dashboard/bookings/${editingId}`
        : `${API_BASE}/admin/dashboard/bookings`
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          accommodationId: Number(form.accommodationId),
          adults: Number(form.people),
          children: 0,
        }),
      })
      if (res.ok) {
        toast.success(editingId ? 'Бронирование обновлено' : 'Бронирование создано')
        onOpenChange(false)
        onSuccess()
      } else if (res.status === 409) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Данный дом занят на выбранный период')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || (editingId ? 'Ошибка обновления' : 'Ошибка создания бронирования'))
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Редактирование бронирования' : 'Новое бронирование'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingBooking && (
            <div className="flex items-center justify-center py-8 text-graytext">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Загрузка…
            </div>
          )}
          {!loadingBooking && (<>
          <div>
            <label className="text-sm font-medium mb-1 block">Дом <span className="text-red-500">*</span></label>
            <Select value={form.accommodationId} onValueChange={(v) => setForm((p) => ({ ...p, accommodationId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите дом" />
              </SelectTrigger>
              <SelectContent>
                {accommodations.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Заезд <span className="text-red-500">*</span></label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Выезд <span className="text-red-500">*</span></label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Имя клиента <span className="text-red-500">*</span></label>
            <Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Телефон <span className="text-red-500">*</span></label>
              <Input value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Количество человек</label>
              <Input type="number" min={1} value={form.people} onChange={(e) => setForm((p) => ({ ...p, people: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Статус</label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Ожидание</SelectItem>
                  <SelectItem value="confirmed">Подтверждено</SelectItem>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Примечания</label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" className="bg-brand hover:bg-brand-hover" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Сохранить изменения' : 'Создать бронирование'}
            </Button>
          </div>
          </>)}
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Week Tab ──────────────────────────────────────────────────── */

function WeekTab() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<WeekBooking | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formInitial, setFormInitial] = useState<{ accommodationId?: number; startDate?: string; endDate?: string }>({})
  const [editingId, setEditingId] = useState<number | null>(null)

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])

  const loadData = () => {
    setLoading(true)
    const dateParam = format(currentDate, 'yyyy-MM-dd')
    fetch(`${API_BASE}/admin/dashboard/week?date=${dateParam}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [currentDate])

  const prevWeek = () => setCurrentDate((d) => subWeeks(d, 1))
  const nextWeek = () => setCurrentDate((d) => addWeeks(d, 1))

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="bg-white border rounded-xl px-4 py-2 text-sm font-medium min-w-[200px] text-center">
            {format(weekStart, 'dd.MM.yyyy')} — {format(weekEnd, 'dd.MM.yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-brand hover:bg-brand-hover gap-1"
            size="sm"
            onClick={() => {
              setFormInitial({})
              setShowForm(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Новое бронирование
          </Button>
          <Badge variant="outline" className="gap-1">
            <Home className="w-3.5 h-3.5" />
            {data?.totalHouses ?? 0} домов
          </Badge>
          <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50">
            <BedDouble className="w-3.5 h-3.5" />
            Свободно: {data?.freeDays ?? 0} дн.
          </Badge>
          <Badge variant="outline" className="gap-1 text-amber-700 border-amber-200 bg-amber-50">
            <Users className="w-3.5 h-3.5" />
            Занято: {data?.occupiedDays ?? 0} дн.
          </Badge>
          <Badge variant="outline" className="gap-1">
            {data?.occupancyRate ?? 0}% загрузки
          </Badge>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border shadow-sm p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : !data || data.houses.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
          <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-graytext">Нет данных о домах</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-dark min-w-[180px]">Дом / Тип</th>
                  {weekDays.map((d) => (
                    <th key={d.toISOString()} className="text-center px-2 py-3 font-semibold text-dark min-w-[100px]">
                      <div className="text-xs text-graytext uppercase">{format(d, 'EEE', { locale: ru })}</div>
                      <div>{format(d, 'dd.MM')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.houses.map((house) => (
                  <tr key={house.id} className="border-b last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark">{house.name}</div>
                      <div className="text-xs text-graytext">{house.typeName || '—'}</div>
                    </td>
                    {weekDays.map((d) => {
                      const booking = house.bookings.find((b) => {
                        const s = parseISO(b.startDate)
                        const e = parseISO(b.endDate)
                        return isWithinInterval(d, { start: s, end: e }) || d.getTime() === s.getTime()
                      })
                      return (
                        <td key={d.toISOString()} className="px-2 py-3 align-top">
                          {booking ? (
                            <button
                              className={`w-full text-left rounded-lg px-2 py-1.5 text-xs border cursor-pointer hover:opacity-90 transition-opacity ${statusColor(booking.status)}`}
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <div className="font-semibold truncate">{booking.customerName}</div>
                              <div className="opacity-80 truncate">{booking.customerPhone}</div>
                              {booking.daysLeft && booking.daysLeft > 0 && booking.daysLeft <= 7 && (
                                <div className="mt-0.5 text-[10px] font-medium">
                                  Осталось {booking.daysLeft} дн.
                                </div>
                              )}
                            </button>
                          ) : (
                            <div
                              className="text-center text-xs text-graytext cursor-pointer hover:bg-slate-100 rounded py-2 transition-colors"
                              onClick={() => {
                                const start = format(d, 'yyyy-MM-dd')
                                const end = format(d, 'yyyy-MM-dd')
                                setFormInitial({ accommodationId: house.id, startDate: start, endDate: end })
                                setShowForm(true)
                              }}
                            >
                              —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(v) => !v && setSelectedBooking(null)}
        onRefresh={loadData}
        onEdit={(b) => setEditingId(b.id)}
      />
      <BookingFormDialog
        open={showForm || editingId !== null}
        onOpenChange={(v) => {
          setShowForm(v)
          if (!v) setEditingId(null)
        }}
        initialData={formInitial}
        onSuccess={() => {
          loadData()
          setEditingId(null)
        }}
        editingId={editingId}
      />
    </div>
  )
}

/* ── History Tab ───────────────────────────────────────────────── */

function HistoryTab() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([])
  const [types, setTypes] = useState<TypeOption[]>([])

  const [filters, setFilters] = useState({
    accommodationId: 'all',
    typeId: 'all',
    startFrom: '',
    startTo: '',
    status: 'all',
  })

  useEffect(() => {
    fetch(`${API_BASE}/accommodation/objects?activeOnly=false`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setAccommodations(data))
    fetch(`${API_BASE}/accommodation/types`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setTypes(data))
  }, [])

  const loadHistory = () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (filters.accommodationId && filters.accommodationId !== 'all') params.set('accommodationId', filters.accommodationId)
    if (filters.typeId && filters.typeId !== 'all') params.set('typeId', filters.typeId)
    if (filters.startFrom) params.set('startFrom', filters.startFrom)
    if (filters.startTo) params.set('startTo', filters.startTo)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)

    fetch(`${API_BASE}/admin/dashboard/history?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((d) => {
        setItems(d.items)
        setTotal(d.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Дом</label>
            <Select
              value={filters.accommodationId}
              onValueChange={(v) => setFilters((p) => ({ ...p, accommodationId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все дома" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все дома</SelectItem>
                {accommodations.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Тип жилья</label>
            <Select
              value={filters.typeId}
              onValueChange={(v) => setFilters((p) => ({ ...p, typeId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Дата с</label>
            <Input
              type="date"
              value={filters.startFrom}
              onChange={(e) => setFilters((p) => ({ ...p, startFrom: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Дата по</label>
            <Input
              type="date"
              value={filters.startTo}
              onChange={(e) => setFilters((p) => ({ ...p, startTo: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Статус</label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="confirmed">Подтверждено</SelectItem>
                <SelectItem value="paid">Оплачено</SelectItem>
                <SelectItem value="cancelled">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <Button
            className="bg-brand hover:bg-brand-hover gap-1"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" />
            Новое бронирование
          </Button>
          <Button onClick={() => { setPage(1); loadHistory() }} className="bg-brand hover:bg-brand-hover gap-1">
            <Search className="w-4 h-4" />
            Применить
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Дом / Тип</TableHead>
                <TableHead>Заезд — Выезд</TableHead>
                <TableHead>Гости</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создано</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-graytext">
                    Ничего не найдено
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedItem(item)}
                  >
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.customerName}</div>
                      <div className="text-xs text-graytext">{item.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{item.accommodation?.name || '—'}</div>
                      <div className="text-xs text-graytext">{item.accommodation?.typeName || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(parseISO(item.startDate), 'dd.MM.yyyy')} — {format(parseISO(item.endDate), 'dd.MM.yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.adults + item.children} чел.
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-graytext">
                      {item.createdAt ? format(parseISO(item.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-graytext">
            Показано {items.length} из {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              Стр. {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <BookingDetailDialog
        booking={selectedItem ? {
          id: selectedItem.id,
          customerName: selectedItem.customerName,
          customerPhone: selectedItem.customerPhone,
          customerEmail: selectedItem.customerEmail,
          startDate: selectedItem.startDate,
          endDate: selectedItem.endDate,
          adults: selectedItem.adults,
          children: selectedItem.children,
          status: selectedItem.status,
        } : null}
        open={!!selectedItem}
        onOpenChange={(v) => !v && setSelectedItem(null)}
        onRefresh={loadHistory}
        onEdit={(b) => setEditingId(b.id)}
      />
      <BookingFormDialog
        open={showForm || editingId !== null}
        onOpenChange={(v) => {
          setShowForm(v)
          if (!v) setEditingId(null)
        }}
        initialData={{}}
        onSuccess={() => {
          loadHistory()
          setEditingId(null)
        }}
        editingId={editingId}
      />
    </div>
  )
}

/* ── Stats Tab ─────────────────────────────────────────────────── */

function StatsTab() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/admin/dashboard/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const pieData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.statusCounts).map(([name, value]) => ({ name: statusLabel(name), value }))
  }, [data])

  return (
    <div className="space-y-6">
      {loading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-graytext">Всего бронирований</p>
                  <p className="text-3xl font-bold text-dark mt-1">{data.totalBookings}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-graytext">В этом месяце</p>
                  <p className="text-3xl font-bold text-dark mt-1">{data.monthBookings}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-graytext">Активных сейчас</p>
                  <p className="text-3xl font-bold text-dark mt-1">{data.activeBookings}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-graytext">Оценка выручки</p>
                  <p className="text-3xl font-bold text-dark mt-1">{data.estimatedRevenue.toLocaleString('ru-RU')} Br</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Бронирования по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-graytext">Нет данных</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      {entry.name}: {entry.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Сегодняшние заезды</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <Clock className="w-10 h-10 text-brand mb-3" />
                <div className="text-4xl font-bold text-dark">{data.todayBookings}</div>
                <div className="text-sm text-graytext mt-1">заездов сегодня</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Occupancy Tab ─────────────────────────────────────────────── */

function OccupancyTab() {
  const [data, setData] = useState<OccupancyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (periodStart) params.set('periodStart', periodStart)
    if (periodEnd) params.set('periodEnd', periodEnd)
    fetch(`${API_BASE}/admin/dashboard/occupancy?${params.toString()}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.types.map((t) => ({
      name: t.typeName,
      Загрузка: t.occupancyRate,
      Домов: t.totalHouses,
      'Занято дней': t.occupiedDays,
    }))
  }, [data])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Период с</label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-graytext mb-1 block">Период по</label>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <Button onClick={load} className="bg-brand hover:bg-brand-hover gap-1">
            <Search className="w-4 h-4" />
            Обновить
          </Button>
        </div>
        {data && (
          <p className="text-xs text-graytext mt-2">
            Период: {format(parseISO(data.periodStart), 'dd.MM.yyyy')} — {format(parseISO(data.periodEnd), 'dd.MM.yyyy')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Процент загрузки по типам</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
            ) : chartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-graytext">Нет данных</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="Загрузка" fill="#8BA84B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Детализация по типам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : !data || data.types.length === 0 ? (
              <div className="text-center py-12 text-graytext">Нет данных</div>
            ) : (
              data.types.map((t) => (
                <div key={t.typeId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.typeName}</span>
                    <span className="text-graytext">
                      {t.occupiedDays} занято / {t.totalDays} дней
                    </span>
                  </div>
                  <Progress value={t.occupancyRate} className="h-2" />
                  <div className="text-xs text-graytext text-right">{t.occupancyRate}% загрузка</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Reviews Tab ───────────────────────────────────────────────── */

function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/review/admin/all`, { credentials: 'include' })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setReviews(data)
    } catch {
      toast.error('Не удалось загрузить отзывы')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleSync = async () => {
    setSyncLoading(true)
    try {
      const res = await fetch(`${API_BASE}/review/sync-yandex`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка синхронизации')
        return
      }
      const result = await res.json()
      toast.success(
        `Загружено: ${result.created || 0} новых, пропущено: ${result.skipped || 0}`
      )
      await loadReviews()
    } catch {
      toast.error('Ошибка сети при синхронизации')
    } finally {
      setSyncLoading(false)
    }
  }

  const toggleActive = async (review: ReviewItem) => {
    try {
      const res = await fetch(`${API_BASE}/review/admin/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !review.isActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка обновления')
        return
      }
      toast.success('Статус обновлён')
      await loadReviews()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/review/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка удаления')
        return
      }
      toast.success('Отзыв удалён')
      setDeleteId(null)
      await loadReviews()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const activeCount = reviews.filter((r) => r.isActive).length

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            className="bg-brand hover:bg-brand-hover gap-1"
            size="sm"
            onClick={handleSync}
            disabled={syncLoading}
          >
            {syncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Загрузить с Яндекса
          </Button>
          <Badge variant="outline" className="gap-1">
            <Star className="w-3.5 h-3.5" />
            {reviews.length} отзывов
          </Badge>
          <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50">
            Активно: {activeCount}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Оценка</TableHead>
                <TableHead>Текст</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead>Создано</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-graytext">
                    Нет отзывов. Нажмите «Загрузить с Яндекса» чтобы импортировать.
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{review.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {review.avatarUrl ? (
                          <img
                            src={review.avatarUrl}
                            alt={review.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                            {review.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{review.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm line-clamp-2 max-w-xs" title={review.text}>
                        {review.text}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={review.isActive}
                        onCheckedChange={() => toggleActive(review)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-graytext">
                      {review.createdAt
                        ? format(parseISO(review.createdAt), 'dd.MM.yyyy HH:mm')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteId(review.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              Отзыв #{deleteId} будет безвозвратно удалён. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ── Email Tab ─────────────────────────────────────────────────── */

import { EmailTab } from '@/components/EmailTab'
