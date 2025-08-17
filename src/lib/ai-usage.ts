import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserType } from '@/types'

// AI使用限制配置
export const AI_USAGE_LIMITS = {
  normal: {
    daily: 3,
    monthly: 30
  },
  premium: {
    daily: 10,
    monthly: 100
  },
  admin: {
    daily: -1, // 无限制
    monthly: -1 // 无限制
  }
} as const

// AI使用记录接口
export interface AIUsageRecord {
  userId: string
  dailyUsage: number
  monthlyUsage: number
  lastUsedDate: string
  lastResetDate: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 获取用户AI使用记录
 */
export async function getUserAIUsage(userId: string): Promise<AIUsageRecord | null> {
  try {
    const usageDoc = await getDoc(doc(db, 'ai_usage', userId))
    
    if (!usageDoc.exists()) {
      return null
    }

    const data = usageDoc.data()
    return {
      userId,
      dailyUsage: data.dailyUsage || 0,
      monthlyUsage: data.monthlyUsage || 0,
      lastUsedDate: data.lastUsedDate || '',
      lastResetDate: data.lastResetDate || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    }
  } catch (error) {
    console.error('获取AI使用记录失败:', error)
    return null
  }
}

/**
 * 初始化用户AI使用记录
 */
export async function initializeAIUsage(userId: string): Promise<AIUsageRecord> {
  const today = new Date().toISOString().split('T')[0]
  
  const initialRecord: Omit<AIUsageRecord, 'createdAt' | 'updatedAt'> = {
    userId,
    dailyUsage: 0,
    monthlyUsage: 0,
    lastUsedDate: today,
    lastResetDate: today
  }

  try {
    await setDoc(doc(db, 'ai_usage', userId), {
      ...initialRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      ...initialRecord,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('初始化AI使用记录失败:', error)
    throw new Error('初始化AI使用记录失败')
  }
}

/**
 * 检查用户是否可以使用AI功能
 */
export async function checkAIUsagePermission(
  userId: string, 
  userType: UserType
): Promise<{
  canUse: boolean
  reason?: string
  dailyRemaining: number
  monthlyRemaining: number
}> {
  try {
    // 获取用户限制
    const limits = AI_USAGE_LIMITS[userType]
    
    // 管理员无限制
    if (limits.daily === -1) {
      return {
        canUse: true,
        dailyRemaining: -1,
        monthlyRemaining: -1
      }
    }

    // 获取使用记录
    let usage = await getUserAIUsage(userId)
    
    // 如果没有记录，创建新记录
    if (!usage) {
      usage = await initializeAIUsage(userId)
    }

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM

    // 检查是否需要重置日使用量
    if (usage.lastUsedDate !== today) {
      await updateDoc(doc(db, 'ai_usage', userId), {
        dailyUsage: 0,
        lastUsedDate: today,
        updatedAt: serverTimestamp()
      })
      usage.dailyUsage = 0
    }

    // 检查是否需要重置月使用量
    const lastResetMonth = usage.lastResetDate.substring(0, 7)
    if (lastResetMonth !== currentMonth) {
      await updateDoc(doc(db, 'ai_usage', userId), {
        monthlyUsage: 0,
        lastResetDate: today,
        updatedAt: serverTimestamp()
      })
      usage.monthlyUsage = 0
    }

    // 检查日限制
    if (usage.dailyUsage >= limits.daily) {
      return {
        canUse: false,
        reason: `今日AI使用次数已达上限（${limits.daily}次），请明天再试`,
        dailyRemaining: 0,
        monthlyRemaining: Math.max(0, limits.monthly - usage.monthlyUsage)
      }
    }

    // 检查月限制
    if (usage.monthlyUsage >= limits.monthly) {
      return {
        canUse: false,
        reason: `本月AI使用次数已达上限（${limits.monthly}次），请下月再试`,
        dailyRemaining: Math.max(0, limits.daily - usage.dailyUsage),
        monthlyRemaining: 0
      }
    }

    return {
      canUse: true,
      dailyRemaining: limits.daily - usage.dailyUsage,
      monthlyRemaining: limits.monthly - usage.monthlyUsage
    }
  } catch (error) {
    console.error('检查AI使用权限失败:', error)
    return {
      canUse: false,
      reason: '检查使用权限时发生错误',
      dailyRemaining: 0,
      monthlyRemaining: 0
    }
  }
}

/**
 * 记录AI使用
 */
export async function recordAIUsage(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    await updateDoc(doc(db, 'ai_usage', userId), {
      dailyUsage: increment(1),
      monthlyUsage: increment(1),
      lastUsedDate: today,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('记录AI使用失败:', error)
    throw new Error('记录AI使用失败')
  }
}

/**
 * 获取用户AI使用统计
 */
export async function getAIUsageStats(userId: string, userType: UserType): Promise<{
  dailyUsed: number
  dailyLimit: number
  monthlyUsed: number
  monthlyLimit: number
  canUse: boolean
}> {
  const limits = AI_USAGE_LIMITS[userType]
  const usage = await getUserAIUsage(userId)
  
  if (!usage) {
    return {
      dailyUsed: 0,
      dailyLimit: limits.daily,
      monthlyUsed: 0,
      monthlyLimit: limits.monthly,
      canUse: true
    }
  }

  const permission = await checkAIUsagePermission(userId, userType)
  
  return {
    dailyUsed: usage.dailyUsage,
    dailyLimit: limits.daily,
    monthlyUsed: usage.monthlyUsage,
    monthlyLimit: limits.monthly,
    canUse: permission.canUse
  }
}
