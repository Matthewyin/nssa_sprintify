/**
 * 升级申请相关API服务
 */

import { apiClient } from '@/lib/api'
import { auth } from '@/lib/firebase'

/**
 * 等待Firebase Auth初始化完成
 */
async function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    // 如果已经有用户或者明确没有用户，直接返回
    if (auth.currentUser !== undefined) {
      console.log('🔥 Upgrade API - Auth已初始化，当前用户:', auth.currentUser?.uid || '未登录')
      resolve()
      return
    }

    console.log('🔥 Upgrade API - 等待Auth初始化...')
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('🔥 Upgrade API - Auth状态变化:', user?.uid || '未登录')
      unsubscribe()
      resolve()
    })
  })
}

/**
 * 获取认证头部
 */
async function getAuthHeaders() {
  try {
    await waitForAuthInit()

    const user = auth.currentUser
    if (!user) {
      console.error('❌ Upgrade API - 用户未登录，当前用户状态:', user)
      throw new Error('用户未登录，请先登录后再试')
    }

    console.log('🔥 Upgrade API - 正在获取认证token...')
    const token = await user.getIdToken(true) // 强制刷新token
    if (!token) {
      console.error('❌ Upgrade API - 无法获取认证token')
      throw new Error('认证token获取失败')
    }

    console.log('✅ Upgrade API - 认证token获取成功')
    return {
      'Authorization': `Bearer ${token}`
    }
  } catch (error) {
    console.error('❌ Upgrade API - 获取认证头部失败:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('缺少认证token')
  }
}

// 升级申请相关类型定义
export interface UpgradeRequest {
  id: string
  userId: string
  userEmail: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminComment?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface UpgradeRequestListParams {
  status?: string
  limit?: number
  offset?: number
}

export interface UpgradeRequestListResponse {
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

export interface CreateUpgradeRequestData {
  reason: string
}

/**
 * 升级申请API服务类
 */
export class UpgradeRequestApiService {
  /**
   * 获取升级申请列表（仅管理员）
   */
  static async getUpgradeRequests(params?: UpgradeRequestListParams): Promise<UpgradeRequestListResponse> {
    try {
      const headers = await getAuthHeaders()
      
      // 构建查询参数
      const queryParams: Record<string, string | number> = {}
      
      if (params?.status) queryParams.status = params.status
      if (params?.limit) queryParams.limit = params.limit
      if (params?.offset) queryParams.offset = params.offset

      const response = await apiClient.get<{
        success: boolean
        data: UpgradeRequestListResponse
      }>('/upgrade-requests', queryParams, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error('获取升级申请列表失败')
      }

      return response.data.data
    } catch (error) {
      console.error('Get upgrade requests error:', error)
      throw error
    }
  }

  /**
   * 创建升级申请
   */
  static async createUpgradeRequest(data: CreateUpgradeRequestData): Promise<UpgradeRequest> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        data: UpgradeRequest
      }>('/upgrade-requests', data, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error('创建升级申请失败')
      }

      return response.data.data
    } catch (error) {
      console.error('Create upgrade request error:', error)
      throw error
    }
  }

  /**
   * 审批升级申请（仅管理员）
   */
  static async reviewUpgradeRequest(
    requestId: string, 
    action: 'approve' | 'reject', 
    comment?: string
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`/upgrade-requests/${requestId}/review`, {
        action,
        comment
      }, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '审批升级申请失败')
      }
    } catch (error) {
      console.error('Review upgrade request error:', error)
      throw error
    }
  }

  /**
   * 获取当前用户的升级申请状态
   */
  static async getUserUpgradeRequestStatus(): Promise<UpgradeRequest | null> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.get<{
        success: boolean
        data: UpgradeRequest | null
      }>('/upgrade-requests/my-status', undefined, { headers })

      if (!response.success) {
        throw new Error(response.error || '获取升级申请状态失败')
      }

      return response.data?.data || null
    } catch (error) {
      console.error('Get user upgrade request status error:', error)
      throw error
    }
  }

  /**
   * 取消升级申请
   */
  static async cancelUpgradeRequest(requestId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.delete<{
        success: boolean
        message?: string
      }>(`/upgrade-requests/${requestId}`, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '取消升级申请失败')
      }
    } catch (error) {
      console.error('Cancel upgrade request error:', error)
      throw error
    }
  }
}
