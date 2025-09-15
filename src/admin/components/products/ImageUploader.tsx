import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { uploadProductImage, isImageFile } from '../../services/media'
import { cn } from '../../lib/utils'

type ImageUploaderProps = {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setError(null)
    setUploading(true)
    const next: string[] = []
    try {
      for (const file of Array.from(fileList)) {
        if (file.size && file.size > 5 * 1024 * 1024) {
          setError('Images must be smaller than 5 MB')
          continue
        }
        if (!isImageFile(file)) {
          setError('Only image files are supported')
          continue
        }
        const url = await uploadProductImage(file)
        next.push(url)
      }
      if (next.length > 0) {
        onChange([...value, ...next])
      }
    } catch (err: any) {
      const message = err?.message || err?.code || 'Image upload failed'
      setError(typeof message === 'string' ? message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeImage(idx: number) {
    const copy = value.filter((_, index) => index !== idx)
    onChange(copy)
  }

  function addManualUrl() {
    const trimmed = manualUrl.trim()
    if (!trimmed) return
    try {
      const url = new URL(trimmed)
      onChange([...value, url.toString()])
      setManualUrl('')
      setError(null)
    } catch (err) {
      setError('Enter a valid image URL')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload Images'}
          </Button>
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled}
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <div className="flex w-full max-w-xs items-center gap-2 sm:w-auto">
            <Input
              type="url"
              placeholder="https://image.url"
              value={manualUrl}
              disabled={disabled}
              onChange={(event) => {
                setManualUrl(event.target.value)
                if (error) setError(null)
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={disabled || !manualUrl.trim()} onClick={addManualUrl}>
              Add URL
            </Button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5 MB.</span>
      </div>

      {error && <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} className="group relative overflow-hidden rounded-md border">
              <img src={url} alt="Product" className="h-32 w-full object-cover" />
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  'absolute inset-x-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity disabled:cursor-not-allowed disabled:opacity-70',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'group-hover:opacity-100'
                )}
                onClick={() => removeImage(idx)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
