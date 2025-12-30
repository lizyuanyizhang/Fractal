import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logSupabaseConfig } from './lib/verifySupabase'

// 在开发环境验证 Supabase 配置
logSupabaseConfig()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

