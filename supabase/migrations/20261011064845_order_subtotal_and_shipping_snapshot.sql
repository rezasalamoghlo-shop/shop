alter table public.orders
  add column if not exists subtotal_price numeric(12,2) not null default 0 check (subtotal_price >= 0);
