alter table public.orders add column if not exists payment_status text not null default 'pending';
update public.orders set payment_status='paid' where status in ('paid','processing','shipped') and payment_status='pending';
create index if not exists orders_payment_status_idx on public.orders(payment_status);
