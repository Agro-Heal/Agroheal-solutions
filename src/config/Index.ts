// env exports into index.ts in config folder
export const supabaseURL = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// importing Payment secret keys
export const PAYSTACK_KEY = import.meta.env.PAYSTACK_SECRET_KEYS as string;
export const FLUTTERWAVE_KEYS = import.meta.env
  .FLUTTERWAVE_SECRET_KEYS as string;
