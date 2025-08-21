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
  PaginationParams,
  Task
} from '@/types/sprint'

/**
 * 等待Firebase Auth初始化完成
 */
function waitForAuthInit(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果已经有用户，直接返回
    if (auth.currentUser) {
      console.log('🔥 Sprint API - Auth已初始化，当前用户:', auth.currentUser.uid)
      resolve()
      return
    }

    console.log('🔥 Sprint API - 等待Auth初始化...')

    // 设置超时时间（10秒）
    const timeout = setTimeout(() => {
      console.log('⚠️ Sprint API - Auth初始化超时')
      unsubscribe()
      resolve() // 即使超时也继续，让后续逻辑处理
    }, 10000)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 Sprint API - Auth状态变化:', user?.uid || '未登录')
      clearTimeout(timeout)
      unsubscribe()
      resolve()
    })
  })
}

/**
 * 获取认证头部（带重试机制）
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const maxRetries = 3
  const retryDelay = 1000 // 1秒

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔥 Sprint API - 尝试获取认证头部 (${attempt}/${maxRetries})`)

      // 等待Firebase Auth初始化完成
      await waitForAuthInit()

      const user = auth.currentUser
      if (!user) {
        console.warn(`⚠️ Sprint API - 用户未登录 (尝试 ${attempt}/${maxRetries})，当前用户状态:`, user)

        if (attempt < maxRetries) {
          console.log(`🔄 Sprint API - 等待 ${retryDelay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }

        throw new Error('用户未登录，请先登录后再试')
      }

      console.log('🔥 Sprint API - 正在获取认证token...')
      const token = await user.getIdToken(true) // 强制刷新token
      if (!token) {
        console.error('❌ Sprint API - 无法获取认证token')
        throw new Error('认证token获取失败')
      }

      console.log('✅ Sprint API - 认证token获取成功')
      return {
        'Authorization': `Bearer ${token}`
      }
    } catch (error) {
      console.error(`❌ Sprint API - 获取认证头部失败 (尝试 ${attempt}/${maxRetries}):`, error)

      if (attempt === maxRetries) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('缺少认证token')
      }

      // 等待后重试
      console.log(`🔄 Sprint API - 等待 ${retryDelay}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error('获取认证头部失败')
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
        throw new Error('获取冲刺列表失败')
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
        throw new Error('获取冲刺详情失败')
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
        throw new Error('创建冲刺失败')
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

  /**
   * 删除单个冲刺
   */
  static async deleteSprint(sprintId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()

      const response = await apiClient.delete<{
        success: boolean
        message?: string
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}`, { headers })

      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '删除冲刺失败')
      }
    } catch (error) {
      console.error('Delete sprint error:', error)
      throw error
    }
  }

  /**
   * 批量删除冲刺
   */
  static async deleteSprintsBatch(sprintIds: string[]): Promise<{
    deleted: string[]
    notFound: string[]
  }> {
    try {
      const headers = await getAuthHeaders()

      const response = await apiClient.delete<{
        success: boolean
        message?: string
        deleted?: string[]
        notFound?: string[]
      }>(API_ENDPOINTS.SPRINTS.LIST, {
        headers,
        data: { sprintIds }
      })

      if (!response.success || !response.data?.success) {
        throw new Error(response.error || response.data?.message || '批量删除冲刺失败')
      }

      return {
        deleted: response.data.deleted || [],
        notFound: response.data.notFound || []
      }
    } catch (error) {
      console.error('Batch delete sprints error:', error)
      throw error
    }
  }

  /**
   * 获取Sprint的任务列表
   */
  static async getTasks(sprintId: string): Promise<Task[]> {
    try {
      const headers = await getAuthHeaders()

      const response = await apiClient.get<{
        success: boolean
        data?: Task[]
        message?: string
      }>(`${API_ENDPOINTS.SPRINTS.LIST}/${sprintId}/tasks`, undefined, { headers })

      if (response.success && response.data?.success) {
        return response.data.data || []
      } else {
        throw new Error(response.error || response.data?.message || '获取任务列表失败')
      }
    } catch (error) {
      console.error('Get tasks error:', error)
      throw error
    }
  }
}
