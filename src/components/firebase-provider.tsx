'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores'
import { validateFirebaseConfig, checkFirebaseConnection } from '@/lib/firebase'

interface FirebaseProviderProps {
  children: React.ReactNode
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const { initialize } = useAuthStore()

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // 验证Firebase配置
        if (!validateFirebaseConfig()) {
          console.warn('Firebase配置不完整，使用演示模式')
        }

        // 检查Firebase连接
        const isConnected = await checkFirebaseConnection()
        if (!isConnected) {
          console.warn('Firebase连接失败，某些功能可能不可用')
        }

        // 初始化认证状态
        await initialize()
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Firebase初始化失败:', error)
        setInitError(error instanceof Error ? error.message : 'Firebase初始化失败')
        setIsInitialized(true) // 即使失败也要继续渲染应用
      }
    }

    initializeFirebase()
  }, [initialize])

  // 显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">正在初始化应用...</p>
        </div>
      </div>
    )
  }

  // 显示初始化错误
  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-error text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-foreground">初始化失败</h2>
          <p className="text-muted-foreground">{initError}</p>
          <p className="text-sm text-muted-foreground">
            请检查网络连接和Firebase配置，然后刷新页面重试。
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Firebase状态指示器组件
export function FirebaseStatus() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkFirebaseConnection()
        setConnectionStatus(isConnected ? 'connected' : 'disconnected')
      } catch (error) {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
    
    // 每30秒检查一次连接状态
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (connectionStatus === 'checking') {
    return null
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 bg-error text-white px-3 py-2 rounded-md text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Firebase连接断开
        </div>
      </div>
    )
  }

  return null
}
