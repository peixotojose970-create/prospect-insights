CREATE TABLE public.places_api_usage (
  month text PRIMARY KEY,
  calls integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.places_api_usage TO service_role;
ALTER TABLE public.places_api_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.places_api_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_limit integer NOT NULL DEFAULT 1000 CHECK (monthly_limit > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.places_api_settings TO service_role;
ALTER TABLE public.places_api_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.places_api_settings (id, monthly_limit) VALUES (1, 1000);

CREATE OR REPLACE FUNCTION public.increment_places_usage(p_month text, p_calls integer)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.places_api_usage (month, calls) VALUES (p_month, p_calls)
  ON CONFLICT (month) DO UPDATE SET calls = places_api_usage.calls + EXCLUDED.calls, updated_at = now()
  RETURNING calls;
$$;
REVOKE ALL ON FUNCTION public.increment_places_usage(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_places_usage(text, integer) TO service_role;