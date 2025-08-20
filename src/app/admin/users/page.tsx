'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { UserApiService, UserInfo, UserListParams } from "@/lib/user-api"
import { UpgradeRequestApiService, UpgradeRequest } from "@/lib/upgrade-request-api"
import {
  UsersIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // 升级申请相关状态
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [upgradeRequestsLoading, setUpgradeRequestsLoading] = useState(false)
  const [upgradeRequestsStats, setUpgradeRequestsStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const pageSize = 20

  // 统计信息状态
  const [stats, setStats] = useState({
    totalUsers: 0,
    normalUsers: 0,
    premiumUsers: 0,
    adminUsers: 0,
    disabledUsers: 0,
    recentRegistrations: 0
  })

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: UserListParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        userType: userTypeFilter === 'all' ? undefined : userTypeFilter,
        sortBy,
        sortOrder
      }

      const response = await UserApiService.getUsers(params)
      setUsers(response.users)
      setTotalPages(response.pagination.totalPages)
      setTotalUsers(response.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    try {
      const statsData = await UserApiService.getUserStats()
      setStats(statsData)
    } catch (err) {
      console.error('加载统计信息失败:', err)
    }
  }

  // 加载升级申请列表
  const loadUpgradeRequests = async () => {
    try {
      setUpgradeRequestsLoading(true)
      const response = await UpgradeRequestApiService.getUpgradeRequests({
        status: 'all',
        limit: 50,
        offset: 0
      })
      setUpgradeRequests(response.requests)
      setUpgradeRequestsStats(response.stats)
    } catch (err) {
      console.error('加载升级申请失败:', err)
    } finally {
      setUpgradeRequestsLoading(false)
    }
  }

  // 处理升级申请
  const handleUpgradeRequest = async (requestId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      await UpgradeRequestApiService.reviewUpgradeRequest(requestId, action, comment)
      // 重新加载数据
      await Promise.all([loadUpgradeRequests(), loadUsers(), loadStats()])
    } catch (err) {
      console.error('处理升级申请失败:', err)
    }
  }

  // 初始加载
  useEffect(() => {
    loadUsers()
    loadStats()
    if (activeTab === 'upgrade-requests') {
      loadUpgradeRequests()
    }
  }, [currentPage, userTypeFilter, sortBy, sortOrder, activeTab])

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // 处理用户选择
  const handleUserSelect = (userId: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  // 全选/取消全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  // 处理用户类型更新
  const handleUserTypeChange = async (userId: string, newType: 'normal' | 'premium' | 'admin') => {
    try {
      await UserApiService.updateUser(userId, { userType: newType })
      await loadUsers() // 重新加载用户列表
      alert(`用户类型已更新为${getUserTypeDisplay(newType)}`)
    } catch (error) {
      console.error('更新用户类型失败:', error)
      alert('更新失败，请重试')
    }
  }

  // 处理用户删除
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复！')) {
      return
    }

    try {
      await UserApiService.deleteUser(userId)
      await loadUsers() // 重新加载用户列表
      await loadStats() // 重新加载统计信息
      alert('用户已删除')
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败，请重试')
    }
  }

  // 获取用户类型显示名称
  const getUserTypeDisplay = (userType: string) => {
    const typeMap = {
      normal: '普通用户',
      premium: '高级用户',
      admin: '管理员'
    }
    return typeMap[userType as keyof typeof typeMap] || userType
  }

  // 获取用户类型徽章样式
  const getUserTypeBadgeVariant = (userType: string) => {
    const variantMap = {
      normal: 'secondary' as const,
      premium: 'warning' as const,
      admin: 'error' as const
    }
    return variantMap[userType as keyof typeof variantMap] || 'secondary' as const
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PermissionGuard requiredUserType="admin">
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">用户管理</h1>
              <p className="text-muted-foreground mt-1">
                管理系统用户和权限设置
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                邀请用户
              </Button>
              <Button variant="outline" size="sm">
                导出数据
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">总用户数</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats.normalUsers}</p>
                  <p className="text-sm text-muted-foreground">普通用户</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{stats.premiumUsers}</p>
                  <p className="text-sm text-muted-foreground">高级用户</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-error">{stats.adminUsers}</p>
                  <p className="text-sm text-muted-foreground">管理员</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{stats.disabledUsers}</p>
                  <p className="text-sm text-muted-foreground">已禁用</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{stats.recentRegistrations}</p>
                  <p className="text-sm text-muted-foreground">近7天注册</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 选项卡 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                用户管理
              </TabsTrigger>
              <TabsTrigger value="upgrade-requests" className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-4 w-4" />
                升级申请
                {upgradeRequestsStats.pending > 0 && (
                  <Badge variant="error" size="sm">
                    {upgradeRequestsStats.pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              {/* 搜索和筛选 */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户邮箱或姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">所有用户类型</option>
                    <option value="normal">普通用户</option>
                    <option value="premium">高级用户</option>
                    <option value="admin">管理员</option>
                  </select>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="createdAt-desc">注册时间（新到旧）</option>
                    <option value="createdAt-asc">注册时间（旧到新）</option>
                    <option value="email-asc">邮箱（A-Z）</option>
                    <option value="email-desc">邮箱（Z-A）</option>
                    <option value="userType-asc">用户类型</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  用户列表
                  <span className="text-sm font-normal text-muted-foreground">
                    ({totalUsers} 个用户)
                  </span>
                </CardTitle>

                {selectedUsers.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      批量编辑 ({selectedUsers.length})
                    </Button>
                    <Button variant="destructive" size="sm">
                      批量删除
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">加载中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={loadUsers} className="mt-2">重试</Button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">没有找到用户</p>
                </div>
              ) : (
                <>
                  {/* 用户表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === users.length}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded"
                            />
                          </th>
                          <th className="text-left py-3 px-2">用户</th>
                          <th className="text-left py-3 px-2">类型</th>
                          <th className="text-left py-3 px-2">状态</th>
                          <th className="text-left py-3 px-2">注册时间</th>
                          <th className="text-left py-3 px-2">最后登录</th>
                          <th className="text-left py-3 px-2">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-2">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                                className="rounded"
                              />
                            </td>
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium">{user.displayName || '未设置'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={getUserTypeBadgeVariant(user.userType)}>
                                {getUserTypeDisplay(user.userType)}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={user.disabled ? 'destructive' : 'success'}>
                                {user.disabled ? '已禁用' : '正常'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">
                              {user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalUsers)} 条，
                        共 {totalUsers} 条记录
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                          上一页
                        </Button>

                        <span className="flex items-center px-3 py-1 text-sm">
                          第 {currentPage} / {totalPages} 页
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          下一页
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="upgrade-requests" className="space-y-6">
              {/* 升级申请统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{upgradeRequestsStats.total}</p>
                      <p className="text-sm text-muted-foreground">总申请数</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">{upgradeRequestsStats.pending}</p>
                      <p className="text-sm text-muted-foreground">待审核</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{upgradeRequestsStats.approved}</p>
                      <p className="text-sm text-muted-foreground">已批准</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{upgradeRequestsStats.rejected}</p>
                      <p className="text-sm text-muted-foreground">已拒绝</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 升级申请列表 */}
              <Card>
                <CardHeader>
                  <CardTitle>升级申请列表</CardTitle>
                </CardHeader>
                <CardContent>
                  {upgradeRequestsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">加载中...</p>
                    </div>
                  ) : upgradeRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardDocumentListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">暂无升级申请</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upgradeRequests.map((request) => (
                        <div key={request.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div>
                                  <p className="font-medium">{request.userEmail}</p>
                                  <p className="text-sm text-muted-foreground">
                                    申请时间：{new Date(request.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    request.status === 'pending' ? 'warning' :
                                    request.status === 'approved' ? 'success' : 'destructive'
                                  }
                                >
                                  {request.status === 'pending' ? '待审核' :
                                   request.status === 'approved' ? '已批准' : '已拒绝'}
                                </Badge>
                              </div>

                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">申请理由：</p>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  {request.reason}
                                </p>
                              </div>

                              {request.adminComment && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium mb-1">管理员备注：</p>
                                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                    {request.adminComment}
                                  </p>
                                </div>
                              )}
                            </div>

                            {request.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpgradeRequest(request.id, 'approve')}
                                  className="text-success border-success hover:bg-success hover:text-white"
                                >
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  批准
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpgradeRequest(request.id, 'reject')}
                                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGuard>
  )
}
