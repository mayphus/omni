import { getCloudBaseApp } from '../lib/cloudbase'

function getExtension(name: string) {
  const idx = name.lastIndexOf('.')
  if (idx === -1) return ''
  return name.slice(idx + 1).toLowerCase()
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function buildCloudPath(file: File) {
  const ext = getExtension(file.name) || file.type.replace('image/', '') || 'jpg'
  return `admin/products/${createId()}.${ext}`
}

export function isImageFile(file: File) {
  if (!file) return false
  if (file.type) return file.type.startsWith('image/')
  const ext = getExtension(file.name)
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!isImageFile(file)) throw new Error('Please choose an image file')
  const app = getCloudBaseApp() as any
  if (typeof app.uploadFile !== 'function') {
    throw new Error('CloudBase upload is not configured')
  }
  const cloudPath = buildCloudPath(file)
  async function performUpload(method: 'put' | 'post') {
    const params: any = {
      cloudPath,
      method,
      // CloudBase JS SDK expects `filePath` even in browsers and accepts a `File`
      filePath: file as any,
    }
    if (method === 'put' && file.type) {
      params.headers = { 'Content-Type': file.type }
    }
    return app.uploadFile(params)
  }

  let res
  try {
    res = await performUpload('put')
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : ''
    if (message.includes('[OPERATION_FAIL]')) {
      // Some environments reject signed PUT uploads; retry using the signed POST flow
      res = await performUpload('post')
    } else {
      throw err
    }
  }
  const fileID = res?.fileID || res?.fileId
  if (!fileID) throw new Error('Upload failed')
  if (typeof app.getTempFileURL !== 'function') {
    throw new Error('Cannot resolve uploaded file URL')
  }
  const tempRes = await app.getTempFileURL({
    fileList: [{ fileID: fileID as string, maxAge: 3600 * 24 * 7 }],
  })
  const urlEntry = tempRes?.fileList?.[0]
  const url = urlEntry?.tempFileURL
  if (!url) throw new Error('Failed to obtain image URL')
  return url
}
