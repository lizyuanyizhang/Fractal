/**
 * 验证 Supabase 配置格式
 * 这是一个简单的格式验证，不进行实际连接测试
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

console.log('🔍 验证 Supabase 配置格式...\n')

try {
  // 读取 .env 文件
  const envPath = resolve(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  
  // 解析环境变量
  const envVars = {}
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
  
  const supabaseUrl = envVars.VITE_SUPABASE_URL
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY
  
  console.log('📋 配置信息：')
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl || '❌ 未设置'}`)
  console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : '❌ 未设置'}`)
  console.log()
  
  // 验证 URL
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL 未设置')
    process.exit(1)
  }
  
  if (!supabaseKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY 未设置')
    process.exit(1)
  }
  
  // 检查 URL 格式
  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/
  if (!urlPattern.test(supabaseUrl)) {
    console.error('❌ URL 格式不正确！')
    console.log('   正确的格式应该是：https://[项目ID].supabase.co')
    console.log(`   当前 URL: ${supabaseUrl}`)
    console.log()
    console.log('   请检查：')
    console.log('   1. URL 是否以 https:// 开头')
    console.log('   2. URL 是否以 .supabase.co 结尾')
    console.log('   3. 中间应该是项目 ID（不是 dashboard URL）')
    process.exit(1)
  }
  
  // 检查 Key 格式
  if (supabaseKey.length < 100) {
    console.warn('⚠️  Key 长度似乎过短')
    console.log('   正确的 anon key 通常是一个很长的 JWT token（200+ 字符）')
  }
  
  if (!supabaseKey.startsWith('eyJ')) {
    console.warn('⚠️  Key 格式可能不正确')
    console.log('   正确的 anon key 应该是一个 JWT token（通常以 eyJ 开头）')
    console.log(`   当前 Key 开头: ${supabaseKey.substring(0, 20)}...`)
    console.log()
    console.log('   请检查：')
    console.log('   1. 是否复制了完整的 key（包括所有字符）')
    console.log('   2. 是否使用了 anon/public key（不是 service_role key）')
  }
  
  console.log('✅ 配置格式验证通过！')
  console.log()
  console.log('📝 下一步：')
  console.log('   1. 确保已在 Supabase 中创建 tasks 表')
  console.log('   2. 运行 npm run dev 启动开发服务器')
  console.log('   3. 在应用中测试 Supabase 连接')
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ .env 文件不存在')
    console.log('   请先创建 .env 文件')
  } else {
    console.error('❌ 验证失败：', error.message)
  }
  process.exit(1)
}

