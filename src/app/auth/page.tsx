'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { useAuthStore } from "@/stores"
import { isValidEmail, isValidPassword } from "@/lib/validations"
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})

  const { login, register, isLoading, error, user, isAuthenticated, logout, clearError } = useAuthStore()

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  // 清除错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const validateForm = () => {
    const errors: Record<string, string[]> = {}

    // 验证邮箱
    if (!formData.email) {
      errors.email = ['邮箱地址不能为空']
    } else if (!isValidEmail(formData.email)) {
      errors.email = ['请输入有效的邮箱地址']
    }

    // 验证密码
    if (!formData.password) {
      errors.password = ['密码不能为空']
    } else if (!isLogin) {
      const passwordValidation = isValidPassword(formData.password)
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors
      }
    }

    // 验证确认密码（仅注册时）
    if (!isLogin) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = ['请确认密码']
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = ['两次输入的密码不一致']
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
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
    } catch (error) {
      console.error('认证失败:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // 清除对应字段的错误信息
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: []
      }))
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    })
    setFormErrors({})
    clearError()
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
                className={formErrors.email?.length ? 'border-error' : ''}
                required
              />
              {formErrors.email?.map((error, index) => (
                <p key={index} className="text-sm text-error">{error}</p>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isLogin ? "请输入密码" : "请输入密码（至少8位，包含大小写字母和数字）"}
                  className={formErrors.password?.length ? 'border-error pr-10' : 'pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.password?.map((error, index) => (
                <p key={index} className="text-sm text-error">{error}</p>
              ))}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入密码"
                    className={formErrors.confirmPassword?.length ? 'border-error pr-10' : 'pr-10'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword?.map((error, index) => (
                  <p key={index} className="text-sm text-error">{error}</p>
                ))}
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
                onClick={toggleAuthMode}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? '没有账户？点击注册' : '已有账户？点击登录'}
              </button>
            </div>

            {/* 忘记密码链接（仅登录时显示） */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: 实现忘记密码功能
                    alert('忘记密码功能即将推出')
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  忘记密码？
                </button>
              </div>
            )}
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
