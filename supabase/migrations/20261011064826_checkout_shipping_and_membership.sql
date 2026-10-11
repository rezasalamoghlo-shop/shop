create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  estimated_delivery text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shipping_methods enable row level security;

alter table public.orders
  add column if not exists shipping_method_id uuid references public.shipping_methods(id) on delete set null,
  add column if not exists shipping_method_name text,
  add column if not exists shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  add column if not exists estimated_delivery text;

create index if not exists orders_status_created_at_idx on public.orders(status, created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists shipping_methods_active_sort_idx on public.shipping_methods(is_active, sort_order);
