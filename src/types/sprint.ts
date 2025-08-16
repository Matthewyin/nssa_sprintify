/**
 * 冲刺计划相关类型定义
 */

// 冲刺类型
export type SprintType = 'learning' | 'project'

// 冲刺状态
export type SprintStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'

// 冲刺模板
export type SprintTemplate = '7days' | '21days' | '30days' | '60days' | '90days' | 'custom'

// 任务状态
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled'

// 任务优先级
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 里程碑状态
export type MilestoneStatus = 'pending' | 'achieved' | 'missed'

// 冲刺难度
export type SprintDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/**
 * 冲刺基础信息
 */
export interface SprintInfo {
  id: string
  userId: string
  title: string
  description: string
  type: SprintType
  template: SprintTemplate
  difficulty: SprintDifficulty
  status: SprintStatus
  
  // 时间相关
  startDate: Date
  endDate: Date
  duration: number // 天数
  
  // 进度相关
  progress: number // 0-100
  
  // 统计信息
  stats: {
    totalTasks: number
    completedTasks: number
    totalTime: number // 预估总时间（分钟）
    actualTime: number // 实际花费时间（分钟）
    completionRate: number // 完成率
  }
  
  // 标签和分类
  tags: string[]
  category?: string
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

/**
 * 任务信息
 */
export interface Task {
  id: string
  sprintId: string
  userId: string
  
  // 基本信息
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  
  // 时间相关
  estimatedTime: number // 预估时间（分钟）
  actualTime: number // 实际时间（分钟）
  dueDate?: Date
  
  // 依赖关系
  dependencies: string[] // 依赖的任务ID
  
  // 进度相关
  progress: number // 0-100
  
  // 分类和标签
  tags: string[]
  category?: string
  
  // 附加信息
  notes?: string
  attachments?: string[] // 文件URL
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  startedAt?: Date
}

/**
 * 里程碑信息
 */
export interface Milestone {
  id: string
  sprintId: string
  userId: string
  
  // 基本信息
  title: string
  description?: string
  status: MilestoneStatus
  
  // 时间相关
  targetDate: Date
  achievedDate?: Date
  
  // 完成条件
  criteria: string[] // 完成标准
  relatedTasks: string[] // 相关任务ID
  
  // 奖励和激励
  reward?: string
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
}

/**
 * 冲刺模板定义
 */
export interface SprintTemplateConfig {
  id: SprintTemplate
  name: string
  description: string
  duration: number // 天数
  difficulty: SprintDifficulty
  
  // 推荐配置
  recommendedTasks: number
  recommendedMilestones: number
  
  // 阶段划分
  phases: {
    name: string
    description: string
    duration: number // 天数
    tasks: string[] // 推荐任务类型
  }[]
  
  // 适用场景
  suitableFor: SprintType[]
  
  // 成功要素
  successFactors: string[]
  tips: string[]
}

/**
 * 冲刺创建请求
 */
export interface CreateSprintRequest {
  title: string
  description: string
  type: SprintType
  template: SprintTemplate
  difficulty?: SprintDifficulty
  startDate: Date
  endDate?: Date
  duration?: number
  tags?: string[]
  category?: string
}

/**
 * 冲刺更新请求
 */
export interface UpdateSprintRequest {
  title?: string
  description?: string
  status?: SprintStatus
  difficulty?: SprintDifficulty
  startDate?: Date
  endDate?: Date
  tags?: string[]
  category?: string
  progress?: number
  completedAt?: Date
}

/**
 * 任务创建请求
 */
export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: TaskPriority
  estimatedTime?: number
  dueDate?: Date
  dependencies?: string[]
  tags?: string[]
  category?: string
}

/**
 * 任务更新请求
 */
export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  estimatedTime?: number
  actualTime?: number
  dueDate?: Date
  dependencies?: string[]
  progress?: number
  tags?: string[]
  category?: string
  notes?: string
  completedAt?: Date
  startedAt?: Date
}

/**
 * 里程碑创建请求
 */
export interface CreateMilestoneRequest {
  title: string
  description?: string
  targetDate: Date
  criteria: string[]
  relatedTasks?: string[]
  reward?: string
}

/**
 * 冲刺统计信息
 */
export interface SprintStats {
  // 基础统计
  totalSprints: number
  activeSprints: number
  completedSprints: number
  
  // 完成率统计
  averageCompletionRate: number
  bestCompletionRate: number
  
  // 时间统计
  totalTimeSpent: number
  averageSprintDuration: number
  
  // 任务统计
  totalTasks: number
  completedTasks: number
  averageTasksPerSprint: number
  
  // 类型分布
  sprintsByType: Record<SprintType, number>
  sprintsByTemplate: Record<SprintTemplate, number>
  sprintsByDifficulty: Record<SprintDifficulty, number>
  
  // 趋势数据
  monthlyProgress: {
    month: string
    completed: number
    started: number
  }[]
}

/**
 * 冲刺搜索和筛选参数
 */
export interface SprintFilters {
  status?: SprintStatus[]
  type?: SprintType[]
  template?: SprintTemplate[]
  difficulty?: SprintDifficulty[]
  tags?: string[]
  category?: string
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * API响应格式
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
