import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin API routes)
export const supabaseAdmin = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

export type Category = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type Product = {
  id: string
  title: string
  description: string | null
  price: number
  size: string | null
  category_id: string | null
  status: 'available' | 'reserved' | 'sold'
  images: string[]
  whatsapp_number: string
  created_at: string
  updated_at: string
  categories?: Category
}
