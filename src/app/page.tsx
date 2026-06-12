'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, type Product, type Category } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { getFavorites, toggleFavorite } from '@/lib/favorites'

/* ─── Helpers ─────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
}
const STATUS_CLASS: Record<string, string> = {
  available: 'badge-available',
  reserved: 'badge-reserved',
  sold: 'badge-sold',
}

/* ─── Product card ────────────────────────── */
function ProductCard({
  product,
  index,
  isFav,
  onToggleFav,
}: {
  product: Product
  index: number
  isFav: boolean
  onToggleFav: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const [animating, setAnimating] = useState(false)
  const img = product.images?.[0]
  const delay = `${(index % 8) * 60}ms`

  function handleFavClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    setTimeout(() => setAnimating(false), 200)
    onToggleFav()
  }

  return (
    <Link href={`/product/${product.id}`} className="block">
      <article
        className="card-glow stagger-item rounded-2xl overflow-hidden cursor-pointer"
        style={{
          animationDelay: delay,
          backgroundColor: 'var(--bg-card)',
          opacity: product.status === 'sold' ? 0.75 : 1,
          filter: product.status === 'sold' ? 'grayscale(30%)' : 'none',
        }}
      >
        {/* Image */}
        <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
          {/* Fav button */}
          <button
            onClick={handleFavClick}
            className="absolute top-2 right-2 z-10 flex items-center justify-center rounded-full"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(4px)',
              padding: '6px',
              transform: animating ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={16}
              style={{
                color: '#9E80E7',
                opacity: isFav ? 1 : 0.5,
                fill: isFav ? '#9E80E7' : 'none',
                transition: 'opacity 0.2s ease, fill 0.2s ease',
              }}
            />
          </button>
          {img && !imgError ? (
            <Image
              src={img}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              style={{ opacity: product.status === 'sold' ? 0.75 : 1, filter: product.status === 'sold' ? 'grayscale(30%)' : 'none' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, #1a1728 0%, #2a1f45 100%)' }}
            >
              👗
            </div>
          )}

          {/* Sold banner */}
          {product.status === 'sold' && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
            >
              <span
                className="text-sm font-bold text-white"
                style={{
                  transform: 'rotate(-35deg)',
                  background: 'rgba(158,128,231,0.85)',
                  padding: '4px 40px',
                }}
              >
                Vendu
              </span>
            </div>
          )}

          {/* Reserved banner */}
          {product.status === 'reserved' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span
                className="font-bold"
                style={{
                  transform: 'rotate(-35deg)',
                  background: 'rgba(158,128,231,0.75)',
                  color: 'white',
                  padding: '3px 36px',
                  fontSize: '0.75rem',
                }}
              >
                Réservé
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
            style={{ background: 'linear-gradient(to top, rgba(14,12,26,0.85) 0%, transparent 60%)' }}
          >
            <span className="text-white text-sm font-medium">{product.title}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
            {product.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {product.categories?.name ?? '—'}
              {product.size ? ` · ${product.size}` : ''}
            </span>
            <span className="font-semibold text-sm gradient-text">{product.price} €</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

/* ─── Skeleton card ───────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="skeleton w-full" style={{ aspectRatio: '3/4' }} />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFavs, setShowFavs] = useState(false)

  useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  useEffect(() => {
    async function load() {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('*, categories(id, name, slug)')
          .order('created_at', { ascending: false }),
      ])
      if (catRes.data) setCategories(catRes.data)
      if (prodRes.data) setProducts(prodRes.data)
      setLoading(false)
    }
    load()
  }, [])

  function handleToggleFav(id: string) {
    toggleFavorite(id)
    setFavorites(getFavorites())
  }

  const filtered = products
    .filter((p) => activeCategory === 'all' || p.category_id === activeCategory)
    .filter((p) => !showFavs || favorites.includes(p.id))

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* ── Topbar ── */}
      <header className="relative z-20 flex justify-between items-center px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="tracking-widest" style={{ color: 'var(--violet-main)', fontStyle: 'italic', fontSize: '1.05rem' }}>
          ✿ Les Pépites Da Paixão
        </span>
        <button
          onClick={() => setShowFavs((v) => !v)}
          className="relative flex items-center gap-1.5 transition-all duration-200"
          style={{
            background: showFavs ? 'var(--violet-main)' : 'transparent',
            color: showFavs ? 'white' : '#9E80E7',
            borderRadius: '999px',
            padding: showFavs ? '6px 14px' : '6px',
          }}
          aria-label="Filtrer par favoris"
        >
          <Heart
            size={18}
            style={{
              fill: showFavs ? 'white' : 'none',
              color: showFavs ? 'white' : '#9E80E7',
              transition: 'fill 0.2s ease, color 0.2s ease',
            }}
          />
          {showFavs && <span style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1 }}>Favoris</span>}
          {favorites.length > 0 && !showFavs && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white"
              style={{ fontSize: '0.6rem', fontWeight: 700, background: 'var(--violet-main)', lineHeight: 1 }}
            >
              {favorites.length}
            </span>
          )}
        </button>
      </header>

      {/* ── Category filter ── */}
      <div className="sticky top-0 z-20 px-4 py-3 overflow-x-auto" style={{ backgroundColor: 'rgba(240,235,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2 min-w-max mx-auto max-w-5xl">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeCategory === 'all' ? 'text-white' : ''
              }`}
            style={
              activeCategory === 'all'
                ? { background: 'var(--violet-main)', color: 'white' }
                : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap`}
              style={
                activeCategory === cat.id
                  ? { background: 'var(--violet-main)', color: 'white' }
                  : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">{showFavs ? '💜' : '✨'}</p>
            <p style={{ color: 'var(--text-muted)' }}>
              {showFavs ? "Aucun coup de cœur pour l'instant" : 'Aucun article dans cette catégorie'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                isFav={favorites.includes(product.id)}
                onToggleFav={() => handleToggleFav(product.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="text-center py-10 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        © 2026 Boutique d'Isabelle.
        <span className="mx-3" style={{ color: 'var(--border)' }}>·</span>
        <Link href="/admin" className="hover:underline" style={{ color: 'var(--violet-light)' }}>
          Admin
        </Link>
      </footer>
    </main>
  )
}
