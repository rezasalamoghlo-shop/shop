alter table public.orders
  add column if not exists checkout_session_id uuid;

create unique index if not exists orders_checkout_session_id_uidx
  on public.orders (checkout_session_id)
  where checkout_session_id is not null;
