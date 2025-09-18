import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent as ReactClipboardEvent } from 'react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { isImageFile, uploadProductImage } from '../services/media'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const commands = [
  { key: 'bold', label: 'Bold', command: () => document.execCommand('bold') },
  { key: 'italic', label: 'Italic', command: () => document.execCommand('italic') },
  { key: 'underline', label: 'Underline', command: () => document.execCommand('underline') },
  { key: 'bullet', label: '• List', command: () => document.execCommand('insertUnorderedList') },
  { key: 'number', label: '1. List', command: () => document.execCommand('insertOrderedList') },
]

export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const uploadCounterRef = useRef(0)

  useEffect(() => {
    if (!editorRef.current) return
    if (isFocused) return
    const next = value || ''
    if (editorRef.current.innerHTML !== next) {
      editorRef.current.innerHTML = next
    }
  }, [value, isFocused])

  function updateValue() {
    if (!editorRef.current) return
    onChange(editorRef.current.innerHTML)
  }

  function beginImageUpload(count: number) {
    if (count <= 0) return
    uploadCounterRef.current += count
    setIsUploadingImages(true)
  }

  function finishOneImageUpload() {
    uploadCounterRef.current = Math.max(0, uploadCounterRef.current - 1)
    if (uploadCounterRef.current === 0) {
      setIsUploadingImages(false)
    }
  }

  async function processImageUploads(files: File[], placeholders: HTMLImageElement[]) {
    if (!files.length || !placeholders.length) return
    const paired = placeholders.slice(0, files.length)
    beginImageUpload(paired.length)
    setUploadError(null)
    paired.forEach((img) => {
      img.dataset.uploading = 'true'
    })
    files.slice(0, paired.length).forEach((file, index) => {
      const placeholder = paired[index]
      uploadProductImage(file)
        .then(({ url }) => {
          if (placeholder) {
            placeholder.src = url
            placeholder.removeAttribute('data-uploading')
          }
          setUploadError(null)
          updateValue()
        })
        .catch((err: any) => {
          const message = err?.message || err?.code || 'Image upload failed'
          setUploadError(typeof message === 'string' ? message : 'Image upload failed')
          if (placeholder) {
            placeholder.remove()
            updateValue()
          }
        })
        .finally(() => {
          finishOneImageUpload()
        })
    })
  }

  function handleCommand(run: () => void) {
    if (disabled || typeof document === 'undefined') return
    editorRef.current?.focus()
    run()
    updateValue()
  }

  function handleLink() {
    if (disabled || typeof document === 'undefined') return
    editorRef.current?.focus()
    const selection = typeof window !== 'undefined' ? window.getSelection()?.toString() || '' : ''
    const promptFn = typeof window !== 'undefined' ? window.prompt : null
    const url = promptFn?.('Enter link URL', selection.startsWith('http') ? selection : 'https://')
    if (!url) return
    document.execCommand('createLink', false, url)
    updateValue()
  }

  function handleClear() {
    if (disabled || typeof document === 'undefined') return
    editorRef.current?.focus()
    document.execCommand('removeFormat')
    document.execCommand('unlink')
    updateValue()
  }

  function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    if (disabled) return
    const clipboard = event.clipboardData
    if (!clipboard || !editorRef.current) return
    const items = Array.from(clipboard.items || [])
    const files: File[] = items
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => !!file && isImageFile(file))

    if (!files.length) return

    const editor = editorRef.current
    const previousSources = new Set(
      Array.from(editor.querySelectorAll<HTMLImageElement>('img[src^="data:"], img[src^="blob:"]')).map((img) => img.src),
    )

    setTimeout(() => {
      const currentEditor = editorRef.current
      if (!currentEditor) return
      const newImages = Array.from(
        currentEditor.querySelectorAll<HTMLImageElement>('img[src^="data:"], img[src^="blob:"]'),
      ).filter((img) => !previousSources.has(img.src))
      if (!newImages.length) {
        // No placeholders detected; insert uploads at cursor instead
        if (typeof document === 'undefined') return
        beginImageUpload(files.length)
        setUploadError(null)
        files.forEach((file) => {
          uploadProductImage(file)
            .then(({ url }) => {
              document.execCommand('insertImage', false, url)
              updateValue()
            })
            .catch((err: any) => {
              const message = err?.message || err?.code || 'Image upload failed'
              setUploadError(typeof message === 'string' ? message : 'Image upload failed')
            })
            .finally(() => {
              finishOneImageUpload()
            })
        })
        return
      }
      processImageUploads(files, newImages)
    }, 0)
  }

  return (
    <div className={cn('rounded-md border bg-background', disabled && 'pointer-events-none opacity-70')}>
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        {commands.map((item) => (
          <Button
            key={item.key}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleCommand(item.command)}
            disabled={disabled || isUploadingImages}
          >
            {item.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={handleLink} disabled={disabled || isUploadingImages}>
          Link
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleClear} disabled={disabled || isUploadingImages}>
          Clear
        </Button>
      </div>
      <div className="relative">
        {!value && !isFocused && placeholder && (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">{placeholder}</span>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline
          contentEditable={!disabled}
          className="min-h-[180px] w-full resize-y overflow-y-auto rounded-b-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onInput={updateValue}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onPaste={handlePaste}
        />
      </div>
      {(uploadError || isUploadingImages) && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {isUploadingImages && <span>Uploading image…</span>}
          {uploadError && <span className="ml-1 text-destructive">{uploadError}</span>}
        </div>
      )}
    </div>
  )
}
