import { useCallback, useEffect, useState } from 'react'
import { Mail, Loader2, Activity, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

const API_BASE = '/api'

interface SmtpStatus {
  configured: boolean
  host?: string
  port?: number
  username?: string
  fromEmail?: string
  fromName?: string
  useTls?: boolean
  isActive?: boolean
}

interface AdminEmailItem {
  id: number
  email: string
  name?: string | null
  isActive: boolean
  createdAt?: string | null
}

export function EmailTab() {
  const [smtp, setSmtp] = useState<SmtpStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [toEmail, setToEmail] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [lastResult, setLastResult] = useState<{ status: string; error?: string; traceback?: string; logId?: number | null } | null>(null)
  const [connTest, setConnTest] = useState<{ reachable: boolean; host?: string; port?: number; error?: string } | null>(null)
  const [connLoading, setConnLoading] = useState(false)

  const [emails, setEmails] = useState<AdminEmailItem[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const loadSmtp = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/smtp-status`, { credentials: 'include' })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setSmtp(data)
    } catch {
      toast.error('Не удалось загрузить SMTP настройки')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEmails = useCallback(async () => {
    setEmailsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/admin-emails`, { credentials: 'include' })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setEmails(data)
    } catch {
      toast.error('Не удалось загрузить email адреса')
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSmtp()
    loadEmails()
  }, [loadSmtp, loadEmails])

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes('@')) {
      toast.error('Введите корректный email')
      return
    }
    setSendLoading(true)
    setLastResult(null)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/test-email?to=${encodeURIComponent(toEmail)}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка отправки')
        return
      }
      const result = await res.json()
      setLastResult(result)
      if (result.status === 'sent') {
        toast.success('Тестовое письмо отправлено')
      } else {
        toast.error(result.error || 'Ошибка отправки письма')
      }
    } catch {
      toast.error('Ошибка сети при отправке')
    } finally {
      setSendLoading(false)
    }
  }

  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Введите корректный email')
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/admin-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail, name: newName || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка добавления')
        return
      }
      toast.success('Email добавлен')
      setNewEmail('')
      setNewName('')
      await loadEmails()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setAddLoading(false)
    }
  }

  const toggleEmailActive = async (item: AdminEmailItem) => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/admin-emails/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка обновления')
        return
      }
      toast.success('Статус обновлён')
      await loadEmails()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const deleteEmail = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard/admin-emails/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.detail || 'Ошибка удаления')
        return
      }
      toast.success('Email удалён')
      await loadEmails()
    } catch {
      toast.error('Ошибка сети')
    }
  }

  return (
    <div className="space-y-6">
      {/* SMTP Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand" />
            SMTP настройки
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : !smtp || !smtp.configured ? (
            <div className="text-center py-6 text-graytext">
              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>SMTP не настроен</p>
              <p className="text-xs mt-1">Настройте SMTP в админке (/admin/ → Почта → SMTP настройки)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-graytext mb-1">Сервер</div>
                  <div className="font-medium">{smtp.host}:{smtp.port}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-graytext mb-1">Логин / Отправитель</div>
                  <div className="font-medium">{smtp.username || '—'}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-graytext mb-1">From Email / Name</div>
                  <div className="font-medium">{smtp.fromEmail || '—'}</div>
                  {smtp.fromName && <div className="text-xs text-graytext">{smtp.fromName}</div>}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-graytext mb-1">TLS</div>
                  <div className="font-medium">{smtp.useTls ? 'Включён' : 'Выключен'}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-graytext mb-1">Статус</div>
                  <Badge variant="outline" className={smtp.isActive ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-red-700 border-red-200 bg-red-50'}>
                    {smtp.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={connLoading}
                onClick={async () => {
                  setConnLoading(true)
                  setConnTest(null)
                  try {
                    const res = await fetch(`${API_BASE}/admin/dashboard/smtp-test-connection`, { credentials: 'include' })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      toast.error(err.detail || 'Ошибка проверки')
                      return
                    }
                    const data = await res.json()
                    setConnTest(data)
                    if (data.reachable) {
                      toast.success(`Сервер ${data.host}:${data.port} доступен`)
                    } else {
                      toast.error(data.error || 'Сервер недоступен')
                    }
                  } catch {
                    toast.error('Ошибка сети при проверке')
                  } finally {
                    setConnLoading(false)
                  }
                }}
              >
                {connLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                Проверить соединение
              </Button>
              {connTest && (
                <div className={`text-xs rounded-lg p-2 border ${connTest.reachable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {connTest.reachable
                    ? `Сервер ${connTest.host}:${connTest.port} доступен по TCP`
                    : connTest.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand" />
            Email администраторов для уведомлений
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-graytext mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-graytext mb-1 block">Имя (необязательно)</label>
              <Input
                placeholder="Иван"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <Button
              className="bg-brand hover:bg-brand-hover gap-1 w-full sm:w-auto"
              onClick={handleAddEmail}
              disabled={addLoading}
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Добавить
            </Button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Активен</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : emails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-graytext text-sm">
                        Нет email адресов. Добавьте администраторов для получения уведомлений о бронированиях.
                      </TableCell>
                    </TableRow>
                  ) : (
                    emails.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell>{item.name || '—'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => toggleEmailActive(item)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteEmail(item.id)}
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
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тестовая отправка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-graytext mb-1 block">Email получателя</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
              />
            </div>
            <Button
              className="bg-brand hover:bg-brand-hover gap-1 w-full sm:w-auto"
              onClick={handleSend}
              disabled={sendLoading || !smtp?.configured}
            >
              {sendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Отправить тестовое письмо
            </Button>
          </div>

          {lastResult && (
            <div className={`rounded-xl p-4 text-sm ${lastResult.status === 'sent' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="font-medium mb-1">
                {lastResult.status === 'sent' ? 'Письмо отправлено' : 'Ошибка отправки'}
              </div>
              {lastResult.error && <div className="text-xs opacity-90">{lastResult.error}</div>}
              {lastResult.logId && (
                <div className="text-xs opacity-70 mt-1">Log ID: {lastResult.logId}</div>
              )}
              {lastResult.traceback && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium opacity-80">Показать полный трейс</summary>
                  <pre className="mt-2 text-[10px] bg-white/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap border border-red-100">{lastResult.traceback}</pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
