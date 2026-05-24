import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://dnmancwwtcxpjvivgsjm.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Aw7PuiBL3p2RegM60ggFVw_3V-AJAu-'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
