CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role text NOT NULL CHECK (role IN ('admin','user')), UNIQUE (user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.reserve_places_call() RETURNS TABLE(month text, calls integer, monthly_limit integer, allowed boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_month text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM'); v_limit integer; v_calls integer;
BEGIN
 SELECT s.monthly_limit INTO v_limit FROM public.places_api_settings s WHERE s.id=1 FOR UPDATE;
 IF v_limit IS NULL THEN RAISE EXCEPTION 'Missing Places settings'; END IF;
 INSERT INTO public.places_api_usage(month,calls) VALUES(v_month,0) ON CONFLICT DO NOTHING;
 SELECT u.calls INTO v_calls FROM public.places_api_usage u WHERE u.month=v_month FOR UPDATE;
 IF v_calls >= floor(v_limit::numeric * 0.95) THEN RETURN QUERY SELECT v_month,v_calls,v_limit,false; RETURN; END IF;
 UPDATE public.places_api_usage u SET calls=u.calls+1,updated_at=now() WHERE u.month=v_month RETURNING u.calls INTO v_calls;
 RETURN QUERY SELECT v_month,v_calls,v_limit,true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_places_call() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_places_call() TO service_role;
CREATE OR REPLACE FUNCTION public.set_places_limit_authorized(p_limit integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='admin') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 IF p_limit < 10 OR p_limit > 1000000 OR p_limit IS NULL THEN RAISE EXCEPTION 'Invalid limit'; END IF;
 PERFORM 1 FROM public.places_api_settings s WHERE s.id=1 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing Places settings'; END IF;
 UPDATE public.places_api_settings SET monthly_limit=p_limit,updated_at=now() WHERE id=1;
END; $$;
REVOKE ALL ON FUNCTION public.set_places_limit_authorized(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_places_limit_authorized(integer) TO authenticated;
COMMENT ON FUNCTION public.increment_places_usage(text,integer) IS 'DEPRECATED: application uses reserve_places_call for atomic budget enforcement; retained for additive rollback only';