// API请求工具函数

import type { ApiResponse } from '@/types'

/**
 * API请求配置
 */
interface RequestConfig extends RequestInit {
  timeout?: number
}

/**
 * 创建API请求函数
 */
class ApiClient {
  private baseURL: string
  private defaultTimeout: number

  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL
    this.defaultTimeout = timeout
  }

  /**
   * 通用请求方法
   */
  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      headers = {},
      ...restConfig
    } = config

    const url = `${this.baseURL}${endpoint}`
    
    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...restConfig,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: '请求超时',
          }
        }
        
        return {
          success: false,
          error: error.message,
        }
      }
      
      return {
        success: false,
        error: '未知错误',
      }
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    let url = endpoint
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      url += `?${searchParams.toString()}`
    }

    return this.request<T>(url, {
      method: 'GET',
      ...config,
    })
  }

  /**
   * POST请求
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  /**
   * PUT请求
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    })
  }

  /**
   * 设置认证token
   */
  setAuthToken(token: string) {
    // 这里可以设置默认的Authorization header
    // 或者存储token供后续请求使用
  }

  /**
   * 清除认证token
   */
  clearAuthToken() {
    // 清除存储的token
  }
}

// 获取API基础URL
const getApiBaseUrl = () => {
  // 如果有环境变量配置的API URL，使用它
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 否则使用Firebase Functions的URL
  // 在生产环境中，这应该是你的Firebase Functions的URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://asia-east1-n8n-project-460516.cloudfunctions.net'
  }

  // 开发环境临时使用生产API（因为模拟器端口被占用）
  return 'https://asia-east1-n8n-project-460516.cloudfunctions.net'
}

// 创建默认API客户端实例
export const apiClient = new ApiClient(getApiBaseUrl())

/**
 * 处理API错误的工具函数
 */
export function handleApiError(error: string): string {
  // 根据错误类型返回用户友好的错误消息
  if (error.includes('Network')) {
    return '网络连接失败，请检查网络设置'
  }
  
  if (error.includes('401')) {
    return '认证失败，请重新登录'
  }
  
  if (error.includes('403')) {
    return '权限不足，无法执行此操作'
  }
  
  if (error.includes('404')) {
    return '请求的资源不存在'
  }
  
  if (error.includes('429')) {
    return '请求过于频繁，请稍后重试'
  }
  
  if (error.includes('500')) {
    return '服务器内部错误，请稍后重试'
  }
  
  return error || '未知错误'
}

/**
 * 重试请求的工具函数
 */
export async function retryRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: string = ''
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await requestFn()
      if (result.success) {
        return result
      }
      lastError = result.error || '请求失败'
    } catch (error) {
      lastError = error instanceof Error ? error.message : '请求失败'
    }
    
    // 如果不是最后一次尝试，等待一段时间后重试
    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  return {
    success: false,
    error: lastError,
  }
}
