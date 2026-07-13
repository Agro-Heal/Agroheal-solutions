drop function if exists public.get_user_id_by_email(text);

create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;
$$;

grant execute on function public.get_user_id_by_email(text) to authenticated;
grant execute on function public.get_user_id_by_email(text) to anon;
