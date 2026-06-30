create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- No insert/delete policy: rows are created only via the trigger below,
-- using the trigger function's elevated (security definer) privileges.

-- Auto-create a profile row whenever a new auth user signs up,
-- using the name passed in supabase.auth.signUp({ options: { data: { name } } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profile rows for any existing users created before this migration.
insert into public.profiles (id, name)
select id, raw_user_meta_data->>'name'
from auth.users
on conflict (id) do nothing;
