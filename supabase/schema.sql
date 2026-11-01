
-- Charitha's Space — private, single-owner data model
create schema if not exists private;

create table if not exists private.gift_access (
  id integer primary key check (id = 1),
  code_hash text not null
);
insert into private.gift_access (id, code_hash)
values (1, '6498e1ab14ee45ba98620c8856c53daa7570ef064e37e90eb0405ad0a03f8faa')
on conflict (id) do nothing;
revoke all on schema private from public, anon, authenticated;

create table public.site_owner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table public.site_owner enable row level security;
create policy "Owner can see membership"
  on public.site_owner for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.claim_charithas_space(gift_code text)
returns boolean language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then return false; end if;
  if gift_code is null or length(gift_code) > 128 then return false; end if;
  if not exists (
    select 1 from private.gift_access
    where id = 1
    and code_hash = encode(sha256(convert_to(gift_code, 'UTF8')), 'hex')
  ) then return false; end if;
  lock table public.site_owner in exclusive mode;
  if exists (select 1 from public.site_owner) then
    return exists (select 1 from public.site_owner where user_id = (select auth.uid()));
  end if;
  insert into public.site_owner(user_id) values ((select auth.uid()));
  return true;
end;
$$;
revoke all on function public.claim_charithas_space(text) from public, anon;
grant execute on function public.claim_charithas_space(text) to authenticated;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled' check (char_length(title) <= 140),
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 400),
  created_at timestamptz not null default now()
);
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  emoji text not null default '✨' check (char_length(emoji) <= 16),
  created_at timestamptz not null default now()
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  unique (activity_id, completed_on)
);

create index notes_user_recent on public.notes(user_id, updated_at desc);
create index photos_user_recent on public.photos(user_id, created_at desc);
create index activities_user_recent on public.activities(user_id, created_at);
create index activity_logs_user_date on public.activity_logs(user_id, completed_on);

alter table public.notes enable row level security;
alter table public.photos enable row level security;
alter table public.activities enable row level security;
alter table public.activity_logs enable row level security;

create policy "Owner manages notes" on public.notes
  for all to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())));
create policy "Owner manages photos" on public.photos
  for all to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())));
create policy "Owner manages activities" on public.activities
  for all to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())));
create policy "Owner manages activity logs" on public.activity_logs
  for all to authenticated
  using ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())))
  with check ((select auth.uid()) = user_id and exists (select 1 from public.site_owner where user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('charitha-gallery', 'charitha-gallery', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Owner reads private gallery" on storage.objects
  for select to authenticated
  using (bucket_id = 'charitha-gallery'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.site_owner where user_id = (select auth.uid())));
create policy "Owner uploads private gallery" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'charitha-gallery'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.site_owner where user_id = (select auth.uid())));
create policy "Owner deletes private gallery" on storage.objects
  for delete to authenticated
  using (bucket_id = 'charitha-gallery'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.site_owner where user_id = (select auth.uid())));

grant select on public.site_owner to authenticated;
grant select, insert, update, delete on public.notes, public.photos, public.activities, public.activity_logs to authenticated;
