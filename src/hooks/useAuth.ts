'use client'

import { useState, useEffect } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

/**
 * Firebase Auth状态管理Hook
 * 提供用户状态、加载状态和初始化状态
 * 针对模拟器环境进行了优化
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 在开发环境中添加延迟，确保模拟器连接完成
    const initAuth = () => {
      console.log('🔥 useAuth: 开始初始化认证状态监听')

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔥 useAuth: 认证状态变化', user ? `用户: ${user.uid}` : '未登录')
        setUser(user)
        setLoading(false)
        setInitialized(true)
      })

      return unsubscribe
    }

    // 在开发环境中延迟初始化，确保模拟器连接完成
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      const timer = setTimeout(() => {
        const unsubscribe = initAuth()
        return () => unsubscribe()
      }, 100)

      return () => clearTimeout(timer)
    } else {
      const unsubscribe = initAuth()
      return () => unsubscribe()
    }
  }, [])

  return {
    user,
    loading,
    initialized
  }
}

/**
 * 简化版Hook，只返回是否已初始化
 * 针对模拟器环境进行了优化
 */
export function useAuthInitialized(): boolean {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initAuthCheck = () => {
      // 检查当前用户状态（包括null和undefined）
      if (auth.currentUser !== undefined) {
        console.log('🔥 useAuthInitialized: Auth状态已确定', auth.currentUser ? `用户: ${auth.currentUser.uid}` : '未登录')
        setInitialized(true)
        return
      }

      console.log('🔥 useAuthInitialized: 等待Auth状态确定...')
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔥 useAuthInitialized: 认证状态初始化完成', user ? `用户: ${user.uid}` : '未登录')
        setInitialized(true)
        unsubscribe()
      })

      return () => unsubscribe()
    }

    // 在开发环境中延迟初始化，确保模拟器连接完成
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      const timer = setTimeout(() => {
        const cleanup = initAuthCheck()
        return cleanup
      }, 100)

      return () => clearTimeout(timer)
    } else {
      const cleanup = initAuthCheck()
      return cleanup
    }
  }, [])

  return initialized
}
