drop function if exists public.get_user_email_by_id(uuid);

create or replace function public.get_user_email_by_id(user_id uuid)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select email
  from auth.users
  where id = user_id
  limit 1;
$$;

grant execute on function public.get_user_email_by_id(uuid) to authenticated;
grant execute on function public.get_user_email_by_id(uuid) to anon;
