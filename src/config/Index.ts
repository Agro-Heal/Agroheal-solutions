// env exports into index.ts in config folder
// export const baseURL = import.meta.env.VITE_PUBLIC_URI;
export const supabaseURL = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
