import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginForm, RegisterForm } from '@/types'

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
          // TODO: 实现Firebase Auth登录
          // const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
          // const user = userCredential.user
          
          // 临时模拟登录
          const mockUser: User = {
            id: 'mock-user-id',
            email: credentials.email,
            displayName: credentials.email.split('@')[0],
            userType: 'normal',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set({ 
            user: mockUser, 
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
          
          // TODO: 实现Firebase Auth注册
          // const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
          // const user = userCredential.user
          
          // 临时模拟注册
          const mockUser: User = {
            id: 'mock-user-id',
            email: userData.email,
            displayName: userData.email.split('@')[0],
            userType: 'normal',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set({ 
            user: mockUser, 
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
      logout: () => {
        // TODO: 实现Firebase Auth登出
        // await signOut(auth)
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
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
      updateUser: (updates: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ 
            user: { 
              ...user, 
              ...updates, 
              updatedAt: new Date() 
            } 
          })
        }
      },

      // 初始化认证状态
      initialize: async () => {
        set({ isLoading: true })
        
        try {
          // TODO: 实现Firebase Auth状态监听
          // onAuthStateChanged(auth, (user) => {
          //   if (user) {
          //     // 用户已登录，获取用户信息
          //   } else {
          //     // 用户未登录
          //     set({ user: null, isAuthenticated: false, isLoading: false })
          //   }
          // })
          
          // 临时处理
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '初始化失败', 
            isLoading: false 
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
