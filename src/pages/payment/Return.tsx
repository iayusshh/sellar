// /payment/return — landing page for UPI / netbanking redirects.
// Polls verify-cashfree-order until the payment settles or we give up.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';

type Status = 'verifying' | 'completed' | 'failed' | 'unknown';

const MAX_POLLS      = 6;
const POLL_INTERVAL  = 2500; // ms between attempts
const LAST_ORDER_STORAGE_KEY = 'sellar_last_cashfree_order_id';

function normalizeOrderId(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const lowered = value.toLowerCase();
  if (
    value === '{order_id}' ||
    value === '{cf_order_id}' ||
    lowered === 'undefined' ||
    lowered === 'null'
  ) {
    return null;
  }

  return value;
}

function isValidSellarOrderId(value: string | null): value is string {
  if (!value) return false;
  return /^sellar_[0-9a-fA-F-]{36}$/.test(value) || /^[0-9a-fA-F-]{36}$/.test(value);
}

function getFunctionsHttpStatus(error: unknown): number | null {
  const status = (error as { context?: { status?: unknown } } | null)?.context?.status;
  return typeof status === 'number' ? status : null;
}

async function invokeVerifyOrder(orderId: string, accessToken: string) {
  return supabase.functions.invoke<{ status: string }>('verify-cashfree-order', {
    body: { cashfree_order_id: orderId },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function getFreshAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const isSessionFresh =
    !!session?.access_token &&
    (!session.expires_at || session.expires_at > nowSeconds + 30);
  if (isSessionFresh) return session?.access_token ?? null;

  // Redirect flows can race with session hydration, or carry an expired access token.
  // Force a refresh when the token is missing or near expiry.
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn('refreshSession failed on payment return:', error.message);
  }

  return data.session?.access_token ?? null;
}

export default function PaymentReturn() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const orderIdFromUrlRaw = normalizeOrderId(
    searchParams.get('cf_order') ??
    searchParams.get('cf_order_id') ??
    searchParams.get('order_id')
  );
  const orderIdFromUrl = isValidSellarOrderId(orderIdFromUrlRaw) ? orderIdFromUrlRaw : null;
  const orderId = orderIdFromUrl ?? normalizeOrderId(localStorage.getItem(LAST_ORDER_STORAGE_KEY));
  const attempt         = useRef(0);

  const [status,  setStatus]  = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (orderIdFromUrl) {
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, orderIdFromUrl);
    }

    if (!orderId) {
      setStatus('unknown');
      setMessage('No valid order ID in URL.');
      return;
    }

    const resolvedOrderId = orderId;

    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      const accessToken = await getFreshAccessToken();
      if (!accessToken) {
        attempt.current += 1;
        if (attempt.current >= MAX_POLLS) {
          setStatus('unknown');
          setMessage('Session expired during payment verification. Please sign in and check your library.');
          return;
        }

        setMessage(`Verifying... (${attempt.current + 1}/${MAX_POLLS})`);
        setTimeout(poll, POLL_INTERVAL);
        return;
      }

      let { data, error } = await invokeVerifyOrder(resolvedOrderId, accessToken);

      // A provider redirect can race with token refresh. If gateway returned 401,
      // force one immediate refresh + retry before counting this attempt as failed.
      if (error && getFunctionsHttpStatus(error) === 401) {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
        const retryToken = refreshed.session?.access_token;
        if (!refreshErr && retryToken) {
          const retry = await invokeVerifyOrder(resolvedOrderId, retryToken);
          data = retry.data;
          error = retry.error;
        }
      }

      if (cancelled) return;

      if (error) {
        const httpStatus = getFunctionsHttpStatus(error);
        console.error('verify-cashfree-order:', { httpStatus, error });

        if (httpStatus === 401) {
          setStatus('unknown');
          setMessage('Session expired during payment verification. Please sign in and check your library.');
          return;
        }

        if (httpStatus === 403) {
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
          setStatus('unknown');
          setMessage('Please sign in with the same account that started this purchase, then check your library.');
          return;
        }

        attempt.current += 1;
        if (attempt.current >= MAX_POLLS) {
          setStatus('unknown');
          setMessage(
            'Could not verify payment yet. If you were charged, your purchase will appear automatically shortly.'
          );
          return;
        }

        setMessage(`Verifying... (${attempt.current + 1}/${MAX_POLLS})`);
        setTimeout(poll, POLL_INTERVAL);
        return;
      }

      const s = data?.status ?? 'pending';

      if (s === 'completed') {
        localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
        queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        setStatus('completed');
        setMessage('Payment successful! Redirecting to your library...');
        setTimeout(() => navigate('/library'), 2000);
        return;
      }

      if (s === 'failed') {
        localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
        setStatus('failed');
        setMessage('Payment was not completed.');
        return;
      }

      // Still pending
      attempt.current += 1;
      if (attempt.current >= MAX_POLLS) {
        setStatus('unknown');
        setMessage(
          'Payment is still processing. Check your library in a minute — ' +
          'if you were charged, your purchase will appear automatically.'
        );
        return;
      }

      setMessage(`Verifying... (${attempt.current + 1}/${MAX_POLLS})`);
      setTimeout(poll, POLL_INTERVAL);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderId, orderIdFromUrl, navigate, queryClient]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">

          {status === 'verifying' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Processing your payment</h1>
              <p className="text-muted-foreground text-sm">{message}</p>
            </>
          )}

          {status === 'completed' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Payment successful!</h1>
              <p className="text-muted-foreground text-sm">{message}</p>
            </>
          )}

          {(status === 'failed' || status === 'unknown') && (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">
                {status === 'failed' ? 'Payment not completed' : 'Still processing'}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/library')}>Go to Library</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>Try Again</Button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
