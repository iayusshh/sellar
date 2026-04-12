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

export default function PaymentReturn() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();
  const orderId         = searchParams.get('order_id');
  const attempt         = useRef(0);

  const [status,  setStatus]  = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (!orderId) {
      setStatus('unknown');
      setMessage('No order ID in URL.');
      return;
    }

    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke<{ status: string }>(
        'verify-cashfree-order',
        {
          body:    { cashfree_order_id: orderId },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (cancelled) return;

      if (error) {
        console.error('verify-cashfree-order:', error);
        setStatus('failed');
        setMessage('Could not verify payment. Contact support if you were charged.');
        return;
      }

      const s = data?.status ?? 'pending';

      if (s === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        setStatus('completed');
        setMessage('Payment successful! Redirecting to your library...');
        setTimeout(() => navigate('/library'), 2000);
        return;
      }

      if (s === 'failed') {
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

      setMessage(`Verifying… (${attempt.current + 1}/${MAX_POLLS})`);
      setTimeout(poll, POLL_INTERVAL);
    }

    poll();
    return () => { cancelled = true; };
  }, [orderId, navigate, queryClient]);

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
