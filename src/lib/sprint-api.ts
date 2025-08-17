/**
 * 冲刺相关API服务
 */

import { apiClient } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  SprintInfo,
  CreateSprintRequest,
  UpdateSprintRequest,
  SprintFilters,
  PaginationParams
} from '@/types/sprint'

/**
 * 等待Firebase Auth初始化完成
 */
function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser !== null) {
      resolve()
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve()
    })
  })
}

/**
 * 获取认证头部
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  // 等待Firebase Auth初始化完成
  await waitForAuthInit()

  const user = auth.currentUser
  if (!user) {
    throw new Error('用户未登录')
  }

  const token = await user.getIdToken()
  return {
    'Authorization': `Bearer ${token}`
  }
}

/**
 * 冲刺API服务
 */
export class SprintApiService {
  /**
   * 获取用户的冲刺列表
   */
  static async getUserSprints(
    filters?: SprintFilters, 
    pagination?: PaginationParams
  ): Promise<SprintInfo[]> {
    try {
      const headers = await getAuthHeaders()
      
      // 构建查询参数
      const params: Record<string, string | number | boolean> = {}
      
      if (filters?.status && filters.status.length > 0) {
        params.status = filters.status[0]
      }
      if (filters?.type && filters.type.length > 0) {
        params.type = filters.type[0]
      }
      if (pagination?.limit) {
        params.limit = pagination.limit
      }
      if (pagination?.page) {
        params.offset = (pagination.page - 1) * (pagination.limit || 10)
      }

      const response = await apiClient.get<{
        success: boolean
        data: SprintInfo[]
        pagination?: {
          total: number
          limit: number
          offset: number
        }
      }>(API_ENDPOINTS.SPRINTS.LIST, params, { headers })
      
      if (response.success && response.data?.success) {
        return response.data.data || []
      } else {
        throw new Error(response.error || response.data?.error || '获取冲刺列表失败')
      }
    } catch (error) {
      console.error('Get user sprints error:', error)
      throw error
    }
  }

  /**
   * 获取单个冲刺详情
   */
  static async getSprint(sprintId: string): Promise<SprintInfo | null> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.get<{
        success: boolean
        data: SprintInfo
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}`, undefined, { headers })
      
      if (response.success && response.data?.success) {
        return response.data.data || null
      } else {
        throw new Error(response.error || response.data?.error || '获取冲刺详情失败')
      }
    } catch (error) {
      console.error('Get sprint error:', error)
      throw error
    }
  }

  /**
   * 创建冲刺
   */
  static async createSprint(request: CreateSprintRequest): Promise<SprintInfo> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        data: SprintInfo
      }>(API_ENDPOINTS.SPRINTS.CREATE, request, { headers })
      
      if (response.success && response.data?.success) {
        return response.data.data
      } else {
        throw new Error(response.error || response.data?.error || '创建冲刺失败')
      }
    } catch (error) {
      console.error('Create sprint error:', error)
      throw error
    }
  }

  /**
   * 更新冲刺
   */
  static async updateSprint(sprintId: string, updates: UpdateSprintRequest): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.put<{
        success: boolean
        message?: string
      }>(API_ENDPOINTS.SPRINTS.UPDATE(sprintId), updates, { headers })
      
      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '更新冲刺失败')
      }
    } catch (error) {
      console.error('Update sprint error:', error)
      throw error
    }
  }

  /**
   * 删除冲刺
   */
  static async deleteSprint(sprintId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.delete<{
        success: boolean
        message?: string
      }>(API_ENDPOINTS.SPRINTS.DELETE(sprintId), { headers })
      
      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '删除冲刺失败')
      }
    } catch (error) {
      console.error('Delete sprint error:', error)
      throw error
    }
  }

  /**
   * 启动冲刺
   */
  static async startSprint(sprintId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}/start`, {}, { headers })
      
      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '启动冲刺失败')
      }
    } catch (error) {
      console.error('Start sprint error:', error)
      throw error
    }
  }

  /**
   * 暂停冲刺
   */
  static async pauseSprint(sprintId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}/pause`, {}, { headers })
      
      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '暂停冲刺失败')
      }
    } catch (error) {
      console.error('Pause sprint error:', error)
      throw error
    }
  }

  /**
   * 完成冲刺
   */
  static async completeSprint(sprintId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      
      const response = await apiClient.post<{
        success: boolean
        message?: string
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}/complete`, {}, { headers })
      
      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '完成冲刺失败')
      }
    } catch (error) {
      console.error('Complete sprint error:', error)
      throw error
    }
  }
}
