"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/context"
import { useLocale } from "@/lib/i18n/locale-context"
import { useRouter } from "next/navigation"

interface FavoriteButtonProps {
  carId: string
  className?: string
}

// Simple localStorage-backed favorites for guest users + API for authenticated
const LS_KEY = 'cb_favorites'

function getLocalFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function setLocalFavorites(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

export function FavoriteButton({ carId, className }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth()
  const { locale } = useLocale()
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch from API
      fetch('/api/favorites')
        .then((r) => r.json())
        .then(({ favorites }) => setFavorited((favorites ?? []).includes(carId)))
        .catch(() => {})
    } else {
      setFavorited(getLocalFavorites().includes(carId))
    }
  }, [carId, isAuthenticated])

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      // Fallback: localStorage
      const current = getLocalFavorites()
      const next = current.includes(carId)
        ? current.filter((id) => id !== carId)
        : [...current, carId]
      setLocalFavorites(next)
      setFavorited(next.includes(carId))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId }),
      })
      const data = await res.json()
      if (res.ok) setFavorited(data.favorited)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:scale-110 active:scale-95 shadow-sm",
        loading && "opacity-50",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          favorited ? "fill-red-500 text-red-500" : "text-foreground/70"
        )}
      />
    </button>
  )
}
