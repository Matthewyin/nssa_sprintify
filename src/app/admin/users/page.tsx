'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { PermissionGuard, usePermission } from "@/components/permission-guard"
import { 
  UsersIcon, 
  MagnifyingGlassIcon, 
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  displayName: string
  userType: 'normal' | 'premium' | 'admin'
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export default function UserManagementPage() {
  const { isAdmin } = usePermission()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserType, setSelectedUserType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟获取用户列表
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@example.com',
        displayName: '系统管理员',
        userType: 'admin',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
        isActive: true
      },
      {
        id: '2',
        email: 'premium@example.com',
        displayName: '高级用户',
        userType: 'premium',
        createdAt: new Date('2024-01-15'),
        lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: '3',
        email: 'user@example.com',
        displayName: '普通用户',
        userType: 'normal',
        createdAt: new Date('2024-02-01'),
        lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedUserType === 'all' || user.userType === selectedUserType
    return matchesSearch && matchesType
  })

  const handleUserTypeChange = async (userId: string, newType: 'normal' | 'premium' | 'admin') => {
    try {
      // TODO: 调用API更新用户类型
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, userType: newType } : user
      ))
      alert(`用户类型已更新为${getTypeDisplayName(newType)}`)
    } catch (error) {
      console.error('更新用户类型失败:', error)
      alert('更新失败，请重试')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复！')) {
      return
    }

    try {
      // TODO: 调用API删除用户
      setUsers(prev => prev.filter(user => user.id !== userId))
      alert('用户已删除')
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getTypeDisplayName = (type: string) => {
    const names = {
      normal: '普通用户',
      premium: '高级用户',
      admin: '管理员'
    }
    return names[type as keyof typeof names] || '未知'
  }

  const getTypeBadgeVariant = (type: string) => {
    const variants = {
      normal: 'secondary',
      premium: 'warning',
      admin: 'error'
    }
    return variants[type as keyof typeof variants] || 'secondary'
  }

  return (
    <PermissionGuard requiredUserType="admin">
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <UsersIcon className="h-8 w-8" />
                用户管理
              </h1>
              <p className="text-muted-foreground mt-1">
                管理系统用户和权限设置
              </p>
            </div>
            <Button>
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              系统设置
            </Button>
          </div>

          {/* 搜索和筛选 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户邮箱或姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    value={selectedUserType}
                    onChange={(e) => setSelectedUserType(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">所有用户类型</option>
                    <option value="normal">普通用户</option>
                    <option value="premium">高级用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>
                用户列表 ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">没有找到匹配的用户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">用户信息</th>
                        <th className="text-left py-3 px-4">用户类型</th>
                        <th className="text-left py-3 px-4">注册时间</th>
                        <th className="text-left py-3 px-4">最后登录</th>
                        <th className="text-left py-3 px-4">状态</th>
                        <th className="text-left py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={user.userType}
                              onChange={(e) => handleUserTypeChange(user.id, e.target.value as any)}
                              className="px-2 py-1 border border-input rounded text-sm bg-background"
                            >
                              <option value="normal">普通用户</option>
                              <option value="premium">高级用户</option>
                              <option value="admin">管理员</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user.createdAt.toLocaleDateString('zh-CN')}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString('zh-CN') : '从未登录'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.isActive ? 'success' : 'secondary'}>
                              {user.isActive ? '活跃' : '停用'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-error hover:bg-error hover:text-white"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">总用户数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.userType === 'admin').length}
                </p>
                <p className="text-sm text-muted-foreground">管理员</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.userType === 'premium').length}
                </p>
                <p className="text-sm text-muted-foreground">高级用户</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {users.filter(u => u.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">活跃用户</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
