import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Loader2, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const API_BASE = '/api'

type BookingPaymentMode = 'manual_confirmation' | 'auto_payment'

interface PaymentSettings {
  id: number
  shopId?: string | null
  secretKey?: string | null
  testMode: boolean
  isActive: boolean
  notificationUrl?: string | null
  bookingPaymentMode: BookingPaymentMode
}

interface PaymentItem {
  id: number
  bookingId?: number | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  amountMinor: number
  currency: string
  provider: string
  status: string
  bookingPaymentMode: BookingPaymentMode
  transactionId?: string | null
  createdAt?: string | null
  paidAt?: string | null
  lastWebhookAt?: string | null
  errorMessage?: string | null
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'created', label: 'Создан' },
  { value: 'pending', label: 'Ожидает оплаты' },
  { value: 'successful', label: 'Оплачен' },
  { value: 'declined', label: 'Отклонён' },
  { value: 'failed', label: 'Ошибка' },
  { value: 'cancelled', label: 'Отменён' },
  { value: 'init_failed', label: 'Ошибка создания' },
]

const MODE_LABELS: Record<BookingPaymentMode, string> = {
  manual_confirmation: 'Ручное подтверждение',
  auto_payment: 'Автоматическая оплата',
}

const STATUS_BADGES: Record<string, string> = {
  successful: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  pending: 'text-amber-700 border-amber-200 bg-amber-50',
  created: 'text-sky-700 border-sky-200 bg-sky-50',
  init_failed: 'text-red-700 border-red-200 bg-red-50',
  failed: 'text-red-700 border-red-200 bg-red-50',
  declined: 'text-red-700 border-red-200 bg-red-50',
  cancelled: 'text-gray-700 border-gray-200 bg-gray-50',
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ru-RU')
}

function formatAmount(amountMinor: number, currency: string): string {
  return `${(amountMinor / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

export function PaymentTab() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/payment-settings`, { credentials: 'include' })
      if (!res.ok) throw new Error('settings')
      setSettings(await res.json())
    } catch {
      toast.error('Не удалось загрузить настройки bePaid')
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`${API_BASE}/admin/dashboard/payments?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('payments')
      setPayments(await res.json())
    } catch {
      toast.error('Не удалось загрузить платежи')
    } finally {
      setLoading(false)
    }
  }, [query, status])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const updateSettings = (patch: Partial<PaymentSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/payment-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shopId: settings.shopId || null,
          secretKey: settings.secretKey || null,
          testMode: settings.testMode,
          isActive: settings.isActive,
          notificationUrl: settings.notificationUrl || null,
          bookingPaymentMode: settings.bookingPaymentMode,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Не удалось сохранить настройки')
        return
      }
      setSettings(await res.json())
      toast.success('Настройки bePaid сохранены')
    } catch {
      toast.error('Ошибка сети при сохранении')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" />
            Настройки bePaid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading || !settings ? (
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-graytext mb-1 block">Shop ID</label>
                <Input
                  value={settings.shopId || ''}
                  onChange={(e) => updateSettings({ shopId: e.target.value })}
                  placeholder="Введите Shop ID"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-graytext mb-1 block">Secret key</label>
                <Input
                  type="password"
                  value={settings.secretKey || ''}
                  onChange={(e) => updateSettings({ secretKey: e.target.value })}
                  placeholder="Введите Secret key"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-graytext mb-1 block">Webhook URL</label>
                <Input
                  value={settings.notificationUrl || ''}
                  onChange={(e) => updateSettings({ notificationUrl: e.target.value })}
                  placeholder="https://parkrelax.by/api/payment/webhook"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-graytext mb-1 block">Режим оплаты заявок</label>
                <Select
                  value={settings.bookingPaymentMode}
                  onValueChange={(value: BookingPaymentMode) => updateSettings({ bookingPaymentMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_confirmation">Ручное подтверждение админом</SelectItem>
                    <SelectItem value="auto_payment">Автоматическая оплата после заявки</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Интеграция активна</div>
                  <div className="text-xs text-graytext">Если выключено, используется mock-оплата в dev-режиме</div>
                </div>
                <Switch
                  checked={settings.isActive}
                  onCheckedChange={(checked) => updateSettings({ isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="text-sm font-medium">Тестовый режим</div>
                  <div className="text-xs text-graytext">Перед продом выключить после sandbox-проверки</div>
                </div>
                <Switch
                  checked={settings.testMode}
                  onCheckedChange={(checked) => updateSettings({ testMode: checked })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={saveSettings} disabled={saving} className="bg-brand hover:bg-brand-hover gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить настройки
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <CardTitle className="text-base">Журнал платежей</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: клиент, email, телефон, transaction"
                className="sm:w-72"
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadPayments} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Обновить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Бронь</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Режим</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Оплачен</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 w-20 rounded bg-gray-200 animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-sm text-graytext">
                        Платежей пока нет
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">#{payment.id}</TableCell>
                        <TableCell>{payment.bookingId ? `#${payment.bookingId}` : '—'}</TableCell>
                        <TableCell>
                          <div className="font-medium">{payment.customerName || '—'}</div>
                          <div className="text-xs text-graytext">{payment.customerEmail || payment.customerPhone || '—'}</div>
                        </TableCell>
                        <TableCell>{formatAmount(payment.amountMinor, payment.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGES[payment.status] || 'text-gray-700 border-gray-200 bg-gray-50'}>
                            {payment.status}
                          </Badge>
                          {payment.errorMessage && (
                            <div className="text-xs text-red-600 mt-1 max-w-[220px] truncate">{payment.errorMessage}</div>
                          )}
                        </TableCell>
                        <TableCell>{MODE_LABELS[payment.bookingPaymentMode]}</TableCell>
                        <TableCell>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell>{formatDate(payment.paidAt)}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{payment.transactionId || '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
