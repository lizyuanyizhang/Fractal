/**
 * 页面调试组件
 * 用于检查页面是否正确加载
 */
import { useEffect } from 'react'

interface PageDebugProps {
  pageName: string
}

export const PageDebug = ({ pageName }: PageDebugProps) => {
  useEffect(() => {
    console.log(`✅ ${pageName} 页面已加载`)
  }, [pageName])

  return null
}

