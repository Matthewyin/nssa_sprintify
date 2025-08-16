'use client'

import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { useAuthStore } from "@/stores"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const { login, register, isLoading, error, user, isAuthenticated, logout } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      await login({
        email: formData.email,
        password: formData.password
      })
    } else {
      await register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // 如果已登录，显示用户信息
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">用户信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="font-semibold">{user.displayName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline">{user.userType}</Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">用户ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">注册时间:</span>
                <span>{user.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最后更新:</span>
                <span>{user.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={logout}
                className="flex-1"
              >
                登出
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? '登录' : '注册'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱地址
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? '没有账户？点击注册' : '已有账户？点击登录'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">测试账户信息</p>
              <div className="text-xs space-y-1 bg-muted p-3 rounded-md">
                <p><strong>邮箱:</strong> test@example.com</p>
                <p><strong>密码:</strong> password123</p>
                <p className="text-muted-foreground">
                  注意：需要先配置Firebase才能正常使用
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
