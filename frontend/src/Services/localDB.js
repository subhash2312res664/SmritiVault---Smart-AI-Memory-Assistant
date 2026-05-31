/**
 * localDB.js
 * IndexedDB wrapper for SmritiVault offline support.
 *
 * Stores:
 *   items        — synced from server (read-only offline)
 *   pending_logs — items logged offline, waiting to sync
 */

const DB_NAME    = 'SmritiVaultDB'
const DB_VERSION = 1

// Open / create database
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = e.target.result

      // Synced items store
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'item_name' })
        store.createIndex('location',  'location',  { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Offline pending logs
      if (!db.objectStoreNames.contains('pending_logs')) {
        db.createObjectStore('pending_logs', { keyPath: 'id', autoIncrement: true })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}


// ─── Items (synced from server) ───────────────────────────

export async function saveItemsLocally(items) {
  const db = await openDB()
  const tx = db.transaction('items', 'readwrite')
  const store = tx.objectStore('items')
  for (const item of items) {
    store.put(item)
  }
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}

export async function getAllItemsLocally() {
  const db    = await openDB()
  const tx    = db.transaction('items', 'readonly')
  const store = tx.objectStore('items')
  return new Promise((res, rej) => {
    const req = store.getAll()
    req.onsuccess = () => res(req.result || [])
    req.onerror   = () => rej(req.error)
  })
}

export async function searchItemLocally(query) {
  const items = await getAllItemsLocally()
  const q     = query.toLowerCase().trim()
  return items.filter(item =>
    item.item_name.toLowerCase().includes(q) ||
    item.location.toLowerCase().includes(q)
  )
}

export async function getItemLocally(itemName) {
  const items = await getAllItemsLocally()
  return items.find(
    i => i.item_name.toLowerCase() === itemName.toLowerCase().trim()
  ) || null
}

export async function saveOneItemLocally(item) {
  const db    = await openDB()
  const tx    = db.transaction('items', 'readwrite')
  const store = tx.objectStore('items')
  store.put(item)
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}

export async function deleteItemLocally(itemName) {
  const db    = await openDB()
  const tx    = db.transaction('items', 'readwrite')
  const store = tx.objectStore('items')
  store.delete(itemName)
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}


// ─── Pending logs (offline queue) ────────────────────────

export async function addPendingLog(item) {
  const db    = await openDB()
  const tx    = db.transaction('pending_logs', 'readwrite')
  const store = tx.objectStore('pending_logs')
  store.add({ ...item, queued_at: new Date().toISOString() })
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}

export async function getPendingLogs() {
  const db    = await openDB()
  const tx    = db.transaction('pending_logs', 'readonly')
  const store = tx.objectStore('pending_logs')
  return new Promise((res, rej) => {
    const req = store.getAll()
    req.onsuccess = () => res(req.result || [])
    req.onerror   = () => rej(req.error)
  })
}

export async function deletePendingLog(id) {
  const db    = await openDB()
  const tx    = db.transaction('pending_logs', 'readwrite')
  const store = tx.objectStore('pending_logs')
  store.delete(id)
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}

export async function clearPendingLogs() {
  const db    = await openDB()
  const tx    = db.transaction('pending_logs', 'readwrite')
  tx.objectStore('pending_logs').clear()
  return new Promise((res, rej) => {
    tx.oncomplete = () => res(true)
    tx.onerror    = () => rej(tx.error)
  })
}

// ─── Utility ─────────────────────────────────────────────

export function isOnline() {
  return navigator.onLine
}

export async function getLocalStats() {
  const items   = await getAllItemsLocally()
  const pending = await getPendingLogs()
  return {
    cached:  items.length,
    pending: pending.length,
  }
}
