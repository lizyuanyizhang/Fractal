import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { logSupabaseConfig } from './lib/verifySupabase'

// 在开发环境验证 Supabase 配置（异步执行，不阻塞渲染）
if (import.meta.env.DEV) {
  logSupabaseConfig().catch((error) => {
    console.error('Supabase 配置验证失败:', error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

