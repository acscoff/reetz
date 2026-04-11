import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://azqbnocwgitldjfswnsc.supabase.co'
const supabaseKey = 'sb_publishable_KJamZwSN0uXt0RkQFLZkHA_aB2G8k2a'

export const supabase = createClient(supabaseUrl, supabaseKey)