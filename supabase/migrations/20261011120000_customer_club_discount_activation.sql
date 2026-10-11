alter table public.profiles
  add column if not exists discount_active boolean not null default false;

update public.profiles
set discount_active = true
where coalesce(discount_percent, 0) > 0
  and discount_active = false;
