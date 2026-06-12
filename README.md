# Vide-Dressing ✨

Site vide-dressing avec thème violet `#9E80E7`, panel admin complet, responsive et animé.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (base de données + stockage images)
- **Framer Motion** (animations)
- **Tailwind CSS**

---

## 1. Supabase — Setup

### 1.1 Base de données

Dans le SQL Editor de ton projet Supabase, exécute le fichier `supabase_schema.sql` fourni.

Cela crée :
- Table `categories` (id, name, slug, created_at)
- Table `products` (id, title, description, price, size, category_id, status, images[], whatsapp_number, ...)
- Policies RLS lecture publique
- Trigger `updated_at`
- 7 catégories de base

### 1.2 Storage

1. Aller dans **Storage** → **New bucket**
2. Nom : `vide-dressing`
3. ✅ Cocher **Public bucket**
4. Créer

Ajouter une policy pour l'upload public (ou utiliser le service role côté admin) :

```sql
-- Permettre upload depuis n'importe qui (si tu veux simplifier)
create policy "Public upload" on storage.objects
  for insert with check (bucket_id = 'vide-dressing');

-- Ou, restreindre avec une policy basée sur le service role uniquement
```

---

## 2. Variables d'environnement

Copier `.env.local.example` en `.env.local` et remplir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
NEXT_PUBLIC_ADMIN_PASSWORD=ton_mot_de_passe_admin
```

> ⚠️ `NEXT_PUBLIC_ADMIN_PASSWORD` sera visible dans le bundle client.
> Pour plus de sécurité en prod, utiliser un vrai système d'auth (NextAuth ou Supabase Auth).

---

## 3. Installation & dev

```bash
npm install
npm run dev
```

---

## 4. Déploiement Vercel

```bash
vercel --prod
```

Ajouter les 4 variables d'env dans les settings Vercel.

---

## 5. Utilisation Admin

- Accès : `/admin`
- Mot de passe : celui défini dans `NEXT_PUBLIC_ADMIN_PASSWORD`
- **Articles** : créer / modifier / supprimer des articles avec photos, taille, catégorie, statut (Disponible / Réservé / Vendu), numéro WhatsApp
- **Catégories** : créer / supprimer des catégories librement

---

## 6. Personnalisation

| Élément | Fichier |
|---|---|
| Couleur principale | `src/app/globals.css` → `--violet-main` |
| Nom du site | `src/app/layout.tsx` → `metadata` + `src/app/page.tsx` → `<h1>` |
| Numéro WhatsApp par défaut | `src/app/admin/page.tsx` → valeur fallback |

---

## Structure des fichiers

```
src/
  app/
    page.tsx          → Catalogue public
    layout.tsx        → Layout racine
    globals.css       → Thème violet + animations
    admin/page.tsx    → Panel admin complet
    product/[id]/
      page.tsx        → Page détail article
  lib/
    supabase.ts       → Client + types
```
