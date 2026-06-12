'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase, type Product, type Category } from '@/lib/supabase'
import { MessageCircle, ChevronDown, Sparkles } from 'lucide-react'

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
          opacity: product.status === 'sold' ? 0.6 : 1,
          filter: product.status === 'sold' ? 'grayscale(50%)' : 'none',
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
              style={{ opacity: product.status === 'sold' ? 0.45 : 1, filter: product.status === 'sold' ? 'grayscale(60%)' : 'none' }}
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

          {/* Status badge */}
          {product.status !== 'available' && (
            <span
              className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLASS[product.status]}`}
            >
              {STATUS_LABEL[product.status]}
            </span>
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
  const [count, setCount] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)

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
      if (prodRes.data) {
        setProducts(prodRes.data)
        setCount(prodRes.data.length)
      }
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
      {/* Ambient glow */}
      <div className="ambient-glow" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />

      {/* ── Header ── */}
      <header
        ref={headerRef}
        className="relative z-10 text-center py-16 px-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles size={14} style={{ color: 'var(--violet-main)' }} />
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Vide-dressing
          </span>
          <Sparkles size={14} style={{ color: 'var(--violet-main)' }} />
        </div>

        <h1
          className="font-display text-4xl md:text-6xl gradient-text mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Ma Boutique
        </h1>

        <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          Pièces sélectionnées — prix doux
        </p>

        <div
          className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: 'rgba(158,128,231,0.15)', color: 'var(--violet-light)', border: '1px solid var(--border)' }}
        >
          {loading ? '…' : count} articles
        </div>
      </header>

      {/* ── Category filter ── */}
      <div className="sticky top-0 z-20 px-4 py-3 overflow-x-auto" style={{ backgroundColor: 'rgba(240,235,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex gap-2 min-w-max mx-auto max-w-5xl">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeCategory === 'all' ? 'text-white' : ''
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
        © {new Date().getFullYear()} — Vide-dressing
        <span className="mx-3" style={{ color: 'var(--border)' }}>·</span>
        <Link href="/admin" className="hover:underline" style={{ color: 'var(--violet-light)' }}>
          Admin
        </Link>
      </footer>
    </main>
  )
}
