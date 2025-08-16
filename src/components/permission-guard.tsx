'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/stores'
import { Card, CardContent, Button } from '@/components/ui'
import { ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface PermissionGuardProps {
  children: ReactNode
  requiredUserType?: 'normal' | 'premium' | 'admin'
  requireAuth?: boolean
  fallback?: ReactNode
  showUpgrade?: boolean
}

/**
 * 权限守卫组件
 * 用于控制基于用户权限的内容访问
 */
export function PermissionGuard({
  children,
  requiredUserType = 'normal',
  requireAuth = true,
  fallback,
  showUpgrade = true
}: PermissionGuardProps) {
  const { user, isAuthenticated } = useAuthStore()

  // 检查是否需要认证
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <LockClosedIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">需要登录</h3>
          <p className="text-muted-foreground mb-4">
            请先登录以访问此功能
          </p>
          <Link href="/auth">
            <Button className="w-full">
              立即登录
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // 检查用户权限等级
  if (user && !checkUserPermission(user.userType, requiredUserType)) {
    return fallback || (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <ShieldExclamationIcon className="h-12 w-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">权限不足</h3>
          <p className="text-muted-foreground mb-4">
            此功能需要 <span className="font-semibold">{getTypeDisplayName(requiredUserType)}</span> 权限
          </p>
          {showUpgrade && user.userType !== 'admin' && (
            <div className="space-y-2">
              <Button className="w-full">
                升级账户
              </Button>
              <p className="text-xs text-muted-foreground">
                升级后即可使用此功能
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

/**
 * 检查用户权限
 */
function checkUserPermission(userType: string, requiredType: string): boolean {
  const typeHierarchy = {
    normal: 1,
    premium: 2,
    admin: 3
  }

  const userLevel = typeHierarchy[userType as keyof typeof typeHierarchy] || 0
  const requiredLevel = typeHierarchy[requiredType as keyof typeof typeHierarchy] || 0

  return userLevel >= requiredLevel
}

/**
 * 获取用户类型显示名称
 */
function getTypeDisplayName(userType: string): string {
  const typeNames = {
    normal: '普通用户',
    premium: '高级用户',
    admin: '管理员'
  }
  return typeNames[userType as keyof typeof typeNames] || '未知'
}

/**
 * 权限检查Hook
 */
export function usePermission() {
  const { user, isAuthenticated } = useAuthStore()

  const hasPermission = (requiredType: 'normal' | 'premium' | 'admin' = 'normal'): boolean => {
    if (!isAuthenticated || !user) return false
    return checkUserPermission(user.userType, requiredType)
  }

  const isAdmin = (): boolean => {
    return hasPermission('admin')
  }

  const isPremium = (): boolean => {
    return hasPermission('premium')
  }

  const canUseFeature = (feature: string): boolean => {
    if (!isAuthenticated || !user) return false

    // 定义功能权限映射
    const featurePermissions: Record<string, 'normal' | 'premium' | 'admin'> = {
      'basic_sprint': 'normal',
      'ai_generation': 'normal',
      'advanced_stats': 'premium',
      'unlimited_ai': 'admin',
      'user_management': 'admin',
      'system_settings': 'admin'
    }

    const requiredPermission = featurePermissions[feature] || 'normal'
    return hasPermission(requiredPermission)
  }

  return {
    user,
    isAuthenticated,
    hasPermission,
    isAdmin,
    isPremium,
    canUseFeature
  }
}

/**
 * 功能权限组件
 * 用于包装需要特定权限的功能
 */
interface FeatureGuardProps {
  children: ReactNode
  feature: string
  fallback?: ReactNode
}

export function FeatureGuard({ children, feature, fallback }: FeatureGuardProps) {
  const { canUseFeature } = usePermission()

  if (!canUseFeature(feature)) {
    return fallback || (
      <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center">
        <LockClosedIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          此功能需要更高权限
        </p>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * AI使用限制组件
 */
interface AIUsageLimitProps {
  children: ReactNode
  onLimitReached?: () => void
}

export function AIUsageLimit({ children, onLimitReached }: AIUsageLimitProps) {
  const { user } = usePermission()

  // 这里应该检查AI使用次数
  // 暂时返回children，实际实现需要从API获取使用情况
  
  return <>{children}</>
}

/**
 * 用户等级显示组件
 */
export function UserTypeDisplay() {
  const { user, isAuthenticated } = usePermission()

  if (!isAuthenticated || !user) {
    return null
  }

  const typeInfo = {
    normal: { name: '普通用户', color: 'bg-gray-100 text-gray-800' },
    premium: { name: '高级用户', color: 'bg-yellow-100 text-yellow-800' },
    admin: { name: '管理员', color: 'bg-red-100 text-red-800' }
  }

  const info = typeInfo[user.userType as keyof typeof typeInfo] || typeInfo.normal

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
      {info.name}
    </span>
  )
}
