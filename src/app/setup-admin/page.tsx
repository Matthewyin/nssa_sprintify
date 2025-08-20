'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useAuthStore } from "@/stores/auth-store"
import { apiClient } from "@/lib/api"
import { auth } from "@/lib/firebase"
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function SetupAdminPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)

  // 检查系统是否已有管理员
  const checkAdminExists = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await apiClient.get('/users',
        { userType: 'admin', limit: 1 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.success) {
        setHasAdmin(response.data.users.length > 0)
      }
    } catch (err) {
      console.error('检查管理员失败:', err)
    }
  }

  useEffect(() => {
    if (user) {
      checkAdminExists()
    }
  }, [user])

  const handleSetupAdmin = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      // 获取认证token
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        throw new Error('无法获取认证token')
      }

      // 调用升级API（仅在没有管理员时允许）
      const response = await apiClient.post('/auth/setup-first-admin', 
        {},
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.success) {
        setMessage('恭喜！您已成为系统的第一个管理员。')
        // 重新检查管理员状态
        await checkAdminExists()
      } else {
        throw new Error(response.error || '设置管理员失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置管理员失败')
    } finally {
      setLoading(false)
    }
  }

  // 如果用户已经是管理员
  if (user?.userType === 'admin') {
    return (
      <PermissionGuard requireAuth>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <ShieldCheckIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">您已经是管理员</h2>
                <p className="text-muted-foreground mb-4">
                  您拥有系统管理员权限，可以管理所有用户和系统功能。
                </p>
                <Button 
                  onClick={() => window.location.href = '/admin/users'}
                  variant="outline"
                >
                  前往用户管理
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  // 如果系统已有管理员
  if (hasAdmin === true) {
    return (
      <PermissionGuard requireAuth>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">系统已有管理员</h2>
                <p className="text-muted-foreground mb-4">
                  系统已经设置了管理员，如需升级权限请联系现有管理员或提交升级申请。
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/upgrade-request'}
                    variant="outline"
                  >
                    申请升级
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    variant="default"
                  >
                    返回首页
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="h-6 w-6" />
                设置系统管理员
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800">首次系统设置</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      系统检测到还没有管理员，您可以成为第一个管理员来管理整个系统。
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">当前用户信息</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p><span className="font-medium">邮箱：</span>{user?.email}</p>
                    <p><span className="font-medium">用户类型：</span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                        {user?.userType === 'premium' ? '高级用户' : '普通用户'}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">管理员权限</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    成为管理员后，您将获得以下权限：
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• 管理所有用户账户和权限</li>
                    <li>• 审批用户升级申请</li>
                    <li>• 访问系统管理功能</li>
                    <li>• 查看系统统计和分析</li>
                    <li>• 配置系统设置</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">重要提醒</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        此操作仅在系统首次设置时可用。一旦设置了管理员，其他用户需要通过申请流程获得权限升级。
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSetupAdmin}
                  disabled={loading || hasAdmin !== false}
                  className="w-full"
                >
                  {loading ? '设置中...' : '成为系统管理员'}
                </Button>
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}
