/**
 * OfflineBanner.jsx
 * Shows a banner when offline or when sync is happening.
 */

export default function OfflineBanner({ isOnline, pendingCount, syncing, syncResult }) {
  if (isOnline && pendingCount === 0 && !syncing && !syncResult) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
      width: 'min(92vw, 520px)',
    }}>

      {/* Offline banner */}
      {!isOnline && (
        <div style={s.banner('offline')}>
          <span style={s.dot('#dc2626')} />
          <span>You are offline — searches use local data</span>
          {pendingCount > 0 && (
            <span style={s.badge}>{pendingCount} pending</span>
          )}
        </div>
      )}

      {/* Syncing banner */}
      {syncing && (
        <div style={s.banner('syncing')}>
          <div style={s.spinner} />
          Syncing {pendingCount} item{pendingCount !== 1 ? 's' : ''} to server...
        </div>
      )}

      {/* Sync result */}
      {syncResult && !syncing && (
        <div style={s.banner(syncResult.failed > 0 ? 'warn' : 'success')}>
          <span style={s.dot(syncResult.failed > 0 ? '#d97706' : '#16a34a')} />
          {syncResult.synced > 0 && `✓ ${syncResult.synced} item${syncResult.synced !== 1 ? 's' : ''} synced`}
          {syncResult.failed > 0 && ` · ${syncResult.failed} failed`}
        </div>
      )}
    </div>
  )
}

const s = {
  banner: (type) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    background: type === 'offline' ? '#1a1a1a'
               : type === 'syncing' ? '#1d4ed8'
               : type === 'warn'    ? '#92400e'
               : '#166534',
    color:   '#fff',
    padding: '10px 20px',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    flexWrap: 'wrap',
    justifyContent: 'center',
    textAlign: 'center',
  }),
  dot: (color) => ({
    width: 8, height: 8, borderRadius: '50%',
    background: color, flexShrink: 0, display: 'inline-block',
  }),
  badge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 8px', borderRadius: 100, fontSize: 12,
  },
  spinner: {
    width: 14, height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
}
