import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btpvpvdzvmvfyjditdpb.supabase.com'
const supabaseKey = 'sb_publishable_zIHQJ1KsHy1MK7LGDE7UGA__Af61o-6'

export const supabase = createClient(supabaseUrl, supabaseKey)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)