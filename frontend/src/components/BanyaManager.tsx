import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Flame, Loader2, Plus, Pencil, Trash2, Upload } from 'lucide-react'
import { plainTextFromHtml } from '@/lib/safeHtml'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const API_BASE = '/api/admin/dashboard/banya'

interface BanyaSettings {
  id: number
  pageTitle: string
  pageSubtitle?: string
  eyebrow?: string
  ctaLabel?: string
  ctaHref?: string
  isActive: boolean
}

interface BanyaSliderItem {
  id: number
  title?: string
  imageUrl?: string
  sortOrder: number
  isActive: boolean
}

interface BanyaSection {
  id: number
  eyebrow?: string
  title: string
  description?: string
  imageUrl?: string
  chips?: string[]
  sortOrder: number
  isActive: boolean
}

const emptySlider = {
  title: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
}

const emptySection = {
  eyebrow: '',
  title: '',
  description: '',
  imageUrl: '',
  chipsText: '',
  sortOrder: 0,
  isActive: true,
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload/banya', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка загрузки')
  const data = await res.json()
  return data.url as string
}

export default function BanyaManager() {
  const [settings, setSettings] = useState<BanyaSettings | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const [slider, setSlider] = useState<BanyaSliderItem[]>([])
  const [sliderLoading, setSliderLoading] = useState(true)
  const [sliderDialog, setSliderDialog] = useState(false)
  const [sliderEditingId, setSliderEditingId] = useState<number | null>(null)
  const [sliderForm, setSliderForm] = useState(emptySlider)
  const [sliderSaving, setSliderSaving] = useState(false)

  const [sections, setSections] = useState<BanyaSection[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sectionDialog, setSectionDialog] = useState(false)
  const [sectionEditingId, setSectionEditingId] = useState<number | null>(null)
  const [sectionForm, setSectionForm] = useState(emptySection)
  const [sectionSaving, setSectionSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    const res = await fetch(`${API_BASE}/settings`, { credentials: 'include' })
    if (!res.ok) throw new Error('settings')
    const data = await res.json()
    setSettings(data)
  }, [])

  const fetchSlider = useCallback(async () => {
    setSliderLoading(true)
    try {
      const res = await fetch(`${API_BASE}/slider`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      setSlider(await res.json())
    } catch {
      toast.error('Не удалось загрузить слайдер')
    } finally {
      setSliderLoading(false)
    }
  }, [])

  const fetchSections = useCallback(async () => {
    setSectionsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/sections`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      setSections(await res.json())
    } catch {
      toast.error('Не удалось загрузить секции')
    } finally {
      setSectionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings().catch(() => toast.error('Не удалось загрузить настройки'))
    fetchSlider()
    fetchSections()
  }, [fetchSettings, fetchSlider, fetchSections])

  const saveSettings = async () => {
    if (!settings) return
    setSettingsSaving(true)
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pageTitle: settings.pageTitle,
          pageSubtitle: settings.pageSubtitle,
          eyebrow: settings.eyebrow,
          ctaLabel: settings.ctaLabel,
          ctaHref: settings.ctaHref,
          isActive: settings.isActive,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Настройки сохранены')
      await fetchSettings()
    } catch {
      toast.error('Не удалось сохранить настройки')
    } finally {
      setSettingsSaving(false)
    }
  }

  const openSliderCreate = () => {
    setSliderEditingId(null)
    setSliderForm(emptySlider)
    setSliderDialog(true)
  }

  const openSliderEdit = (item: BanyaSliderItem) => {
    setSliderEditingId(item.id)
    setSliderForm({
      title: item.title || '',
      imageUrl: item.imageUrl || '',
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })
    setSliderDialog(true)
  }

  const saveSlider = async () => {
    setSliderSaving(true)
    try {
      const url = sliderEditingId
        ? `${API_BASE}/slider/${sliderEditingId}`
        : `${API_BASE}/slider`
      const method = sliderEditingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sliderForm),
      })
      if (!res.ok) throw new Error()
      toast.success(sliderEditingId ? 'Слайд обновлён' : 'Слайд добавлен')
      setSliderDialog(false)
      await fetchSlider()
    } catch {
      toast.error('Не удалось сохранить слайд')
    } finally {
      setSliderSaving(false)
    }
  }

  const deleteSlider = async (id: number) => {
    if (!confirm('Удалить слайд?')) return
    try {
      const res = await fetch(`${API_BASE}/slider/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      setSlider((prev) => prev.filter((s) => s.id !== id))
      toast.success('Удалено')
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  const openSectionCreate = () => {
    setSectionEditingId(null)
    setSectionForm(emptySection)
    setSectionDialog(true)
  }

  const openSectionEdit = (item: BanyaSection) => {
    setSectionEditingId(item.id)
    setSectionForm({
      eyebrow: item.eyebrow || '',
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      chipsText: (item.chips || []).join(', '),
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })
    setSectionDialog(true)
  }

  const saveSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error('Заголовок обязателен')
      return
    }
    const chips = sectionForm.chipsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const payload = {
      eyebrow: sectionForm.eyebrow || null,
      title: sectionForm.title,
      description: sectionForm.description || null,
      imageUrl: sectionForm.imageUrl || null,
      chips: chips.length > 0 ? chips : null,
      sortOrder: sectionForm.sortOrder,
      isActive: sectionForm.isActive,
    }
    setSectionSaving(true)
    try {
      const url = sectionEditingId
        ? `${API_BASE}/sections/${sectionEditingId}`
        : `${API_BASE}/sections`
      const method = sectionEditingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(sectionEditingId ? 'Секция обновлена' : 'Секция добавлена')
      setSectionDialog(false)
      await fetchSections()
    } catch {
      toast.error('Не удалось сохранить секцию')
    } finally {
      setSectionSaving(false)
    }
  }

  const deleteSection = async (id: number) => {
    if (!confirm('Удалить секцию?')) return
    try {
      const res = await fetch(`${API_BASE}/sections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      setSections((prev) => prev.filter((s) => s.id !== id))
      toast.success('Удалено')
    } catch {
      toast.error('Не удалось удалить')
    }
  }

  const handleImageUpload = async (
    file: File,
    onUrl: (url: string) => void,
  ) => {
    try {
      const url = await uploadImage(file)
      onUrl(url)
      toast.success('Фото загружено')
    } catch {
      toast.error('Не удалось загрузить фото')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Flame className="w-5 h-5 text-brand" />
        Терраса с баней
      </h2>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="settings">Страница</TabsTrigger>
          <TabsTrigger value="slider">Слайдер</TabsTrigger>
          <TabsTrigger value="sections">Секции лендинга</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!settings ? (
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Заголовок страницы</label>
                    <Input
                      value={settings.pageTitle}
                      onChange={(e) =>
                        setSettings((s) => (s ? { ...s, pageTitle: e.target.value } : s))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Подзаголовок</label>
                    <Textarea
                      value={settings.pageSubtitle || ''}
                      onChange={(e) =>
                        setSettings((s) => (s ? { ...s, pageSubtitle: e.target.value } : s))
                      }
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Метка (eyebrow)</label>
                    <Input
                      value={settings.eyebrow || ''}
                      onChange={(e) =>
                        setSettings((s) => (s ? { ...s, eyebrow: e.target.value } : s))
                      }
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Текст кнопки</label>
                      <Input
                        value={settings.ctaLabel || ''}
                        onChange={(e) =>
                          setSettings((s) => (s ? { ...s, ctaLabel: e.target.value } : s))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Ссылка кнопки</label>
                      <Input
                        value={settings.ctaHref || ''}
                        onChange={(e) =>
                          setSettings((s) => (s ? { ...s, ctaHref: e.target.value } : s))
                        }
                        placeholder="/#contacts"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.isActive}
                      onCheckedChange={(v) =>
                        setSettings((s) => (s ? { ...s, isActive: v } : s))
                      }
                    />
                    <span className="text-sm">Страница активна</span>
                  </div>
                  <Button
                    className="bg-brand hover:bg-brand-hover"
                    onClick={saveSettings}
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Сохранить настройки'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slider">
          <div className="flex justify-end mb-3">
            <Button className="bg-brand hover:bg-brand-hover gap-1" onClick={openSliderCreate}>
              <Plus className="w-4 h-4" />
              Добавить слайд
            </Button>
          </div>
          {sliderLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Фото</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Порядок</TableHead>
                    <TableHead>Активен</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slider.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{item.title || '—'}</TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>{item.isActive ? 'Да' : 'Нет'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openSliderEdit(item)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => deleteSlider(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sections">
          <div className="flex justify-end mb-3">
            <Button className="bg-brand hover:bg-brand-hover gap-1" onClick={openSectionCreate}>
              <Plus className="w-4 h-4" />
              Добавить секцию
            </Button>
          </div>
          {sectionsLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Фото</TableHead>
                    <TableHead>Заголовок</TableHead>
                    <TableHead className="max-w-xs">Описание</TableHead>
                    <TableHead>Метка</TableHead>
                    <TableHead>Порядок</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                        {item.description ? plainTextFromHtml(item.description) : '—'}
                      </TableCell>
                      <TableCell>{item.eyebrow || '—'}</TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openSectionEdit(item)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => deleteSection(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={sliderDialog} onOpenChange={setSliderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{sliderEditingId ? 'Редактировать слайд' : 'Новый слайд'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Название (необязательно)"
              value={sliderForm.title}
              onChange={(e) => setSliderForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              placeholder="URL изображения"
              value={sliderForm.imageUrl}
              onChange={(e) => setSliderForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Загрузить фото
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file, (url) => setSliderForm((f) => ({ ...f, imageUrl: url })))
                }}
              />
            </label>
            {sliderForm.imageUrl && (
              <img src={sliderForm.imageUrl} alt="" className="w-full h-32 object-cover rounded" />
            )}
            <Input
              type="number"
              placeholder="Порядок"
              value={sliderForm.sortOrder}
              onChange={(e) =>
                setSliderForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
              }
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={sliderForm.isActive}
                onCheckedChange={(v) => setSliderForm((f) => ({ ...f, isActive: v }))}
              />
              <span className="text-sm">Активен</span>
            </div>
            <Button
              className="w-full bg-brand hover:bg-brand-hover"
              onClick={saveSlider}
              disabled={sliderSaving}
            >
              {sliderSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {sectionEditingId ? 'Редактировать секцию' : 'Новая секция'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Метка (eyebrow)"
              value={sectionForm.eyebrow}
              onChange={(e) => setSectionForm((f) => ({ ...f, eyebrow: e.target.value }))}
            />
            <Input
              placeholder="Заголовок *"
              value={sectionForm.title}
              onChange={(e) => setSectionForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              placeholder="Описание (HTML)"
              value={sectionForm.description}
              onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
            />
            <Input
              placeholder="URL фона секции"
              value={sectionForm.imageUrl}
              onChange={(e) => setSectionForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              Загрузить фон
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file, (url) => setSectionForm((f) => ({ ...f, imageUrl: url })))
                }}
              />
            </label>
            <Input
              placeholder="Чипы через запятую"
              value={sectionForm.chipsText}
              onChange={(e) => setSectionForm((f) => ({ ...f, chipsText: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Порядок"
              value={sectionForm.sortOrder}
              onChange={(e) =>
                setSectionForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
              }
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={sectionForm.isActive}
                onCheckedChange={(v) => setSectionForm((f) => ({ ...f, isActive: v }))}
              />
              <span className="text-sm">Активна</span>
            </div>
            <Button
              className="w-full bg-brand hover:bg-brand-hover"
              onClick={saveSection}
              disabled={sectionSaving}
            >
              {sectionSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
