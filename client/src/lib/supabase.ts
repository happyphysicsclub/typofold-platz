import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Photo = {
  id: string
  storage_path: string
  public_url: string
  caption: string | null
  uploaded_at: string
  width: number | null
  height: number | null
}
