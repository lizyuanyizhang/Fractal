/**
 * 验证 Supabase 配置
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// 加载 .env 文件
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 验证 Supabase 配置...\n')

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：环境变量未设置')
  console.log('\n请确保 .env 文件中包含：')
  console.log('VITE_SUPABASE_URL=...')
  console.log('VITE_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

// 验证 URL 格式
console.log('📋 配置信息：')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`)

// 检查 URL 格式
const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/
if (!urlPattern.test(supabaseUrl)) {
  console.error('\n❌ URL 格式不正确！')
  console.log('   正确的格式应该是：https://[项目ID].supabase.co')
  console.log(`   当前 URL: ${supabaseUrl}`)
  process.exit(1)
}

// 检查 Key 格式（JWT token 通常以 eyJ 开头）
if (!supabaseKey.startsWith('eyJ')) {
  console.warn('\n⚠️  Key 格式可能不正确')
  console.log('   正确的 anon key 应该是一个 JWT token（通常以 eyJ 开头）')
  console.log(`   当前 Key 开头: ${supabaseKey.substring(0, 10)}...`)
}

// 尝试创建客户端并测试连接
console.log('\n🔌 测试 Supabase 连接...')

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // 测试：尝试获取当前用户（即使未登录也应该能创建客户端）
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError && authError.message.includes('Invalid API key')) {
    console.error('\n❌ 连接失败：API Key 无效')
    console.log('   请检查 VITE_SUPABASE_ANON_KEY 是否正确')
    process.exit(1)
  }
  
  // 测试：尝试查询 tasks 表（即使表不存在，也能验证连接）
  const { error: queryError } = await supabase
    .from('tasks')
    .select('id')
    .limit(1)
  
  if (queryError) {
    if (queryError.code === 'PGRST204' || queryError.message.includes('relation') || queryError.message.includes('does not exist')) {
      console.log('\n✅ 连接成功！')
      console.log('⚠️  注意：tasks 表可能尚未创建')
      console.log('   请运行 database/create_tasks_table.sql 创建表')
    } else if (queryError.message.includes('Invalid API key') || queryError.message.includes('JWT')) {
      console.error('\n❌ 连接失败：API Key 无效或格式错误')
      console.log('   请检查 VITE_SUPABASE_ANON_KEY 是否正确')
      process.exit(1)
    } else {
      console.error('\n❌ 查询失败：', queryError.message)
      process.exit(1)
    }
  } else {
    console.log('\n✅ 连接成功！')
    console.log('✅ tasks 表存在且可访问')
  }
  
  console.log('\n🎉 Supabase 配置验证通过！')
  
} catch (error) {
  console.error('\n❌ 连接失败：', error.message)
  if (error.message.includes('fetch')) {
    console.log('   可能是网络问题或 URL 不正确')
  }
  process.exit(1)
}

