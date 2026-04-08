/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CASHFREE_MODE?: string;
  readonly VITE_SITE_URL?: string;
}

// @cashfreepayments/cashfree-js ships no TypeScript types.
// The actual interface is defined in src/lib/cashfree.ts.
declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeLoadOptions {
    mode: 'sandbox' | 'production';
  }
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal';
  }
  interface CashfreeCheckoutResult {
    error?: { message: string; type?: string };
    redirect?: boolean;
    paymentDetails?: Record<string, unknown>;
  }
  interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }
  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
