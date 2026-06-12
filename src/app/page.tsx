'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, type Product, type Category } from '@/lib/supabase'

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
function ProductCard({ product, index }: { product: Product; index: number }) {
  const [imgError, setImgError] = useState(false)
  const img = product.images?.[0]
  const delay = `${(index % 8) * 60}ms`

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

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category_id === activeCategory)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* ── Topbar ── */}
      <header className="relative z-20 flex justify-between items-center px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs tracking-widest" style={{ color: 'var(--violet-main)' }}>
          ✦ Vide-Dressing ✦
        </span>
        <span
          className="text-lg italic"
          style={{
            fontFamily: "'Playfair Display', serif",
            background: 'linear-gradient(90deg, #9E80E7, #C4ADFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ✿ Isabelle
        </span>
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
            <p className="text-4xl mb-4">✨</p>
            <p style={{ color: 'var(--text-muted)' }}>Aucun article dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
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
