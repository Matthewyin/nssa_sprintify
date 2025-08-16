'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { useAuthStore, useSettingsStore } from "@/stores"
import { isValidEmail } from "@/lib/validations"
import { 
  UserIcon, 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon,
  CalendarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateUser, logout } = useAuthStore()
  const { settings } = useSettingsStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email
      })
    }
  }, [isAuthenticated, user, router])

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await updateUser({
        displayName: formData.displayName,
        email: formData.email
      })
      setIsEditing(false)
    } catch (error) {
      console.error('更新用户信息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email
      })
    }
    setIsEditing(false)
  }

  const getUserTypeInfo = (userType: string) => {
    const typeInfo = {
      normal: { name: '普通用户', color: 'secondary', features: ['基础功能', '每日5次AI交流'] },
      premium: { name: '高级用户', color: 'warning', features: ['所有功能', '每日10次AI交流', '高级统计'] },
      admin: { name: '管理员', color: 'error', features: ['所有功能', '无限AI交流', '系统管理'] }
    }
    return typeInfo[userType as keyof typeof typeInfo] || typeInfo.normal
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  const userTypeInfo = getUserTypeInfo(user.userType)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">个人资料</h1>
            <p className="text-muted-foreground mt-1">
              管理您的账户信息和设置
            </p>
          </div>
          <Button onClick={() => router.push('/')} variant="outline">
            返回首页
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：用户信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-primary" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      显示名称
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="请输入显示名称"
                      />
                    ) : (
                      <p className="text-foreground">{user.displayName || '未设置'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      邮箱地址
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="请输入邮箱地址"
                      />
                    ) : (
                      <p className="text-foreground">{user.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      用户等级
                    </label>
                    <Badge variant={userTypeInfo.color as any}>
                      {userTypeInfo.name}
                    </Badge>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      注册时间
                    </label>
                    <p className="text-muted-foreground">
                      {user.createdAt.toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? '保存中...' : '保存'}
                      </Button>
                      <Button 
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1"
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1"
                    >
                      编辑资料
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 账户安全 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5" />
                  账户安全
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">密码</p>
                    <p className="text-sm text-muted-foreground">上次更新：{user.updatedAt.toLocaleDateString('zh-CN')}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    修改密码
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">邮箱验证</p>
                    <p className="text-sm text-muted-foreground">验证您的邮箱以提高账户安全性</p>
                  </div>
                  <Badge variant="success">已验证</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">两步验证</p>
                    <p className="text-sm text-muted-foreground">为您的账户添加额外的安全保护</p>
                  </div>
                  <Button variant="outline" size="sm">
                    启用
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：快捷操作和统计 */}
          <div className="space-y-6">
            {/* 用户等级详情 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5" />
                  用户等级
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <Badge variant={userTypeInfo.color as any} className="text-lg px-4 py-2">
                    {userTypeInfo.name}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">权益包括：</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {userTypeInfo.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                {user.userType === 'normal' && (
                  <Button className="w-full mt-4" size="sm">
                    升级到高级版
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/settings')}
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  应用设置
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/settings/notifications')}
                >
                  <BellIcon className="h-4 w-4 mr-2" />
                  通知设置
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/stats')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  数据统计
                </Button>
              </CardContent>
            </Card>

            {/* 危险操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-error">危险操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full text-error border-error hover:bg-error hover:text-white"
                  onClick={logout}
                >
                  退出登录
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-error border-error hover:bg-error hover:text-white"
                  onClick={() => {
                    if (confirm('确定要删除账户吗？此操作不可恢复！')) {
                      // TODO: 实现删除账户功能
                      alert('删除账户功能即将推出')
                    }
                  }}
                >
                  删除账户
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
