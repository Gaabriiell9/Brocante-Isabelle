const KEY = 'vide-dressing-favorites'

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites()
  const idx = favs.indexOf(id)
  if (idx === -1) {
    favs.push(id)
    localStorage.setItem(KEY, JSON.stringify(favs))
    return true
  }
  favs.splice(idx, 1)
  localStorage.setItem(KEY, JSON.stringify(favs))
  return false
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id)
}
