'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui"
import { useAuthStore } from "@/stores/auth-store"
import { validateFirebaseConfig } from "@/lib/firebase"

export default function TestAuthPage() {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    error, 
    login, 
    register, 
    logout, 
    clearError,
    initialize 
  } = useAuthStore()
  
  const [testEmail, setTestEmail] = useState('test@example.com')
  const [testPassword, setTestPassword] = useState('123456')
  const [testDisplayName, setTestDisplayName] = useState('测试用户')
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    // 检查Firebase配置
    const isValid = validateFirebaseConfig()
    setFirebaseStatus(isValid ? 'valid' : 'invalid')
    
    // 初始化认证状态
    initialize()
  }, [initialize])

  const handleRegister = async () => {
    try {
      await register({
        email: testEmail,
        password: testPassword,
        displayName: testDisplayName
      })
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  const handleLogin = async () => {
    try {
      await login({
        email: testEmail,
        password: testPassword
      })
    } catch (error) {
      console.error('登录失败:', error)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getFirebaseConfigInfo = () => {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 20) + '...'
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Firebase Auth 测试页面</h1>
          <p className="text-muted-foreground mt-2">
            测试Firebase认证功能和配置状态
          </p>
        </div>

        {/* Firebase配置状态 */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase 配置状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  firebaseStatus === 'checking' ? 'bg-yellow-500' :
                  firebaseStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">
                  配置状态: {
                    firebaseStatus === 'checking' ? '检查中...' :
                    firebaseStatus === 'valid' ? '有效' : '无效'
                  }
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(getFirebaseConfigInfo()).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 当前用户状态 */}
        <Card>
          <CardHeader>
            <CardTitle>当前用户状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isAuthenticated ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <span className="font-medium">
                  认证状态: {isAuthenticated ? '已登录' : '未登录'}
                </span>
              </div>
              
              {user && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户ID:</span>
                    <span className="font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">邮箱:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">显示名称:</span>
                    <span>{user.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用户类型:</span>
                    <span>{user.userType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建时间:</span>
                    <span>{new Date(user.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 认证操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 注册测试 */}
          <Card>
            <CardHeader>
              <CardTitle>用户注册测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">邮箱</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="输入测试邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">密码</label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="输入测试密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">显示名称</label>
                <Input
                  value={testDisplayName}
                  onChange={(e) => setTestDisplayName(e.target.value)}
                  placeholder="输入显示名称"
                />
              </div>
              <Button 
                onClick={handleRegister} 
                disabled={isLoading || isAuthenticated}
                className="w-full"
              >
                {isLoading ? '注册中...' : '测试注册'}
              </Button>
            </CardContent>
          </Card>

          {/* 登录测试 */}
          <Card>
            <CardHeader>
              <CardTitle>用户登录测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">邮箱</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="输入登录邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">密码</label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="输入登录密码"
                />
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={handleLogin} 
                  disabled={isLoading || isAuthenticated}
                  className="w-full"
                >
                  {isLoading ? '登录中...' : '测试登录'}
                </Button>
                {isAuthenticated && (
                  <Button 
                    onClick={handleLogout} 
                    variant="outline"
                    className="w-full"
                  >
                    退出登录
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 错误信息 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-800">认证错误</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
                <Button 
                  onClick={clearError} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-300"
                >
                  清除错误
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快速测试按钮 */}
        <Card>
          <CardHeader>
            <CardTitle>快速测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  setTestEmail('test@example.com')
                  setTestPassword('123456')
                  setTestDisplayName('测试用户')
                }}
                variant="outline"
              >
                填充测试数据
              </Button>
              <Button 
                onClick={() => {
                  setTestEmail('')
                  setTestPassword('')
                  setTestDisplayName('')
                  clearError()
                }}
                variant="outline"
              >
                清空表单
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 说明信息 */}
        <Card>
          <CardHeader>
            <CardTitle>测试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• 首次使用请先注册一个测试账号</p>
              <p>• 注册成功后会自动登录</p>
              <p>• 可以使用相同账号进行登录测试</p>
              <p>• 检查浏览器控制台查看详细错误信息</p>
              <p>• Firebase配置必须有效才能正常使用认证功能</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
