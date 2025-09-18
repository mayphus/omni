const BLOCK_STYLES: Record<string, string> = {
  p: 'margin:20rpx 0;font-size:28rpx;line-height:1.7;color:#333;',
  div: 'margin:20rpx 0;font-size:28rpx;line-height:1.7;color:#333;',
  h1: 'margin:36rpx 0 20rpx;font-size:40rpx;font-weight:600;line-height:1.3;color:#111;',
  h2: 'margin:32rpx 0 18rpx;font-size:36rpx;font-weight:600;line-height:1.3;color:#111;',
  h3: 'margin:28rpx 0 16rpx;font-size:32rpx;font-weight:600;line-height:1.35;color:#111;',
  h4: 'margin:24rpx 0 12rpx;font-size:30rpx;font-weight:600;line-height:1.4;color:#111;',
  ul: 'margin:20rpx 0 20rpx 32rpx;padding:0;font-size:28rpx;line-height:1.7;color:#333;',
  ol: 'margin:20rpx 0 20rpx 32rpx;padding:0;font-size:28rpx;line-height:1.7;color:#333;',
  li: 'margin:12rpx 0;line-height:1.6;',
  blockquote: 'margin:24rpx 0;padding:12rpx 20rpx;border-left:6rpx solid #d9d9d9;color:#555;background:#fafafa;',
  strong: 'font-weight:600;',
  em: 'font-style:italic;',
  table: 'width:100%;border-collapse:collapse;margin:24rpx 0;font-size:28rpx;',
  th: 'border:1px solid #e5e5e5;background:#f7f7f7;padding:16rpx;text-align:left;',
  td: 'border:1px solid #e5e5e5;padding:16rpx;',
  a: 'color:#165dff;text-decoration:none;word-break:break-all;',
}

const IMG_STYLE = 'max-width:100%;height:auto;display:block;margin:24rpx 0;border-radius:12rpx;'

const DANGEROUS_TAG_PATTERN = /<(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi
const DANGEROUS_SINGLE_TAG_PATTERN = /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select)[^>]*>/gi
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const JAVASCRIPT_URL_PATTERN = /(href|src)\s*=\s*("|')(javascript:[^"']*)(\2)/gi

function normalizeStyle(style: string): string {
  const trimmed = style.trim()
  if (!trimmed) return ''
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`
}

function mergeStyles(existing: string, addition: string): string {
  const base = normalizeStyle(existing)
  const extra = normalizeStyle(addition)
  if (!base) return extra
  if (!extra) return base
  return `${base} ${extra}`.trim()
}

function stripDangerousAttributes(attrs: string): string {
  return attrs.replace(EVENT_HANDLER_PATTERN, '').replace(/\s{2,}/g, ' ').trim()
}

function appendStyleAttribute(attrs: string, style: string): string {
  const cleanAttrs = stripDangerousAttributes(attrs)
  if (!style.trim()) {
    return cleanAttrs ? ` ${cleanAttrs}` : ''
  }
  const stylePattern = /style\s*=\s*("([^"]*)"|'([^']*)')/i
  const normalized = normalizeStyle(style)
  if (stylePattern.test(cleanAttrs)) {
    const match = cleanAttrs.match(stylePattern)
    const quote = match?.[1]?.[0] || '"'
    const existing = match?.[2] ?? match?.[3] ?? ''
    const merged = mergeStyles(existing, normalized)
    const updated = cleanAttrs.replace(stylePattern, `style=${quote}${merged}${quote}`)
    return updated ? ` ${updated.trim()}` : ''
  }
  const joined = cleanAttrs ? `${cleanAttrs} style="${normalized}"` : `style="${normalized}"`
  return ` ${joined.trim()}`
}

function ensureAttribute(attrs: string, name: string, value: string): string {
  if (new RegExp(`\\s${name}\\s*=`, 'i').test(attrs)) {
    return attrs
  }
  const joined = `${attrs} ${name}="${value}"`
  return ` ${joined.trim()}`
}

function applyBlockStyles(html: string): string {
  let output = html
  Object.keys(BLOCK_STYLES).forEach((tag) => {
    const style = BLOCK_STYLES[tag]
    const regex = new RegExp(`<${tag}([^>]*)>`, 'gi')
    output = output.replace(regex, (_, attrs: string) => {
      return `<${tag}${appendStyleAttribute(attrs, style)}>`
    })
  })
  return output
}

function formatImages(html: string): string {
  return html.replace(/<img([^>]*)>/gi, (_, attrs: string) => {
    let next = appendStyleAttribute(attrs, IMG_STYLE)
    next = ensureAttribute(next, 'alt', '')
    next = ensureAttribute(next, 'referrerpolicy', 'no-referrer')
    return `<img${next}>`
  })
}

export function sanitizeRichDescription(html: string | null | undefined): string {
  if (!html) return ''
  let output = String(html)
  output = output.replace(DANGEROUS_TAG_PATTERN, '')
  output = output.replace(DANGEROUS_SINGLE_TAG_PATTERN, '')
  output = output.replace(EVENT_HANDLER_PATTERN, '')
  output = output.replace(JAVASCRIPT_URL_PATTERN, '')
  output = applyBlockStyles(output)
  output = formatImages(output)
  return output.trim()
}
