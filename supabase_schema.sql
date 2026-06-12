-- ==============================================
-- VIDE-DRESSING — Schema Supabase
-- ==============================================

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(10, 2) not null,
  size text,
  category_id uuid references categories(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  images text[] default '{}',
  whatsapp_number text default '0600000000',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS : lecture publique
alter table categories enable row level security;
alter table products enable row level security;

create policy "Public read categories" on categories for select using (true);
create policy "Public read products" on products for select using (true);

-- Admin : toutes opérations avec service role (pas de policy supplémentaire nécessaire)

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Seed categories de base
insert into categories (name, slug) values
  ('Robes', 'robes'),
  ('Hauts', 'hauts'),
  ('Bas', 'bas'),
  ('Chaussures', 'chaussures'),
  ('Sacs', 'sacs'),
  ('Accessoires', 'accessoires'),
  ('Autre', 'autre')
on conflict (slug) do nothing;
