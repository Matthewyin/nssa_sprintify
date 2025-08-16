import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSettings, NotificationSettings, UserPreferences, ObsidianSettings } from '@/types'

interface SettingsState {
  // 状态
  settings: UserSettings | null
  isLoading: boolean
  error: string | null

  // 操作
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  updateObsidianSettings: (settings: Partial<ObsidianSettings>) => Promise<void>
  
  // 主题相关
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // 语言相关
  language: 'zh-CN' | 'en-US'
  setLanguage: (language: 'zh-CN' | 'en-US') => void
  
  // 通知权限
  notificationPermission: NotificationPermission
  requestNotificationPermission: () => Promise<void>
  
  // 工具方法
  clearError: () => void
  resetSettings: () => void
  
  // 初始化
  loadSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 初始状态
      settings: null,
      isLoading: false,
      error: null,
      theme: 'system',
      language: 'zh-CN',
      notificationPermission: 'default',

      // 更新通知设置
      updateNotificationSettings: async (newSettings: Partial<NotificationSettings>) => {
        set({ isLoading: true, error: null })
        
        try {
          const { settings } = get()
          if (settings) {
            const updatedSettings: UserSettings = {
              ...settings,
              notifications: {
                ...settings.notifications,
                ...newSettings
              },
              updatedAt: new Date()
            }
            
            // TODO: 保存到Firebase
            // await updateUserSettings(updatedSettings)
            
            set({ 
              settings: updatedSettings, 
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新通知设置失败', 
            isLoading: false 
          })
        }
      },

      // 更新用户偏好
      updateUserPreferences: async (newPreferences: Partial<UserPreferences>) => {
        set({ isLoading: true, error: null })
        
        try {
          const { settings } = get()
          if (settings) {
            const updatedSettings: UserSettings = {
              ...settings,
              preferences: {
                ...settings.preferences,
                ...newPreferences
              },
              updatedAt: new Date()
            }
            
            // 同步更新本地状态
            if (newPreferences.theme) {
              set({ theme: newPreferences.theme })
            }
            if (newPreferences.language) {
              set({ language: newPreferences.language })
            }
            
            // TODO: 保存到Firebase
            // await updateUserSettings(updatedSettings)
            
            set({ 
              settings: updatedSettings, 
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新用户偏好失败', 
            isLoading: false 
          })
        }
      },

      // 更新Obsidian设置
      updateObsidianSettings: async (newSettings: Partial<ObsidianSettings>) => {
        set({ isLoading: true, error: null })
        
        try {
          const { settings } = get()
          if (settings) {
            const updatedSettings: UserSettings = {
              ...settings,
              obsidian: {
                enabled: false,
                syncEnabled: false,
                autoSync: false,
                ...settings.obsidian,
                ...newSettings
              },
              updatedAt: new Date()
            }
            
            // TODO: 保存到Firebase
            // await updateUserSettings(updatedSettings)
            
            set({ 
              settings: updatedSettings, 
              isLoading: false 
            })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新Obsidian设置失败', 
            isLoading: false 
          })
        }
      },

      // 设置主题
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme })
        
        // 应用主题到DOM
        const root = document.documentElement
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          root.classList.toggle('dark', systemTheme === 'dark')
        } else {
          root.classList.toggle('dark', theme === 'dark')
        }
        
        // 同步更新设置
        get().updateUserPreferences({ theme })
      },

      // 设置语言
      setLanguage: (language: 'zh-CN' | 'en-US') => {
        set({ language })
        
        // TODO: 更新i18n配置
        
        // 同步更新设置
        get().updateUserPreferences({ language })
      },

      // 请求通知权限
      requestNotificationPermission: async () => {
        try {
          if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            set({ notificationPermission: permission })
            
            if (permission === 'granted') {
              // 启用推送通知设置
              await get().updateNotificationSettings({ push: true })
            }
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '请求通知权限失败' 
          })
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 重置设置
      resetSettings: () => {
        const defaultSettings: UserSettings = {
          userId: 'current-user-id', // TODO: 从auth store获取
          notifications: {
            email: true,
            push: false,
            dailyReminder: true,
            deadlineReminder: true,
            milestoneReminder: true,
            reminderTime: '09:00'
          },
          preferences: {
            theme: 'system',
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h'
          },
          obsidian: {
            enabled: false,
            syncEnabled: false,
            autoSync: false
          },
          updatedAt: new Date()
        }
        
        set({ 
          settings: defaultSettings,
          theme: defaultSettings.preferences.theme,
          language: defaultSettings.preferences.language
        })
      },

      // 加载设置
      loadSettings: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: 从Firebase加载设置
          // const settings = await loadUserSettings()
          
          // 临时使用默认设置
          const { resetSettings } = get()
          resetSettings()
          
          // 检查通知权限
          if ('Notification' in window) {
            set({ notificationPermission: Notification.permission })
          }
          
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '加载设置失败', 
            isLoading: false 
          })
        }
      }
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        theme: state.theme,
        language: state.language
      }),
    }
  )
)

// 监听系统主题变化
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    const { theme, setTheme } = useSettingsStore.getState()
    if (theme === 'system') {
      setTheme('system') // 重新应用系统主题
    }
  })
}
