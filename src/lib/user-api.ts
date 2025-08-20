import { apiClient } from './api'
import { auth } from './firebase'

/**
 * 等待Firebase Auth初始化完成
 */
async function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    // 如果已经有用户或者明确没有用户，直接返回
    if (auth.currentUser !== undefined) {
      console.log('🔥 Auth已初始化，当前用户:', auth.currentUser?.uid || '未登录')
      resolve()
      return
    }

    console.log('🔥 等待Auth初始化...')
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('🔥 Auth状态变化:', user?.uid || '未登录')
      unsubscribe()
      resolve()
    })
  })
}

/**
 * 获取认证头部
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    await waitForAuthInit()

    const user = auth.currentUser
    if (!user) {
      console.error('❌ User API - 用户未登录，当前用户状态:', user)
      throw new Error('用户未登录，请先登录后再试')
    }

    console.log('🔥 User API - 正在获取认证token...')
    const token = await user.getIdToken(true) // 强制刷新token
    if (!token) {
      console.error('❌ User API - 无法获取认证token')
      throw new Error('认证token获取失败')
    }

    console.log('✅ User API - 认证token获取成功')
    return {
      'Authorization': `Bearer ${token}`
    }
  } catch (error) {
    console.error('❌ User API - 获取认证头部失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('缺少认证token')
  }
}

// 用户相关类型定义
export interface UserInfo {
  id: string
  email: string
  displayName?: string
  userType: 'normal' | 'premium' | 'admin'
  disabled?: boolean
  createdAt: string
  lastLoginAt?: string
  updatedAt?: string
  stats?: {
    totalSprints: number
    completedSprints: number
    totalTasks: number
    completedTasks: number
    streakDays: number
  }
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  userType?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserListResponse {
  users: UserInfo[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UpdateUserRequest {
  userType?: 'normal' | 'premium' | 'admin'
  displayName?: string
  disabled?: boolean
}

/**
 * 用户管理API服务
 */
export class UserApiService {
  /**
   * 获取用户列表（仅管理员）
   */
  static async getUsers(params?: UserListParams): Promise<UserListResponse> {
    try {
      const headers = await getAuthHeaders()
      
      // 构建查询参数
      const queryParams: Record<string, string | number> = {}
      
      if (params?.page) queryParams.page = params.page
      if (params?.limit) queryParams.limit = params.limit
      if (params?.search) queryParams.search = params.search
      if (params?.userType) queryParams.userType = params.userType
      if (params?.sortBy) queryParams.sortBy = params.sortBy
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder

      const response = await apiClient.get<{
        success: boolean
        data: UserListResponse
      }>('/users', queryParams, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error('获取用户列表失败')
      }

      return response.data.data
    } catch (error) {
      console.error('Get users error:', error)
      throw error
    }
  }

  /**
   * 获取单个用户详情（仅管理员）
   */
  static async getUser(userId: string): Promise<UserInfo> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.get<{
        success: boolean
        data: UserInfo
      }>(`/users/${userId}`, undefined, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error('获取用户信息失败')
      }

      return response.data.data
    } catch (error) {
      console.error('Get user error:', error)
      throw error
    }
  }

  /**
   * 更新用户信息（仅管理员）
   */
  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.put<{
        success: boolean
        message?: string
      }>(`/users/${userId}`, updates, { headers })

      if (!response.success) {
        throw new Error(response.error || '更新用户信息失败')
      }
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    }
  }

  /**
   * 删除用户（仅管理员）
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.delete<{
        success: boolean
        message?: string
      }>(`/users/${userId}`, { headers })

      if (!response.success) {
        throw new Error(response.error || '删除用户失败')
      }
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  }

  /**
   * 批量更新用户状态（仅管理员）
   */
  static async batchUpdateUsers(userIds: string[], updates: UpdateUserRequest): Promise<void> {
    try {
      // 由于后端没有批量更新接口，这里使用并发更新
      const promises = userIds.map(userId => this.updateUser(userId, updates))
      await Promise.all(promises)
    } catch (error) {
      console.error('Batch update users error:', error)
      throw error
    }
  }

  /**
   * 获取用户统计信息（仅管理员）
   */
  static async getUserStats(): Promise<{
    totalUsers: number
    normalUsers: number
    premiumUsers: number
    adminUsers: number
    disabledUsers: number
    recentRegistrations: number
  }> {
    try {
      // 获取所有用户来计算统计信息
      const allUsers = await this.getUsers({ limit: 1000 })

      // 确保用户列表存在
      const users = allUsers?.users || []

      const stats = {
        totalUsers: users.length,
        normalUsers: users.filter(u => u.userType === 'normal').length,
        premiumUsers: users.filter(u => u.userType === 'premium').length,
        adminUsers: users.filter(u => u.userType === 'admin').length,
        disabledUsers: users.filter(u => u.disabled).length,
        recentRegistrations: 0
      }

      // 计算最近7天的注册数量
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      stats.recentRegistrations = users.filter(u =>
        u.createdAt && new Date(u.createdAt) >= sevenDaysAgo
      ).length

      return stats
    } catch (error) {
      console.error('Get user stats error:', error)
      throw error
    }
  }
}
