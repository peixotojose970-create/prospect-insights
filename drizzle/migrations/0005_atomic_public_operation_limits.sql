CREATE TABLE public.operation_rate_windows (operation text PRIMARY KEY, window_start timestamptz NOT NULL, calls integer NOT NULL DEFAULT 0);
GRANT ALL ON public.operation_rate_windows TO service_role;
ALTER TABLE public.operation_rate_windows ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_public_operation(p_operation text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_limit integer; v_now timestamptz := clock_timestamp(); v_start timestamptz; v_calls integer;
BEGIN
 v_limit := CASE p_operation WHEN 'search' THEN 60 WHEN 'details' THEN 120 WHEN 'photos' THEN 60 WHEN 'translate' THEN 20 WHEN 'audit' THEN 30 WHEN 'usage' THEN 240 ELSE NULL END;
 IF v_limit IS NULL THEN RAISE EXCEPTION 'Unknown operation'; END IF;
 INSERT INTO public.operation_rate_windows(operation,window_start,calls) VALUES(p_operation,v_now,0) ON CONFLICT DO NOTHING;
 SELECT window_start,calls INTO v_start,v_calls FROM public.operation_rate_windows WHERE operation=p_operation FOR UPDATE;
 IF v_now >= v_start + interval '60 seconds' THEN v_start := v_now; v_calls := 0; END IF;
 IF v_calls >= v_limit THEN RETURN false; END IF;
 UPDATE public.operation_rate_windows SET window_start=v_start,calls=v_calls+1 WHERE operation=p_operation;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_public_operation(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_public_operation(text) TO service_role;