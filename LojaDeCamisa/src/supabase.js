// Arquivo: src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xaswokqznoheqcfmrzif.supabase.co'
const supabaseKey = 'sb_publishable_PND4ACMk0HcT_BU_WPZNaw_5JsdffNp'

export const supabase = createClient(supabaseUrl, supabaseKey)