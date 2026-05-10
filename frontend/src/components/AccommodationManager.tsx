import { useEffect, useState, useCallback, useRef } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Images,
  Trash2,
  GripVertical,
  Upload,
  Scissors,
  Loader2,
  Save,
} from 'lucide-react'
import Cropper from 'react-easy-crop'

const API_BASE = '/api/admin/dashboard'

interface AccommodationType {
  id: number
  name: string
}

interface Accommodation {
  id: number
  name: string
  type?: AccommodationType
  capacity: number
  pricePerNight: number
  isActive: boolean
  sortOrder: number
}

interface AccommodationImage {
  id: number
  imageUrl: string
  sortOrder: number
}

interface CroppedImage {
  file: File
  preview: string
  name: string
}

/* ── Accommodation Manager ─────────────────────────────────────── */

export default function AccommodationManager() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAcc, setSelectedAcc] = useState<Accommodation | null>(null)

  const fetchAcc = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/accommodations`, { credentials: 'include' })
      if (!res.ok) throw new Error('Ошибка загрузки')
      const data = await res.json()
      setAccommodations(data)
    } catch {
      toast.error('Не удалось загрузить размещения')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAcc()
  }, [fetchAcc])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Размещения</h2>
        <Button variant="outline" onClick={fetchAcc} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Обновить'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Вместимость</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accommodations.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell>{acc.id}</TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>{acc.type?.name || '—'}</TableCell>
                  <TableCell>{acc.capacity}</TableCell>
                  <TableCell>{acc.pricePerNight} BYN</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAcc(acc)}
                    >
                      <Images className="w-4 h-4 mr-1" />
                      Галерея
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {accommodations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет размещений
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedAcc && (
        <AccommodationGalleryModal
          accommodation={selectedAcc}
          onClose={() => setSelectedAcc(null)}
        />
      )}
    </div>
  )
}

/* ── Gallery Modal ─────────────────────────────────────────────── */

function AccommodationGalleryModal({
  accommodation,
  onClose,
}: {
  accommodation: Accommodation
  onClose: () => void
}) {
  const [images, setImages] = useState<AccommodationImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [toUpload, setToUpload] = useState<CroppedImage[]>([])
  const [cropModal, setCropModal] = useState<{ preview: string } | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/accommodations/${accommodation.id}/images`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Ошибка')
      const data = await res.json()
      setImages(data)
    } catch {
      toast.error('Не удалось загрузить фото')
    } finally {
      setLoading(false)
    }
  }, [accommodation.id])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setToUpload((prev) => [...prev, { file, preview: ev.target?.result as string, name: file.name }])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setToUpload((prev) => [...prev, { file, preview: ev.target?.result as string, name: file.name }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }, [])

  const removeFromUpload = (idx: number) => {
    setToUpload((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUploadAll = async () => {
    if (toUpload.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      toUpload.forEach((item) => formData.append('files', item.file))
      const res = await fetch(`${API_BASE}/accommodations/${accommodation.id}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error('Ошибка загрузки')
      toast.success(`Загружено ${toUpload.length} фото`)
      setToUpload([])
      await fetchImages()
    } catch {
      toast.error('Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (imageId: number) => {
    if (!confirm('Удалить фото?')) return
    try {
      const res = await fetch(
        `${API_BASE}/accommodations/${accommodation.id}/images/${imageId}`,
        { method: 'DELETE', credentials: 'include' }
      )
      if (!res.ok) throw new Error('Ошибка')
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      toast.success('Фото удалено')
    } catch {
      toast.error('Не удалось удалить фото')
    }
  }

  const handleReorder = async () => {
    setSavingOrder(true)
    try {
      const payload = images.map((img, idx) => ({ id: img.id, sortOrder: idx }))
      const res = await fetch(`${API_BASE}/accommodations/${accommodation.id}/images/reorder`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Ошибка')
      toast.success('Порядок сохранён')
    } catch {
      toast.error('Не удалось сохранить порядок')
    } finally {
      setSavingOrder(false)
    }
  }

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const next = [...prev]
      const [removed] = next.splice(from, 1)
      next.splice(to, 0, removed)
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Галерея: {accommodation.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2">
          {/* Existing images */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Текущие фото ({images.length})</h3>
              <Button size="sm" variant="outline" onClick={handleReorder} disabled={savingOrder}>
                {savingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Сохранить порядок
              </Button>
            </div>

            {images.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">Нет фото</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <DraggableImageCard
                  key={img.id}
                  img={img}
                  index={idx}

                  onMove={moveImage}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('gallery-upload')?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Перетащите фото сюда или нажмите для выбора
            </p>
            <Input
              id="gallery-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* To upload preview */}
          {toUpload.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">На загрузку ({toUpload.length})</h3>
                <Button size="sm" onClick={handleUploadAll} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Загрузить все
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {toUpload.map((item, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-[16/10]">
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCropModal({ preview: item.preview })
                        }}
                      >
                        <Scissors className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromUpload(idx)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Crop modal */}
        {cropModal && (
          <CropModal
            preview={cropModal.preview}
            onClose={() => setCropModal(null)}
            onSave={(croppedFile) => {
              setToUpload((prev) => {
                const idx = prev.findIndex((p) => p.preview === cropModal.preview)
                if (idx === -1) return prev
                const next = [...prev]
                next[idx] = { file: croppedFile, preview: URL.createObjectURL(croppedFile), name: croppedFile.name }
                return next
              })
              setCropModal(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── Draggable Image Card ──────────────────────────────────────── */

function DraggableImageCard({
  img,
  index,
  onMove,
  onDelete,
}: {
  img: AccommodationImage
  index: number
  onMove: (from: number, to: number) => void
  onDelete: (id: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(index))
      }}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        const from = Number(e.dataTransfer.getData('text/plain'))
        if (from !== index) onMove(from, index)
      }}
      className="relative group rounded-lg overflow-hidden border aspect-[16/10] cursor-move"
    >
      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
      <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
        {index + 1}
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button size="icon" variant="ghost" className="text-white cursor-grab">
          <GripVertical className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-white" onClick={() => onDelete(img.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

/* ── Crop Modal ────────────────────────────────────────────────── */

function CropModal({
  preview,
  onClose,
  onSave,
}: {
  preview: string
  onClose: () => void
  onSave: (croppedFile: File) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const cropped = await getCroppedImg(preview, croppedAreaPixels)
      onSave(cropped)
    } catch {
      toast.error('Ошибка обрезки')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Обрезка фото</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={16 / 10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Масштаб</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={processing}>
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Canvas crop helper ────────────────────────────────────────── */

function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No context'))
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas is empty'))
        const file = new File([blob], 'cropped.webp', { type: 'image/webp' })
        resolve(file)
      }, 'image/webp', 0.92)
    }
    image.onerror = reject
  })
}
