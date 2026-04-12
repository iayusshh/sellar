// Cashfree Drop-in SDK wrapper (client-side).
// Type declarations live in src/vite-env.d.ts.

import { load, type CashfreeInstance, type CashfreeCheckoutResult } from '@cashfreepayments/cashfree-js';

let _instance: CashfreeInstance | null = null;

async function getInstance(): Promise<CashfreeInstance> {
  if (_instance) return _instance;
  const mode = (import.meta.env.VITE_CASHFREE_MODE as 'sandbox' | 'production') ?? 'sandbox';
  _instance = await load({ mode });
  return _instance;
}

/**
 * Opens the Cashfree Drop-in payment modal.
 * Resolves when the user completes, cancels, or the modal closes.
 * Check `result.error` — non-null means payment did not succeed.
 */
export async function openCheckout(paymentSessionId: string): Promise<CashfreeCheckoutResult> {
  const cashfree = await getInstance();
  return cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });
}
