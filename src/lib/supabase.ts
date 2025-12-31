/**
 * Supabase 客户端配置
 */
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取 Supabase 配置
// 这些值需要在 .env 文件中设置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL 或 Anon Key 未设置。请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  )
}

// 创建 Supabase 客户端
// 即使环境变量为空，也创建客户端（避免应用崩溃）
// 实际使用时会在服务层检查配置
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

