'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { useAuthStore, useSettingsStore } from '@/stores'
import { 
  initializeFCM, 
  sendTestNotification, 
  subscribeToTopic, 
  unsubscribeFromTopic,
  NOTIFICATION_TOPICS 
} from '@/lib/firebase-messaging'
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function NotificationManager() {
  const { user, isAuthenticated } = useAuthStore()
  const { settings, updateNotificationSettings } = useSettingsStore()
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // 检查通知权限状态
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const handleInitializeFCM = async () => {
    if (!user) return

    setIsInitializing(true)
    try {
      const token = await initializeFCM(user.id)
      setFcmToken(token)
      
      if (token) {
        // 自动订阅默认主题
        await subscribeToTopic(user.id, NOTIFICATION_TOPICS.DAILY_REMINDERS)
        setSubscribedTopics([NOTIFICATION_TOPICS.DAILY_REMINDERS])
      }
    } catch (error) {
      console.error('初始化FCM失败:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSendTestNotification = async () => {
    if (!user) return

    try {
      const success = await sendTestNotification(user.id)
      if (success) {
        alert('测试通知发送成功！')
      } else {
        alert('测试通知发送失败')
      }
    } catch (error) {
      console.error('发送测试通知失败:', error)
      alert('发送测试通知失败')
    }
  }

  const handleTopicSubscription = async (topic: string, subscribe: boolean) => {
    if (!user) return

    try {
      if (subscribe) {
        const success = await subscribeToTopic(user.id, topic)
        if (success) {
          setSubscribedTopics(prev => [...prev, topic])
        }
      } else {
        const success = await unsubscribeFromTopic(user.id, topic)
        if (success) {
          setSubscribedTopics(prev => prev.filter(t => t !== topic))
        }
      }
    } catch (error) {
      console.error('主题订阅操作失败:', error)
    }
  }

  const handleNotificationSettingChange = async (key: string, value: boolean | string) => {
    if (!settings) return

    const newSettings = {
      ...settings.notifications,
      [key]: value
    }

    await updateNotificationSettings(newSettings)
  }

  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">请先登录以管理通知设置</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 通知权限状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            通知权限状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>浏览器通知权限:</span>
            <Badge variant={
              notificationPermission === 'granted' ? 'success' :
              notificationPermission === 'denied' ? 'error' : 'warning'
            }>
              {notificationPermission === 'granted' ? '已授权' :
               notificationPermission === 'denied' ? '已拒绝' : '未设置'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>FCM推送状态:</span>
            <Badge variant={fcmToken ? 'success' : 'secondary'}>
              {fcmToken ? '已连接' : '未连接'}
            </Badge>
          </div>

          {!fcmToken && (
            <Button 
              onClick={handleInitializeFCM}
              disabled={isInitializing}
              className="w-full"
            >
              {isInitializing ? '初始化中...' : '启用推送通知'}
            </Button>
          )}

          {fcmToken && (
            <div className="space-y-2">
              <Button 
                onClick={handleSendTestNotification}
                variant="outline"
                className="w-full"
              >
                发送测试通知
              </Button>
              <p className="text-xs text-muted-foreground">
                FCM Token: {fcmToken.substring(0, 20)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle>通知设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">每日提醒</p>
                <p className="text-sm text-muted-foreground">每天提醒您查看冲刺进度</p>
              </div>
              <Button
                variant={settings?.notifications.dailyReminder ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleNotificationSettingChange('dailyReminder', !settings?.notifications.dailyReminder)}
              >
                {settings?.notifications.dailyReminder ? '已启用' : '已禁用'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">截止日期提醒</p>
                <p className="text-sm text-muted-foreground">任务即将到期时提醒</p>
              </div>
              <Button
                variant={settings?.notifications.deadlineReminder ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleNotificationSettingChange('deadlineReminder', !settings?.notifications.deadlineReminder)}
              >
                {settings?.notifications.deadlineReminder ? '已启用' : '已禁用'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">里程碑提醒</p>
                <p className="text-sm text-muted-foreground">达成里程碑时通知</p>
              </div>
              <Button
                variant={settings?.notifications.milestoneReminder ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleNotificationSettingChange('milestoneReminder', !settings?.notifications.milestoneReminder)}
              >
                {settings?.notifications.milestoneReminder ? '已启用' : '已禁用'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">邮件通知</p>
                <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
              </div>
              <Button
                variant={settings?.notifications.email ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleNotificationSettingChange('email', !settings?.notifications.email)}
              >
                {settings?.notifications.email ? '已启用' : '已禁用'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-2">
              提醒时间
            </label>
            <input
              type="time"
              value={settings?.notifications.reminderTime || '09:00'}
              onChange={(e) => handleNotificationSettingChange('reminderTime', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* 主题订阅 */}
      <Card>
        <CardHeader>
          <CardTitle>通知主题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(NOTIFICATION_TOPICS).map(([key, topic]) => {
            const isSubscribed = subscribedTopics.includes(topic)
            const topicNames = {
              DAILY_REMINDERS: '每日提醒',
              DEADLINE_ALERTS: '截止日期警告',
              MILESTONE_UPDATES: '里程碑更新',
              ACHIEVEMENT_NOTIFICATIONS: '成就通知'
            }
            
            return (
              <div key={topic} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{topicNames[key as keyof typeof topicNames]}</p>
                  <p className="text-sm text-muted-foreground">{topic}</p>
                </div>
                <Button
                  variant={isSubscribed ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTopicSubscription(topic, !isSubscribed)}
                  disabled={!fcmToken}
                >
                  {isSubscribed ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      已订阅
                    </>
                  ) : (
                    <>
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      未订阅
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
