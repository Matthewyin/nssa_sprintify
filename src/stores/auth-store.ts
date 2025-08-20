import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginForm, RegisterForm } from '@/types'
import {
  loginUser,
  registerUser,
  logoutUser,
  onAuthStateChange,
  getCurrentUser,
  getUserData,
  updateUserProfile
} from '@/lib/firebase-auth'

interface AuthState {
  // 状态
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // 操作
  login: (credentials: LoginForm) => Promise<void>
  register: (userData: RegisterForm) => Promise<void>
  logout: () => void
  clearError: () => void
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  
  // 初始化
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // 登录
      login: async (credentials: LoginForm) => {
        set({ isLoading: true, error: null })

        try {
          const { user } = await loginUser(credentials.email, credentials.password)

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录失败',
            isLoading: false
          })
        }
      },

      // 注册
      register: async (userData: RegisterForm) => {
        set({ isLoading: true, error: null })

        try {
          // 验证密码确认
          if (userData.password !== userData.confirmPassword) {
            throw new Error('密码确认不匹配')
          }

          const { user } = await registerUser(
            userData.email,
            userData.password,
            userData.email.split('@')[0]
          )

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '注册失败',
            isLoading: false
          })
        }
      },

      // 登出
      logout: async () => {
        try {
          await logoutUser()
          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登出失败'
          })
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 设置用户
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      // 更新用户信息
      updateUser: async (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          try {
            await updateUserProfile(user.id, updates)
            set({
              user: {
                ...user,
                ...updates,
                updatedAt: new Date()
              }
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : '更新用户信息失败'
            })
          }
        }
      },

      // 初始化认证状态
      initialize: async () => {
        set({ isLoading: true })

        try {
          // 设置认证状态监听
          onAuthStateChange(async (firebaseUser) => {
            if (firebaseUser) {
              try {
                // 获取用户数据
                const userData = await getUserData(firebaseUser.uid)
                if (userData) {
                  set({
                    user: userData,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                  })
                } else {
                  // 用户数据不存在，可能需要重新创建
                  set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: '用户数据不存在'
                  })
                }
              } catch (error) {
                console.error('获取用户数据失败:', error)
                // 如果获取用户数据失败，仍然保持登录状态但显示错误
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: '获取用户数据失败'
                })
              }
            } else {
              // 用户未登录
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              })
            }
          })

          // 初始化完成，如果没有用户则停止加载
          const currentUser = getCurrentUser()
          if (!currentUser) {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('认证初始化失败:', error)
          set({
            error: error instanceof Error ? error.message : '初始化失败',
            isLoading: false,
            user: null,
            isAuthenticated: false
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
