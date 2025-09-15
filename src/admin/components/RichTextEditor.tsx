import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

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
            disabled={disabled}
          >
            {item.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={handleLink} disabled={disabled}>
          Link
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleClear} disabled={disabled}>
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
        />
      </div>
    </div>
  )
}
