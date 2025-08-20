'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { apiClient } from "@/lib/api"
import { auth } from "@/lib/firebase"
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface UpgradeRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  currentUserType: string
  requestedUserType: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: any
  updatedAt: any
  reviewedAt?: any
  reviewedBy?: string
  reviewerComment?: string
}

interface UpgradeRequestData {
  requests: UpgradeRequest[]
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export default function UpgradeRequestsPage() {
  const [data, setData] = useState<UpgradeRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await apiClient.get('/upgrade-requests', 
        { status: filter, limit: 50, offset: 0 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.success) {
        setData(response.data)
      }
    } catch (error) {
      console.error('获取升级申请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [filter])

  const handleReview = async (requestId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      setProcessingId(requestId)
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await apiClient.post(`/upgrade-requests/${requestId}/review`,
        { status, comment },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.success) {
        // 刷新列表
        loadRequests()
      }
    } catch (error) {
      console.error('审批申请失败:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核'
      case 'approved':
        return '已批准'
      case 'rejected':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <PermissionGuard requiredUserType="admin">
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">升级申请管理</h1>
              <p className="text-muted-foreground mt-1">
                审核用户的高级权限申请
              </p>
            </div>
          </div>

          {/* 统计卡片 */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{data.stats.total}</p>
                    <p className="text-sm text-muted-foreground">总申请数</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data.stats.pending}</p>
                    <p className="text-sm text-muted-foreground">待审核</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{data.stats.approved}</p>
                    <p className="text-sm text-muted-foreground">已批准</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{data.stats.rejected}</p>
                    <p className="text-sm text-muted-foreground">已拒绝</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 筛选器 */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {[
                  { key: 'pending', label: '待审核' },
                  { key: 'approved', label: '已批准' },
                  { key: 'rejected', label: '已拒绝' },
                  { key: 'all', label: '全部' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(key as any)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 申请列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                升级申请列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">加载中...</p>
                </div>
              ) : !data || data.requests.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无升级申请</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.requests.map((request) => (
                    <div key={request.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{request.userName}</p>
                              <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                            </div>
                            <Badge variant={getStatusVariant(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1">{getStatusText(request.status)}</span>
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-1">申请理由：</p>
                            <p className="text-sm">{request.reason}</p>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            申请时间：{new Date(request.createdAt.seconds * 1000).toLocaleString('zh-CN')}
                            {request.reviewedAt && (
                              <span className="ml-4">
                                审核时间：{new Date(request.reviewedAt.seconds * 1000).toLocaleString('zh-CN')}
                              </span>
                            )}
                          </div>
                          
                          {request.reviewerComment && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <p className="text-muted-foreground">审核意见：</p>
                              <p>{request.reviewerComment}</p>
                            </div>
                          )}
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(request.id, 'approved')}
                              disabled={processingId === request.id}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              批准
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReview(request.id, 'rejected')}
                              disabled={processingId === request.id}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              拒绝
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}
