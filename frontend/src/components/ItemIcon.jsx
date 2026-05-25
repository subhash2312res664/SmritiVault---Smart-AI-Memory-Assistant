export function ItemIcon({ name = '', size = 40 }) {
  const n = name.toLowerCase()
  let icon = '📦'
  if (n.includes('key') || n.includes('keys')) icon = '🗝️'
  else if (n.includes('laptop') || n.includes('computer') || n.includes('mac')) icon = '💻'
  else if (n.includes('passport') || n.includes('document') || n.includes('deed') || n.includes('certificate')) icon = '📄'
  else if (n.includes('phone') || n.includes('mobile')) icon = '📱'
  else if (n.includes('wallet') || n.includes('purse')) icon = '👛'
  else if (n.includes('watch')) icon = '⌚'
  else if (n.includes('coat') || n.includes('jacket') || n.includes('clothes')) icon = '🧥'
  else if (n.includes('charger') || n.includes('cable')) icon = '🔌'
  else if (n.includes('book') || n.includes('notebook')) icon = '📒'
  else if (n.includes('glasses') || n.includes('specs')) icon = '👓'
  else if (n.includes('bag') || n.includes('backpack')) icon = '🎒'
  else if (n.includes('medicine') || n.includes('tablet')) icon = '💊'

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#f0f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, flexShrink: 0,
    }}>{icon}</div>
  )
}
