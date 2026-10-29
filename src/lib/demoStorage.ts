import { useEffect, useRef } from 'react'

const updatedEvent = 'demo-storage-updated'

/** Chỉ phát thông báo sau khi ghi thành công; lỗi quota/quyền truy cập trả về form xử lý. */
export function setDemoStorageItem(key: string, value: string): void {
  localStorage.setItem(key, value)
  queueMicrotask(() => window.dispatchEvent(new CustomEvent<string>(updatedEvent, { detail: key })))
}

/** Cùng tab dùng custom event; tab khác dùng StorageEvent của trình duyệt. */
export function subscribeDemoStorage(keys: readonly string[], refresh: () => void): () => void {
  const accepts = (key: string | null) => key === null || keys.length === 0 || keys.includes(key)
  const local = (event: Event) => {
    if (event instanceof CustomEvent && typeof event.detail === 'string' && accepts(event.detail)) refresh()
  }
  const remote = (event: StorageEvent) => {
    if (event.storageArea === localStorage && accepts(event.key)) refresh()
  }
  window.addEventListener(updatedEvent, local)
  window.addEventListener('storage', remote)
  return () => {
    window.removeEventListener(updatedEvent, local)
    window.removeEventListener('storage', remote)
  }
}

export function useDemoStorageRefresh(keys: readonly string[], refresh: () => void): void {
  const latest = useRef(refresh)
  useEffect(() => { latest.current = refresh }, [refresh])
  const signature = JSON.stringify(keys)
  useEffect(() => subscribeDemoStorage(JSON.parse(signature) as string[], () => latest.current()), [signature])
}
