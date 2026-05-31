/**
 * syncService.js
 * Handles syncing offline logs to server when internet returns.
 */

import {
  getPendingLogs,
  deletePendingLog,
  saveItemsLocally,
  getAllItemsLocally,
} from './localDB.js'
import { logItem, allItems } from '../api/index.js'

let isSyncing = false

/**
 * Sync all pending offline logs to server.
 * Call this when app comes back online.
 * Returns { synced, failed } counts.
 */
export async function syncPendingLogs(onProgress) {
  if (isSyncing) return { synced: 0, failed: 0 }
  isSyncing = true

  const pending = await getPendingLogs()
  let synced = 0
  let failed = 0

  for (const log of pending) {
    try {
      await logItem({
        item_name: log.item_name,
        location:  log.location,
        log_type:  'manual',
      })
      await deletePendingLog(log.id)
      synced++
      if (onProgress) onProgress({ synced, failed, total: pending.length, current: log.item_name })
    } catch (err) {
      console.error('Sync failed for:', log.item_name, err)
      failed++
    }
  }

  isSyncing = false
  return { synced, failed }
}

/**
 * Pull latest items from server and update local cache.
 */
export async function refreshLocalCache() {
  try {
    const res = await allItems()
    await saveItemsLocally(res.data)
    return res.data.length
  } catch {
    return 0
  }
}

/**
 * Setup online/offline listeners.
 * Call once in App.jsx on mount.
 */
export function setupSyncListeners(onOnline, onOffline) {
  window.addEventListener('online',  onOnline)
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online',  onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
