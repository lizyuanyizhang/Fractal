/**
 * 验证 Supabase 配置
 * 在应用启动时调用此函数验证配置是否正确
 */
import { supabase } from './supabase'

export async function verifySupabaseConfig(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // 1. 检查环境变量是否存在
  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      message: '环境变量未设置',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      },
    }
  }

  // 2. 验证 URL 格式
  const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/
  if (!urlPattern.test(supabaseUrl)) {
    return {
      success: false,
      message: 'URL 格式不正确',
      details: {
        url: supabaseUrl,
        expectedFormat: 'https://[项目ID].supabase.co',
      },
    }
  }

  // 3. 验证 Key 格式（JWT token 通常以 eyJ 开头）
  if (!supabaseKey.startsWith('eyJ')) {
    return {
      success: false,
      message: 'Key 格式可能不正确',
      details: {
        keyPrefix: supabaseKey.substring(0, 20),
        expectedFormat: 'JWT token (通常以 eyJ 开头)',
      },
    }
  }

  // 4. 测试实际连接
  try {
    // 尝试获取当前用户（即使未登录也应该能创建客户端）
    const { error: authError } = await supabase.auth.getUser()

    if (authError && authError.message.includes('Invalid API key')) {
      return {
        success: false,
        message: 'API Key 无效',
        details: {
          error: authError.message,
        },
      }
    }

    // 测试：尝试查询 tasks 表
    const { error: queryError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1)

    if (queryError) {
      if (
        queryError.code === 'PGRST204' ||
        queryError.message.includes('relation') ||
        queryError.message.includes('does not exist')
      ) {
        return {
          success: true,
          message: '连接成功，但 tasks 表尚未创建',
          details: {
            suggestion: '请运行 database/create_tasks_table.sql 创建表',
          },
        }
      } else if (
        queryError.message.includes('Invalid API key') ||
        queryError.message.includes('JWT')
      ) {
        return {
          success: false,
          message: 'API Key 无效或格式错误',
          details: {
            error: queryError.message,
          },
        }
      } else {
        return {
          success: false,
          message: '查询失败',
          details: {
            error: queryError.message,
          },
        }
      }
    }

    return {
      success: true,
      message: 'Supabase 配置验证通过！',
      details: {
        url: supabaseUrl,
        tasksTableExists: true,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      message: '连接失败',
      details: {
        error: error.message,
      },
    }
  }
}

/**
 * 在控制台打印验证结果（开发环境使用）
 */
export async function logSupabaseConfig() {
  if (import.meta.env.DEV) {
    console.log('🔍 验证 Supabase 配置...')
    const result = await verifySupabaseConfig()
    
    if (result.success) {
      console.log('✅', result.message)
      if (result.details) {
        console.log('   详情:', result.details)
      }
    } else {
      console.error('❌', result.message)
      if (result.details) {
        console.error('   详情:', result.details)
      }
      console.error('\n请检查 .env 文件中的配置')
    }
  }
}

