import { useEffect, useState } from 'react'

export function useMediaQuery(query) {
  const getMatches = () =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)

    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsNarrow() {
  return useMediaQuery('(max-width: 768px)')
}
