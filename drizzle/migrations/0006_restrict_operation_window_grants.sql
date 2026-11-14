REVOKE ALL ON TABLE public.operation_rate_windows FROM anon, authenticated;
GRANT ALL ON TABLE public.operation_rate_windows TO service_role;