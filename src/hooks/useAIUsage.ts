import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores'
import { 
  getAIUsageStats, 
  checkAIUsagePermission, 
  AI_USAGE_LIMITS 
} from '@/lib/ai-usage'
import type { UserType } from '@/types'

interface AIUsageStats {
  dailyUsed: number
  dailyLimit: number
  monthlyUsed: number
  monthlyLimit: number
  canUse: boolean
  dailyRemaining: number
  monthlyRemaining: number
  isLoading: boolean
  error: string | null
}

interface AIUsagePermission {
  canUse: boolean
  reason?: string
  dailyRemaining: number
  monthlyRemaining: number
}

/**
 * AI使用情况管理Hook
 */
export function useAIUsage() {
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<AIUsageStats>({
    dailyUsed: 0,
    dailyLimit: 0,
    monthlyUsed: 0,
    monthlyLimit: 0,
    canUse: false,
    dailyRemaining: 0,
    monthlyRemaining: 0,
    isLoading: true,
    error: null
  })

  const [permission, setPermission] = useState<AIUsagePermission>({
    canUse: false,
    dailyRemaining: 0,
    monthlyRemaining: 0
  })

  // 获取使用统计
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: '用户未登录'
      }))
      return
    }

    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }))
      
      const usageStats = await getAIUsageStats(user.id, user.userType)
      
      setStats({
        dailyUsed: usageStats.dailyUsed,
        dailyLimit: usageStats.dailyLimit,
        monthlyUsed: usageStats.monthlyUsed,
        monthlyLimit: usageStats.monthlyLimit,
        canUse: usageStats.canUse,
        dailyRemaining: usageStats.dailyLimit === -1 ? -1 : Math.max(0, usageStats.dailyLimit - usageStats.dailyUsed),
        monthlyRemaining: usageStats.monthlyLimit === -1 ? -1 : Math.max(0, usageStats.monthlyLimit - usageStats.monthlyUsed),
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('获取AI使用统计失败:', error)
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '获取使用统计失败'
      }))
    }
  }, [isAuthenticated, user])

  // 检查使用权限
  const checkPermission = useCallback(async (): Promise<AIUsagePermission> => {
    if (!isAuthenticated || !user) {
      const result = {
        canUse: false,
        reason: '用户未登录',
        dailyRemaining: 0,
        monthlyRemaining: 0
      }
      setPermission(result)
      return result
    }

    try {
      const permissionResult = await checkAIUsagePermission(user.id, user.userType)
      setPermission(permissionResult)
      return permissionResult
    } catch (error) {
      console.error('检查AI使用权限失败:', error)
      const result = {
        canUse: false,
        reason: '检查权限时发生错误',
        dailyRemaining: 0,
        monthlyRemaining: 0
      }
      setPermission(result)
      return result
    }
  }, [isAuthenticated, user])

  // 获取用户等级限制信息
  const getLimits = useCallback(() => {
    if (!user) return AI_USAGE_LIMITS.normal
    return AI_USAGE_LIMITS[user.userType]
  }, [user])

  // 获取使用进度百分比
  const getUsageProgress = useCallback(() => {
    const limits = getLimits()
    
    return {
      daily: limits.daily === -1 ? 0 : (stats.dailyUsed / limits.daily) * 100,
      monthly: limits.monthly === -1 ? 0 : (stats.monthlyUsed / limits.monthly) * 100
    }
  }, [stats, getLimits])

  // 获取等级升级建议
  const getUpgradeRecommendation = useCallback(() => {
    if (!user || user.userType === 'admin') return null

    const currentLimits = AI_USAGE_LIMITS[user.userType]
    const nextLevel = user.userType === 'normal' ? 'premium' : 'admin'
    const nextLimits = AI_USAGE_LIMITS[nextLevel]

    if (stats.dailyUsed >= currentLimits.daily * 0.8 || stats.monthlyUsed >= currentLimits.monthly * 0.8) {
      return {
        currentLevel: user.userType,
        recommendedLevel: nextLevel,
        currentLimits,
        nextLimits,
        benefits: [
          `每日使用次数从 ${currentLimits.daily} 次提升到 ${nextLimits.daily === -1 ? '无限制' : nextLimits.daily + ' 次'}`,
          `每月使用次数从 ${currentLimits.monthly} 次提升到 ${nextLimits.monthly === -1 ? '无限制' : nextLimits.monthly + ' 次'}`
        ]
      }
    }

    return null
  }, [user, stats])

  // 格式化剩余次数显示
  const formatRemaining = useCallback((remaining: number) => {
    if (remaining === -1) return '无限制'
    return `${remaining} 次`
  }, [])

  // 初始化时获取数据
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStats()
      checkPermission()
    }
  }, [isAuthenticated, user, fetchStats, checkPermission])

  return {
    // 统计数据
    stats,
    permission,
    
    // 方法
    refresh: fetchStats,
    checkPermission,
    getLimits,
    getUsageProgress,
    getUpgradeRecommendation,
    formatRemaining,
    
    // 便捷属性
    canUse: permission.canUse,
    isLoading: stats.isLoading,
    error: stats.error,
    dailyRemaining: stats.dailyRemaining,
    monthlyRemaining: stats.monthlyRemaining,
    
    // 状态检查
    isNearDailyLimit: stats.dailyLimit > 0 && stats.dailyUsed >= stats.dailyLimit * 0.8,
    isNearMonthlyLimit: stats.monthlyLimit > 0 && stats.monthlyUsed >= stats.monthlyLimit * 0.8,
    hasUnlimitedAccess: user?.userType === 'admin'
  }
}

/**
 * AI使用限制显示组件的数据Hook
 */
export function useAIUsageDisplay() {
  const aiUsage = useAIUsage()
  const { user } = useAuthStore()

  const getStatusColor = useCallback(() => {
    if (!aiUsage.canUse) return 'red'
    if (aiUsage.isNearDailyLimit || aiUsage.isNearMonthlyLimit) return 'yellow'
    return 'green'
  }, [aiUsage])

  const getStatusText = useCallback(() => {
    if (!user) return '未登录'
    if (user.userType === 'admin') return '无限制使用'
    if (!aiUsage.canUse) return '已达使用限制'
    if (aiUsage.isNearDailyLimit) return '接近日限制'
    if (aiUsage.isNearMonthlyLimit) return '接近月限制'
    return '正常使用'
  }, [user, aiUsage])

  return {
    ...aiUsage,
    statusColor: getStatusColor(),
    statusText: getStatusText()
  }
}
