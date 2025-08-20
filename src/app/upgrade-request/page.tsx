'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useAuthStore } from "@/stores/auth-store"
import { apiClient } from "@/lib/api"
import { auth } from "@/lib/firebase"
import { 
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface UpgradeRequestStatus {
  latestRequest: any
  canApply: boolean
}

export default function UpgradeRequestPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<UpgradeRequestStatus | null>(null)

  // 获取申请状态
  const loadStatus = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await apiClient.get('/upgrade-requests/my-status', undefined, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.success) {
        setStatus(response.data)
      }
    } catch (err) {
      console.error('获取申请状态失败:', err)
    }
  }

  useEffect(() => {
    if (user) {
      loadStatus()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError('请填写升级理由')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        throw new Error('无法获取认证token')
      }

      const response = await apiClient.post('/upgrade-requests', 
        { reason: reason.trim() },
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.success) {
        setMessage('升级申请已提交，请等待管理员审核。')
        setReason('')
        loadStatus() // 刷新状态
      } else {
        throw new Error(response.error || '提交申请失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交申请失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (requestStatus: string) => {
    switch (requestStatus) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (requestStatus: string) => {
    switch (requestStatus) {
      case 'pending':
        return '审核中'
      case 'approved':
        return '已批准'
      case 'rejected':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  const getStatusColor = (requestStatus: string) => {
    switch (requestStatus) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // 如果用户已经是高级用户或管理员
  if (user?.userType === 'premium') {
    return (
      <PermissionGuard requireAuth>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <StarIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">您已经是高级用户</h2>
                <p className="text-muted-foreground">
                  您已经拥有高级用户权限，可以享受所有高级功能。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  if (user?.userType === 'admin') {
    return (
      <PermissionGuard requireAuth>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <StarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">您是系统管理员</h2>
                <p className="text-muted-foreground">
                  您拥有最高权限，可以管理所有用户和系统功能。
                </p>
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
                <StarIcon className="h-6 w-6" />
                申请升级为高级用户
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 高级用户权益说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">高级用户权益</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 无限制创建冲刺项目</li>
                  <li>• 高级数据分析功能</li>
                  <li>• 优先技术支持</li>
                  <li>• 更多自定义选项</li>
                </ul>
              </div>

              {/* 当前申请状态 */}
              {status?.latestRequest && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">申请状态</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(status.latestRequest.status)}
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(status.latestRequest.status)}`}>
                      {getStatusText(status.latestRequest.status)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>申请时间：</strong>{new Date(status.latestRequest.createdAt.seconds * 1000).toLocaleString('zh-CN')}</p>
                    <p><strong>申请理由：</strong>{status.latestRequest.reason}</p>
                    {status.latestRequest.reviewerComment && (
                      <p><strong>审核意见：</strong>{status.latestRequest.reviewerComment}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 申请表单 */}
              {status?.canApply && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      升级理由 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="请详细说明您需要升级为高级用户的理由..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-[100px] resize-none"
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={loading || !reason.trim()}
                    className="w-full"
                  >
                    {loading ? '提交中...' : '提交申请'}
                  </Button>
                </form>
              )}

              {/* 提示信息 */}
              {!status?.canApply && status?.latestRequest?.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">申请审核中</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        您的升级申请正在审核中，请耐心等待管理员处理。
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
