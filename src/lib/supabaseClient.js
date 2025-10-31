import { createClient } from '@supabase/supabase-js'

// 使用正确的Supabase配置
const supabaseUrl = 'http://127.0.0.1:54322'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

// 创建Supabase客户端，使用简单配置
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
})

export { supabase }