'use client'

/**
 * 认证包装组件
 * 负责监听用户认证状态变化并清理数据
 */

import { useAuthListener } from '@/hooks/use-auth-listener'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  // 监听用户认证状态变化
  useAuthListener()

  return <>{children}</>
}
