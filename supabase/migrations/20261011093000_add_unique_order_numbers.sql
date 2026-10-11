create sequence if not exists public.orders_order_number_seq;
alter table public.orders add column if not exists order_number bigint;

with numbered as (
  select id, row_number() over (order by created_at asc nulls first, id asc) as rn
  from public.orders
  where order_number is null
)
update public.orders o
set order_number = numbered.rn
from numbered
where o.id = numbered.id;

select setval(
  'public.orders_order_number_seq',
  coalesce((select max(order_number) from public.orders), 0) + 1,
  false
);

alter table public.orders
  alter column order_number set default nextval('public.orders_order_number_seq');

create unique index if not exists orders_order_number_uidx
  on public.orders (order_number);

create unique index if not exists orders_public_token_uidx
  on public.orders (public_token)
  where public_token is not null;
