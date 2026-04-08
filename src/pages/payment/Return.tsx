import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';

type Status = 'verifying' | 'completed' | 'failed' | 'unknown';

const MAX_POLLS = 5;
const POLL_INTERVAL_MS = 2000;

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const pollCount = useRef(0);

  useEffect(() => {
    if (!orderId) {
      setStatus('unknown');
      setMessage('No order ID found in the URL.');
      return;
    }

    let cancelled = false;

    async function verify() {
      const { data, error } = await supabase.functions.invoke('verify-cashfree-order', {
        body: { cashfree_order_id: orderId },
      });

      if (cancelled) return;

      if (error) {
        console.error('verify-cashfree-order error:', error);
        setStatus('failed');
        setMessage('Could not verify payment status. Please contact support if you were charged.');
        return;
      }

      const paymentStatus: string = data?.status ?? 'pending';

      if (paymentStatus === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        setStatus('completed');
        setMessage('Payment successful! Redirecting to your library...');
        setTimeout(() => navigate('/library'), 2000);
        return;
      }

      if (paymentStatus === 'failed') {
        setStatus('failed');
        setMessage('Payment was not completed.');
        return;
      }

      // Still pending — poll a few more times
      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setStatus('unknown');
        setMessage(
          'Payment is still being processed. It may take a minute. ' +
          'Check your library shortly — if you were charged, your purchase will appear automatically.'
        );
        return;
      }

      setMessage(`Verifying payment… (attempt ${pollCount.current + 1}/${MAX_POLLS})`);
      setTimeout(verify, POLL_INTERVAL_MS);
    }

    verify();
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
                {status === 'failed' ? 'Payment not completed' : 'Payment status unknown'}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/library')}>Go to Library</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
