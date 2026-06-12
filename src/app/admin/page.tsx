'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { supabase, type Product, type Category } from '@/lib/supabase'
import {
  Plus, Pencil, Trash2, X, Check, LogOut, LayoutGrid,
  Tag, Upload, ChevronDown, Eye, EyeOff, Package
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────── */
type Tab = 'products' | 'categories'

/* ─── Upload helper ─────────────────────────────── */
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('vide-dressing').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('vide-dressing').getPublicUrl(path)
  return data.publicUrl
}

/* ─── Product Form ─────────────────────────────── */
type ProdFormData = {
  title: string; description: string; price: string; size: string
  category_id: string; status: Product['status']; whatsapp_number: string
}
const emptyForm: ProdFormData = {
  title: '', description: '', price: '', size: '',
  category_id: '', status: 'available', whatsapp_number: '+594694264093',
}

/* ─── Main ─────────────────────────────────────── */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [tab, setTab] = useState<Tab>('products')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Product form
  const [showProdForm, setShowProdForm] = useState(false)
  const [editingProd, setEditingProd] = useState<Product | null>(null)
  const [form, setForm] = useState<ProdFormData>(emptyForm)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Category form
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null)
  const [deleteCatError, setDeleteCatError] = useState('')

  /* ── Session check on mount ── */
  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then(({ ok }) => { if (ok) setAuthed(true) })
      .finally(() => setChecking(false))
  }, [])

  /* ── Load data ── */
  useEffect(() => {
    if (!authed) return
    loadAll()
  }, [authed])

  async function loadAll() {
    setLoadingData(true)
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*, categories(id,name,slug)').order('created_at', { ascending: false }),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (prodRes.data) setProducts(prodRes.data)
    setLoadingData(false)
  }

  /* ── Auth ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setPassError(false)
    setLoginError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass }),
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setPassError(true)
      setLoginError('Mot de passe incorrect')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    setAuthed(false)
  }

  /* ── Product CRUD ── */
  function openCreate() {
    setEditingProd(null)
    setForm(emptyForm)
    setImages([])
    setShowProdForm(true)
  }

  function openEdit(p: Product) {
    setEditingProd(p)
    setForm({
      title: p.title, description: p.description ?? '', price: String(p.price),
      size: p.size ?? '', category_id: p.category_id ?? '',
      status: p.status, whatsapp_number: p.whatsapp_number ?? '',
    })
    setImages(p.images ?? [])
    setShowProdForm(true)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadImage))
      setImages((prev) => [...prev, ...urls])
    } catch (err) {
      alert('Erreur upload : ' + (err as Error).message)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function saveProd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      size: form.size.trim() || null,
      category_id: form.category_id || null,
      status: form.status,
      images,
      whatsapp_number: form.whatsapp_number.trim() || '+594694264093',
    }
    if (editingProd) {
      await supabase.from('products').update(payload).eq('id', editingProd.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setShowProdForm(false)
    await loadAll()
    setSaving(false)
  }

  async function deleteProd(id: string) {
    if (!confirm('Supprimer cet article ?')) return
    setDeletingId(id)
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
  }

  /* ── Category CRUD ── */
  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSavingCat(true)
    const slug = newCatName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('categories').insert({ name: newCatName.trim(), slug })
    if (error) console.error(error)
    setNewCatName('')
    await loadAll()
    setSavingCat(false)
  }

  async function deleteCat(id: string) {
    if (!confirm('Supprimer cette catégorie ?')) return
    setDeletingCatId(id)
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
    if (count && count > 0) {
      setDeleteCatError(`Impossible — ${count} article(s) utilisent cette catégorie. Retire-les d'abord.`)
      setDeletingCatId(null)
      setTimeout(() => setDeleteCatError(''), 4000)
      return
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) console.error(error)
    await loadAll()
    setDeletingCatId(null)
  }

  /* ── Login screen ── */
  if (checking) return null

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="ambient-glow" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="relative w-full max-w-sm rounded-2xl p-8 space-y-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-center">
            <p className="text-3xl mb-2">✨</p>
            <h1 className="font-display text-2xl gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>Admin</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Accès réservé</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setPassError(false) }}
                placeholder="Mot de passe"
                className="input-violet pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passError && <p className="text-xs text-red-400">{loginError}</p>}
            <button type="submit" className="btn-primary w-full">Connexion</button>
          </form>
        </div>
      </main>
    )
  }

  /* ── Main admin ── */
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(240,235,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-display text-xl gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>Admin</h1>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-sm transition-colors hover:text-white" style={{ color: 'var(--text-muted)' }}>
            Voir le site →
          </a>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['products', 'categories'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                tab === t
                  ? { background: 'var(--violet-main)', color: 'white' }
                  : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {t === 'products' ? <Package size={15} /> : <Tag size={15} />}
              {t === 'products' ? 'Articles' : 'Catégories'}
            </button>
          ))}
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{products.length} articles</p>
              <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Ajouter
              </button>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({length: 6}).map((_,i) => (
                  <div key={i} className="rounded-2xl overflow-hidden" style={{background:'var(--bg-card)'}}>
                    <div className="skeleton" style={{aspectRatio:'3/4'}}/>
                    <div className="p-3 space-y-2"><div className="skeleton h-4 rounded w-3/4"/></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">👗</p>
                <p style={{ color: 'var(--text-muted)' }}>Aucun article pour l'instant</p>
                <button onClick={openCreate} className="btn-primary mt-4">Ajouter le premier article</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const img = p.images?.[0]
                  return (
                    <div key={p.id} className="rounded-2xl overflow-hidden group relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div className="relative" style={{ aspectRatio: '3/4' }}>
                        {img ? (
                          <Image src={img} alt={p.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--bg-card-hover)' }}>👗</div>
                        )}
                        {/* Status badge */}
                        {p.status === 'sold' && (
                          <span className="absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: 'rgba(158,128,231,0.9)' }}>Vendu</span>
                        )}
                        {p.status === 'reserved' && (
                          <span className="absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full text-black" style={{ background: 'rgba(253,224,71,0.9)' }}>Réservé</span>
                        )}
                        {/* Actions overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" style={{ background: 'rgba(14,12,26,0.75)' }}>
                          <button onClick={() => openEdit(p)} className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110" style={{ background: 'var(--violet-main)' }}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteProd(p.id)} disabled={deletingId === p.id} className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'rgba(239,68,68,0.8)', color: 'white' }}>
                            {deletingId === p.id ? '…' : <Trash2 size={15} />}
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{p.title}</p>
                        <p className="text-xs gradient-text font-semibold mt-0.5">{p.price} €</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Categories tab ── */}
        {tab === 'categories' && (
          <div className="max-w-md">
            <form onSubmit={addCategory} className="flex gap-2 mb-6">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nouvelle catégorie…"
                className="input-violet"
              />
              <button type="submit" disabled={savingCat || !newCatName.trim()} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                <Plus size={15} /> Ajouter
              </button>
            </form>

            {deleteCatError && (
              <p className="text-xs text-red-400 mb-3">{deleteCatError}</p>
            )}

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{cat.name}</span>
                  <button
                    onClick={() => deleteCat(cat.id)}
                    disabled={deletingCatId === cat.id}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {deletingCatId === cat.id ? '…' : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Form Modal ── */}
      {showProdForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(14,12,26,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowProdForm(false) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-y-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '90vh' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 sticky top-0" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-display text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                {editingProd ? 'Modifier' : 'Ajouter un article'}
              </h2>
              <button onClick={() => setShowProdForm(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProd} className="p-5 space-y-4">
              {/* Images */}
              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Photos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                      <Image src={img} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                        style={{ background: 'rgba(14,12,26,0.7)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                    style={{ background: 'var(--bg-card-hover)', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
                  >
                    {uploading ? <span className="text-xs">…</span> : <><Upload size={16} /><span className="text-xs">Photo</span></>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Titre *</label>
                <input required value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))} className="input-violet" placeholder="Ex: Robe fleurie" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
                  className="input-violet resize-none"
                  placeholder="Détails, état, matière…"
                />
              </div>

              {/* Price + size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Prix (€) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm(f => ({...f, price: e.target.value}))} className="input-violet" placeholder="15" />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Taille</label>
                  <input value={form.size} onChange={(e) => setForm(f => ({...f, size: e.target.value}))} className="input-violet" placeholder="S / M / 38…" />
                </div>
              </div>

              {/* Category + status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Catégorie</label>
                  <select value={form.category_id} onChange={(e) => setForm(f => ({...f, category_id: e.target.value}))} className="input-violet">
                    <option value="">— Aucune —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Statut</label>
                  <select value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value as Product['status']}))} className="input-violet">
                    <option value="available">Disponible</option>
                    <option value="reserved">Réservé</option>
                    <option value="sold">Vendu</option>
                  </select>
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>Numéro WhatsApp</label>
                <input value={form.whatsapp_number} onChange={(e) => setForm(f => ({...f, whatsapp_number: e.target.value}))} className="input-violet" placeholder="+596696000000" />
              </div>

              {/* Save */}
              <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? 'Enregistrement…' : <><Check size={16} /> {editingProd ? 'Enregistrer' : 'Ajouter l\'article'}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
