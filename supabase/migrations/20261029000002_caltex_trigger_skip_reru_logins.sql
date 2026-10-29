-- This Supabase project is shared with other apps. Caltex's trigger on auth.users
-- gave every new login with an email a caltex_admins 'staff' row, including Reru
-- clients created with an email. Reru logins now carry raw_user_meta_data.app = 'reru'
-- (set by self sign-up and by admin add-client), and the trigger skips them.
--
-- The function belongs to the Caltex app: if Caltex redeploys its own definition,
-- this guard must be kept.

CREATE OR REPLACE FUNCTION public.handle_new_caltex_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reru client logins are not Caltex staff.
  IF NEW.raw_user_meta_data->>'app' = 'reru' THEN
    RETURN NEW;
  END IF;

  -- caltex_admins.email is NOT NULL; skip phone-only (emailless) signups entirely.
  IF NEW.email IS NOT NULL THEN
    IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role_to_assign' IS NOT NULL THEN
      INSERT INTO public.caltex_admins (id, email, role)
      VALUES (NEW.id, NEW.email, (NEW.raw_user_meta_data->>'role_to_assign')::VARCHAR);
    ELSE
      INSERT INTO public.caltex_admins (id, email, role)
      VALUES (NEW.id, NEW.email, 'staff');
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
