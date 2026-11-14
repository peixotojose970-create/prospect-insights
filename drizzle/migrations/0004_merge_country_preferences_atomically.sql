CREATE OR REPLACE FUNCTION public.patch_prospecting_preferences(p_country text DEFAULT NULL,p_preference_country text DEFAULT NULL,p_patch jsonb DEFAULT '{}'::jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_country IS NOT NULL AND p_country NOT IN ('BR','US','PT','ES','FR','IT') THEN RAISE EXCEPTION 'Invalid country'; END IF;
 IF p_preference_country IS NOT NULL AND p_preference_country NOT IN ('BR','US','PT','ES','FR','IT') THEN RAISE EXCEPTION 'Invalid preference country'; END IF;
 IF jsonb_typeof(p_patch) <> 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_patch) k WHERE k NOT IN ('style','language')) THEN RAISE EXCEPTION 'Invalid patch'; END IF;
 IF p_patch ? 'style' AND (jsonb_typeof(p_patch->'style') <> 'string' OR length(p_patch->>'style') NOT BETWEEN 1 AND 200) THEN RAISE EXCEPTION 'Invalid style'; END IF;
 IF p_patch ? 'language' AND (p_patch->>'language' IS NULL OR p_patch->>'language' NOT IN ('auto','pt','pt-PT','es','fr','it','en')) THEN RAISE EXCEPTION 'Invalid language'; END IF;
 INSERT INTO public.prospecting_preferences(user_id,selected_country,countries) VALUES(auth.uid(),coalesce(p_country,'BR'),CASE WHEN p_preference_country IS NULL THEN '{}'::jsonb ELSE jsonb_build_object(p_preference_country,jsonb_build_object('style','curta','language','auto') || p_patch) END)
 ON CONFLICT(user_id) DO UPDATE SET selected_country=coalesce(p_country,prospecting_preferences.selected_country),countries=CASE WHEN p_preference_country IS NULL THEN prospecting_preferences.countries ELSE jsonb_set(prospecting_preferences.countries,ARRAY[p_preference_country],jsonb_build_object('style','curta','language','auto') || coalesce(prospecting_preferences.countries->p_preference_country,'{}'::jsonb) || p_patch,true) END,updated_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.patch_prospecting_preferences(text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.patch_prospecting_preferences(text,text,jsonb) TO authenticated;