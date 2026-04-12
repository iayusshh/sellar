-- Ensure Edge Functions using service_role can read/update purchases directly.
-- Required by verify-cashfree-order and cashfree-webhook reconciliation paths.

GRANT SELECT, UPDATE ON TABLE public.purchases TO service_role;
