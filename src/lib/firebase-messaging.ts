// Firebase Cloud Messaging (FCM) 推送服务

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging'
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// FCM配置
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

/**
 * 初始化FCM并获取推送token
 */
export async function initializeFCM(userId: string): Promise<string | null> {
  try {
    // 检查浏览器是否支持通知
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持通知功能')
      return null
    }

    // 检查Service Worker是否可用
    if (!('serviceWorker' in navigator)) {
      console.warn('此浏览器不支持Service Worker')
      return null
    }

    // 请求通知权限
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('用户拒绝了通知权限')
      return null
    }

    // 获取FCM实例
    const messaging = getMessaging()
    
    // 获取推送token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    })

    if (token) {
      console.log('FCM token获取成功:', token)
      
      // 保存token到Firestore
      await saveFCMToken(userId, token)
      
      // 设置前台消息监听
      setupForegroundMessageListener(messaging)
      
      return token
    } else {
      console.warn('无法获取FCM token')
      return null
    }
  } catch (error) {
    console.error('FCM初始化失败:', error)
    return null
  }
}

/**
 * 保存FCM token到Firestore
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    // 更新用户文档，添加FCM token
    await updateDoc(userRef, {
      fcmTokens: arrayUnion({
        token,
        platform: 'web',
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp()
      }),
      updatedAt: serverTimestamp()
    })

    console.log('FCM token已保存到Firestore')
  } catch (error) {
    console.error('保存FCM token失败:', error)
    throw error
  }
}

/**
 * 设置前台消息监听
 */
function setupForegroundMessageListener(messaging: any): void {
  onMessage(messaging, (payload: MessagePayload) => {
    console.log('收到前台消息:', payload)
    
    // 显示自定义通知
    showCustomNotification(payload)
  })
}

/**
 * 显示自定义通知
 */
function showCustomNotification(payload: MessagePayload): void {
  const { notification, data } = payload
  
  if (!notification) return

  const notificationTitle = notification.title || '冲刺管理提醒'
  const notificationOptions = {
    body: notification.body,
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    image: notification.image,
    data: data,
    tag: data?.type || 'general',
    requireInteraction: data?.requireInteraction === 'true',
    actions: [
      {
        action: 'view',
        title: '查看详情'
      },
      {
        action: 'dismiss',
        title: '忽略'
      }
    ]
  }

  // 显示通知
  if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(notificationTitle, notificationOptions)
    })
  } else {
    // 降级到浏览器原生通知
    new Notification(notificationTitle, notificationOptions)
  }
}

/**
 * 发送测试通知
 */
export async function sendTestNotification(userId: string): Promise<boolean> {
  try {
    // 调用Cloud Function发送测试通知
    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        title: '测试通知',
        body: '这是一条测试推送通知',
        data: {
          type: 'test',
          timestamp: Date.now().toString()
        }
      })
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('发送测试通知失败:', error)
    return false
  }
}

/**
 * 订阅通知主题
 */
export async function subscribeToTopic(userId: string, topic: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        topic
      })
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('订阅通知主题失败:', error)
    return false
  }
}

/**
 * 取消订阅通知主题
 */
export async function unsubscribeFromTopic(userId: string, topic: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        topic
      })
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('取消订阅通知主题失败:', error)
    return false
  }
}

/**
 * 更新通知设置
 */
export async function updateNotificationSettings(
  userId: string, 
  settings: {
    dailyReminder?: boolean
    deadlineReminder?: boolean
    milestoneReminder?: boolean
    reminderTime?: string
  }
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        userId,
        settings
      })
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('更新通知设置失败:', error)
    return false
  }
}

/**
 * 获取认证token
 */
async function getAuthToken(): Promise<string> {
  // 这里应该从认证store或localStorage获取token
  // 临时返回空字符串
  return ''
}

/**
 * 通知类型定义
 */
export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: 'daily_reminder',
  DEADLINE_WARNING: 'deadline_warning',
  MILESTONE_ACHIEVED: 'milestone_achieved',
  SPRINT_COMPLETED: 'sprint_completed',
  TASK_OVERDUE: 'task_overdue',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
} as const

/**
 * 通知主题定义
 */
export const NOTIFICATION_TOPICS = {
  DAILY_REMINDERS: 'daily_reminders',
  DEADLINE_ALERTS: 'deadline_alerts',
  MILESTONE_UPDATES: 'milestone_updates',
  ACHIEVEMENT_NOTIFICATIONS: 'achievement_notifications'
} as const
