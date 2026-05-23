create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Sin categoria',
  expires date,
  quantity text not null default '1 unidad',
  barcode text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Users can read their own products"
on public.products
for select
using (auth.uid() = user_id);

create policy "Users can insert their own products"
on public.products
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own products"
on public.products
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own products"
on public.products
for delete
using (auth.uid() = user_id);

create index if not exists products_user_created_at_idx
on public.products (user_id, created_at desc);
