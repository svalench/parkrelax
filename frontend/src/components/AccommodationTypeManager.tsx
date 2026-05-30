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
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { plainTextFromHtml } from '@/lib/safeHtml'

const API_BASE = '/api/admin/dashboard/accommodationTypes'

interface AccommodationType {
  id: number
  name: string
  description?: string | null
  capacity: number
  pricePerNight: number
  priceUnit?: string | null
  pricingModel?: string | null
  childPricePerNight?: number | null
  imageUrl?: string | null
  isActive: boolean
  showInListing: boolean
  sortOrder: number
}

interface FormData {
  name: string
  description: string
  capacity: number
  pricePerNight: number
  priceUnit: string
  pricingModel: string
  childPricePerNight: number
  imageUrl: string
  isActive: boolean
  showInListing: boolean
  sortOrder: number
}

const emptyForm: FormData = {
  name: '',
  description: '',
  capacity: 1,
  pricePerNight: 0,
  priceUnit: 'ночь',
  pricingModel: 'per_night',
  childPricePerNight: 0,
  imageUrl: '',
  isActive: true,
  showInListing: true,
  sortOrder: 0,
}

export default function AccommodationTypeManager() {
  const [items, setItems] = useState<AccommodationType[]>([])
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
      toast.error('Не удалось загрузить типы размещения')
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

  const openEdit = (item: AccommodationType) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      capacity: item.capacity,
      pricePerNight: item.pricePerNight,
      priceUnit: item.priceUnit || 'ночь',
      pricingModel: item.pricingModel || 'per_night',
      childPricePerNight: item.childPricePerNight ?? 0,
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
      showInListing: item.showInListing,
      sortOrder: item.sortOrder,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Укажите название')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        description: form.description.trim() || null,
        childPricePerNight: form.pricingModel === 'per_person' ? form.childPricePerNight : null,
        imageUrl: form.imageUrl.trim() || null,
      }
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      toast.success(editingId ? 'Тип обновлён' : 'Тип создан')
      setDialogOpen(false)
      fetchItems()
    } catch {
      toast.error('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тип размещения?')) return
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Ошибка')
      toast.success('Удалено')
      fetchItems()
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Типы размещения</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchItems} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Обновить'}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="max-w-xs">Описание</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Вместимость</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                    {item.description ? plainTextFromHtml(item.description) : '—'}
                  </TableCell>
                  <TableCell>
                    {item.pricePerNight} / {item.priceUnit || 'ночь'}
                  </TableCell>
                  <TableCell>{item.capacity}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет типов размещения
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
            <DialogTitle>{editingId ? 'Редактировать' : 'Добавить'} тип размещения</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Название <span className="text-red-500">*</span>
              </label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={5}
                placeholder="Текст для карточек на сайте. Поддерживается HTML."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Вместимость</label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Цена</label>
                <Input
                  type="number"
                  min={0}
                  value={form.pricePerNight}
                  onChange={(e) => setForm((p) => ({ ...p, pricePerNight: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Единица цены</label>
                <Input value={form.priceUnit} onChange={(e) => setForm((p) => ({ ...p, priceUnit: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Модель цены</label>
                <Select value={form.pricingModel} onValueChange={(v) => setForm((p) => ({ ...p, pricingModel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_night">За ночь (объект)</SelectItem>
                    <SelectItem value="per_person">За человека (кемпинг)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.pricingModel === 'per_person' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Цена для ребёнка (3–12 лет)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.childPricePerNight}
                  onChange={(e) => setForm((p) => ({ ...p, childPricePerNight: Number(e.target.value) }))}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">URL изображения</label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="/assets/..."
              />
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
              <div className="space-y-3 pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                  <span className="text-sm">Активно</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.showInListing}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, showInListing: v }))}
                  />
                  <span className="text-sm">В каталоге</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
