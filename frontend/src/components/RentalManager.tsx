import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Pencil, Trash2, Bike } from 'lucide-react'
import { plainTextFromHtml } from '@/lib/safeHtml'

const API_BASE = '/api/admin/dashboard/rentalItems'

const BADGE_COLORS = [
  { value: 'bg-[rgba(30,96,145,0.82)] text-[#caf0f8]', label: 'Вода (синий)' },
  { value: 'bg-[rgba(45,106,79,0.82)] text-[#d8f3dc]', label: 'Рыбалка (зелёный)' },
  { value: 'bg-[rgba(123,45,139,0.82)] text-[#f3e8ff]', label: 'Актив (фиолетовый)' },
  { value: 'bg-[rgba(187,62,3,0.82)] text-[#ffe8d6]', label: 'Вечер (оранжевый)' },
  { value: 'bg-[rgba(231,111,81,0.82)] text-[#fff1ec]', label: 'Спорт (коралловый)' },
  { value: 'bg-[rgba(20,20,60,0.88)] text-[#e0d9ff]', label: 'Ночь (тёмно-синий)' },
  { value: 'bg-[rgba(0,80,130,0.82)] text-[#bde8ff]', label: 'Лодка (голубой)' },
]

interface RentalItem {
  id: number
  title: string
  info: string
  badge: string
  badgeColor: string
  eyebrow: string
  description: string
  duration: string
  capacity: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
}

interface FormData {
  title: string
  info: string
  badge: string
  badgeColor: string
  eyebrow: string
  description: string
  duration: string
  capacity: string
  imageUrl: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: FormData = {
  title: '',
  info: '',
  badge: '',
  badgeColor: BADGE_COLORS[0].value,
  eyebrow: '',
  description: '',
  duration: '',
  capacity: '',
  imageUrl: '',
  isActive: true,
  sortOrder: 0,
}

export default function RentalManager() {
  const [items, setItems] = useState<RentalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API_BASE, { credentials: 'include' })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setItems(data)
    } catch {
      toast.error('Не удалось загрузить аренду')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (item: RentalItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      info: item.info || '',
      badge: item.badge || '',
      badgeColor: item.badgeColor || BADGE_COLORS[0].value,
      eyebrow: item.eyebrow || '',
      description: item.description || '',
      duration: item.duration || '',
      capacity: item.capacity || '',
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Название обязательно')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Ошибка сохранения')
      }
      toast.success(editingId ? 'Обновлено' : 'Создано')
      setDialogOpen(false)
      await fetchItems()
    } catch (e: any) {
      toast.error(e.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Ошибка')
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Удалено')
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bike className="w-5 h-5 text-brand" />
          Аренда и услуги
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchItems} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Обновить'}
          </Button>
          <Button className="bg-brand hover:bg-brand-hover gap-1" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="max-w-xs">Описание</TableHead>
                <TableHead>Бейдж</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Вместимость</TableHead>
                <TableHead className="w-20">Порядок</TableHead>
                <TableHead className="w-20">Активно</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div>{item.title}</div>
                        <div className="text-xs text-graytext">{item.info}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                    {item.description ? plainTextFromHtml(item.description) : '—'}
                  </TableCell>
                  <TableCell>
                    {item.badge && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{item.duration}</TableCell>
                  <TableCell>{item.capacity}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <Switch checked={item.isActive} disabled />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Нет элементов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать' : 'Добавить'} аренду</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Название <span className="text-red-500">*</span></label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Краткая информация</label>
                <Input value={form.info} onChange={(e) => setForm((p) => ({ ...p, info: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Надзаголовок</label>
                <Input value={form.eyebrow} onChange={(e) => setForm((p) => ({ ...p, eyebrow: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Бейдж</label>
                <Input value={form.badge} onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Цвет бейджа</label>
                <Select value={form.badgeColor} onValueChange={(v) => setForm((p) => ({ ...p, badgeColor: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${c.value}`}>
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Длительность</label>
                <Input value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Вместимость</label>
                <Input value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL изображения</label>
              <Input value={form.imageUrl} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} placeholder="/assets/..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Порядок</label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                />
                <span className="text-sm">Активно</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button className="bg-brand hover:bg-brand-hover" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
