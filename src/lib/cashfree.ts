// Cashfree Drop-in SDK wrapper (client-side)
// Type declarations for @cashfreepayments/cashfree-js live in src/vite-env.d.ts.

import { load, type CashfreeInstance, type CashfreeCheckoutResult } from '@cashfreepayments/cashfree-js';

// Cache so we don't call load() more than once per page session
let _cashfree: CashfreeInstance | null = null;

async function loadCashfree(): Promise<CashfreeInstance> {
  if (_cashfree) return _cashfree;

  const mode = (import.meta.env.VITE_CASHFREE_MODE as 'sandbox' | 'production' | undefined) ?? 'sandbox';
  _cashfree = await load({ mode });
  return _cashfree;
}

/**
 * Opens the Cashfree Drop-in payment modal.
 * Returns the SDK result — callers should check result.error.
 */
export async function openCashfreeCheckout(
  paymentSessionId: string
): Promise<CashfreeCheckoutResult> {
  const cashfree = await loadCashfree();
  return cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_modal',
  });
}
