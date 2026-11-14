CREATE TABLE public.scoped_operation_windows(operation text NOT NULL, subject text NOT NULL, window_start timestamptz NOT NULL, calls integer NOT NULL DEFAULT 0, PRIMARY KEY(operation,subject));
GRANT ALL ON public.scoped_operation_windows TO service_role;
REVOKE ALL ON public.scoped_operation_windows FROM anon,authenticated;
ALTER TABLE public.scoped_operation_windows ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_scoped_operation(p_operation text,p_user text,p_origin text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_limit integer; v_now timestamptz:=clock_timestamp(); v_subject text; v_start timestamptz; v_calls integer; v_cap integer;
BEGIN
 IF p_user !~ '^(anonymous|user:[0-9a-f-]{36})$' OR p_origin !~ '^origin:[0-9a-f]{64}$' OR p_user IS NULL OR p_origin IS NULL THEN RAISE EXCEPTION 'Invalid subject'; END IF;
 IF NOT public.reserve_public_operation(p_operation) THEN RETURN false; END IF;
 v_limit:=CASE p_operation WHEN 'search' THEN 60 WHEN 'details' THEN 120 WHEN 'photos' THEN 60 WHEN 'translate' THEN 20 WHEN 'audit' THEN 30 WHEN 'usage' THEN 240 END;
 DELETE FROM public.scoped_operation_windows WHERE window_start < v_now - interval '2 minutes';
 FOREACH v_subject IN ARRAY ARRAY[p_user,p_origin] LOOP
  v_cap:=CASE WHEN v_subject=p_origin THEN v_limit ELSE greatest(1,v_limit/4) END;
  INSERT INTO public.scoped_operation_windows(operation,subject,window_start,calls) VALUES(p_operation,v_subject,v_now,0) ON CONFLICT DO NOTHING;
  SELECT window_start,calls INTO v_start,v_calls FROM public.scoped_operation_windows WHERE operation=p_operation AND subject=v_subject FOR UPDATE;
  IF v_now >= v_start + interval '60 seconds' THEN v_start:=v_now; v_calls:=0; END IF;
  IF v_calls >= v_cap THEN RETURN false; END IF;
  UPDATE public.scoped_operation_windows SET window_start=v_start,calls=v_calls+1 WHERE operation=p_operation AND subject=v_subject;
 END LOOP;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_scoped_operation(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_scoped_operation(text,text,text) TO service_role;