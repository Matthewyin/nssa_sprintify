/**
 * 用户认证状态监听器
 * 用于监听用户登录/登出状态变化，并清理相关数据
 */

import { useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useSprintStore } from '@/stores/sprint-store'

/**
 * 监听用户认证状态变化的Hook
 */
export function useAuthListener() {
  const clearAllData = useSprintStore(state => state.clearAllData)

  useEffect(() => {
    let previousUserId: string | null = null

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      const currentUserId = user?.uid || null

      // 如果用户发生变化（包括登出），清理所有数据
      if (previousUserId !== currentUserId) {
        console.log('User changed, clearing all data:', {
          previous: previousUserId,
          current: currentUserId
        })
        
        // 清理冲刺相关数据
        clearAllData()
        
        // 更新当前用户ID
        previousUserId = currentUserId
      }
    })

    return () => unsubscribe()
  }, [clearAllData])
}

/**
 * 获取当前用户ID的Hook
 */
export function useCurrentUserId(): string | null {
  const user = auth.currentUser
  return user?.uid || null
}
