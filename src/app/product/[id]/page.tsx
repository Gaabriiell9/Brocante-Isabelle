'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, type Product } from '@/lib/supabase'
import { ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, Tag, Ruler, Check } from 'lucide-react'

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

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('id', id)
        .single()
      setProduct(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: 'var(--violet-main)', animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Article introuvable</p>
        <Link href="/" className="btn-primary">Retour</Link>
      </div>
    )
  }

  const images = product.images ?? []
  const whatsappMsg = encodeURIComponent(
    `Bonjour ! Je suis intéressé(e) par "${product.title}" à ${product.price} € 😊`
  )
  const whatsappUrl = `https://wa.me/${product.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMsg}`

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="ambient-glow" style={{ top: '-100px', right: '-100px' }} />

      {/* Nav */}
      <nav className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(240,235,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          Retour
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10 animate-fade-in">
        {/* ── Images ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ aspectRatio: '3/4', background: 'var(--bg-card)' }}
          >
            {images.length > 0 ? (
              <Image
                src={images[imgIdx]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl">👗</div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(14,12,26,0.7)', color: 'white' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i === images.length - 1 ? 0 : i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(14,12,26,0.7)', color: 'white' }}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className="relative w-16 h-16 rounded-xl overflow-hidden transition-all"
                  style={{
                    border: i === imgIdx ? '2px solid var(--violet-main)' : '2px solid transparent',
                    opacity: i === imgIdx ? 1 : 0.6,
                  }}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col gap-5 stagger-item" style={{ animationDelay: '100ms' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLASS[product.status]}`}
              >
                {STATUS_LABEL[product.status]}
              </span>
              {product.categories && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {product.categories.name}
                </span>
              )}
            </div>

            <h1
              className="text-3xl md:text-4xl font-display mb-3"
              style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text)' }}
            >
              {product.title}
            </h1>

            <p className="text-3xl font-semibold gradient-text">{product.price} €</p>
          </div>

          {/* Details */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {product.size && (
              <div className="flex items-center gap-3">
                <Ruler size={16} style={{ color: 'var(--violet-main)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Taille</span>
                <span className="text-sm font-medium ml-auto" style={{ color: 'var(--text)' }}>{product.size}</span>
              </div>
            )}
            {product.categories && (
              <div className="flex items-center gap-3">
                <Tag size={16} style={{ color: 'var(--violet-main)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Catégorie</span>
                <span className="text-sm font-medium ml-auto" style={{ color: 'var(--text)' }}>{product.categories.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {product.description}
            </p>
          )}

          {/* CTA */}
          {product.status === 'available' ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)' }}
            >
              <MessageCircle size={20} />
              Contacter sur WhatsApp
            </a>
          ) : (
            <div
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {product.status === 'sold' ? '✓ Vendu' : '⏳ Réservé'}
            </div>
          )}

          <Link
            href="/"
            className="text-center text-sm transition-colors hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Voir tous les articles
          </Link>
        </div>
      </div>
    </main>
  )
}
