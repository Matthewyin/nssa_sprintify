import { generateSprintPlan, optimizePlan, isGeminiAvailable } from './gemini'
import { checkAIUsagePermission, recordAIUsage } from './ai-usage'
import type { UserType } from '@/types'

// AI生成计划的参数接口
export interface AIGenerationParams {
  goal: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  description?: string
  preferences?: string[]
  constraints?: string[]
}

// AI生成的计划结构
export interface AIGeneratedPlan {
  title: string
  description: string
  tasks: Array<{
    title: string
    description: string
    estimatedHours: number
    priority: 'high' | 'medium' | 'low'
    category: string
    day?: number // 建议在第几天完成
  }>
  tips: string[]
  totalEstimatedHours: number
  dailyHoursRecommendation: number
}

// AI服务状态
export interface AIServiceStatus {
  available: boolean
  reason?: string
}

/**
 * 检查AI服务状态
 */
export function getAIServiceStatus(): AIServiceStatus {
  if (!isGeminiAvailable()) {
    return {
      available: false,
      reason: 'Gemini API未配置或不可用'
    }
  }

  return {
    available: true
  }
}

/**
 * 验证生成参数
 */
function validateGenerationParams(params: AIGenerationParams): string[] {
  const errors: string[] = []

  if (!params.goal || params.goal.trim().length < 5) {
    errors.push('目标描述至少需要5个字符')
  }

  if (params.duration < 1 || params.duration > 90) {
    errors.push('持续时间必须在1-90天之间')
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(params.difficulty)) {
    errors.push('难度级别无效')
  }

  if (!params.category || params.category.trim().length < 2) {
    errors.push('类别不能为空')
  }

  return errors
}

/**
 * 生成AI冲刺计划
 */
export async function generateAIPlan(
  params: AIGenerationParams,
  userId: string,
  userType: UserType
): Promise<AIGeneratedPlan> {
  // 检查AI服务状态
  const serviceStatus = getAIServiceStatus()
  if (!serviceStatus.available) {
    throw new Error(serviceStatus.reason || 'AI服务不可用')
  }

  // 验证参数
  const validationErrors = validateGenerationParams(params)
  if (validationErrors.length > 0) {
    throw new Error(`参数验证失败: ${validationErrors.join(', ')}`)
  }

  // 检查使用权限
  const permission = await checkAIUsagePermission(userId, userType)
  if (!permission.canUse) {
    throw new Error(permission.reason || '无法使用AI功能')
  }

  try {
    // 构建增强的提示词参数
    const enhancedParams = {
      ...params,
      userLevel: userType,
      additionalContext: buildAdditionalContext(params)
    }

    // 调用Gemini API生成计划
    const rawPlan = await generateSprintPlan(enhancedParams)

    // 处理和增强生成的计划
    const enhancedPlan = enhancePlan(rawPlan, params)

    // 记录AI使用
    await recordAIUsage(userId)

    return enhancedPlan
  } catch (error) {
    console.error('AI计划生成失败:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('AI计划生成失败，请稍后重试')
  }
}

/**
 * 构建额外的上下文信息
 */
function buildAdditionalContext(params: AIGenerationParams): string {
  const context: string[] = []

  if (params.description) {
    context.push(`详细描述: ${params.description}`)
  }

  if (params.preferences && params.preferences.length > 0) {
    context.push(`用户偏好: ${params.preferences.join(', ')}`)
  }

  if (params.constraints && params.constraints.length > 0) {
    context.push(`限制条件: ${params.constraints.join(', ')}`)
  }

  return context.join('\n')
}

/**
 * 增强生成的计划
 */
function enhancePlan(rawPlan: any, params: AIGenerationParams): AIGeneratedPlan {
  // 计算总预估时间
  const totalEstimatedHours = rawPlan.tasks.reduce(
    (total: number, task: any) => total + (task.estimatedHours || 0),
    0
  )

  // 计算每日建议时间
  const dailyHoursRecommendation = Math.ceil(totalEstimatedHours / params.duration)

  // 为任务分配建议完成日期
  const tasksWithDays = assignTaskDays(rawPlan.tasks, params.duration)

  return {
    title: rawPlan.title,
    description: rawPlan.description,
    tasks: tasksWithDays,
    tips: rawPlan.tips || [],
    totalEstimatedHours,
    dailyHoursRecommendation
  }
}

/**
 * 为任务分配建议完成日期
 */
function assignTaskDays(tasks: any[], duration: number): any[] {
  // 按优先级排序任务
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - 
           priorityOrder[a.priority as keyof typeof priorityOrder]
  })

  // 计算总时间
  const totalHours = sortedTasks.reduce((sum, task) => sum + task.estimatedHours, 0)
  const hoursPerDay = totalHours / duration

  let currentDay = 1
  let currentDayHours = 0

  return sortedTasks.map(task => {
    // 如果当前天的时间已满，移到下一天
    if (currentDayHours + task.estimatedHours > hoursPerDay * 1.5 && currentDay < duration) {
      currentDay++
      currentDayHours = 0
    }

    const taskWithDay = {
      ...task,
      day: Math.min(currentDay, duration)
    }

    currentDayHours += task.estimatedHours

    return taskWithDay
  })
}

/**
 * 优化现有计划
 */
export async function optimizeExistingPlan(
  currentPlan: any,
  feedback: string,
  userId: string,
  userType: UserType
): Promise<{
  suggestions: string[]
  optimizedTasks: any[]
}> {
  // 检查AI服务状态
  const serviceStatus = getAIServiceStatus()
  if (!serviceStatus.available) {
    throw new Error(serviceStatus.reason || 'AI服务不可用')
  }

  // 检查使用权限
  const permission = await checkAIUsagePermission(userId, userType)
  if (!permission.canUse) {
    throw new Error(permission.reason || '无法使用AI功能')
  }

  try {
    const result = await optimizePlan(currentPlan, feedback)
    
    // 记录AI使用
    await recordAIUsage(userId)
    
    return result
  } catch (error) {
    console.error('计划优化失败:', error)
    throw new Error('计划优化失败，请稍后重试')
  }
}

/**
 * 获取AI生成建议的模板
 */
export function getAIGenerationTemplates(): Array<{
  name: string
  description: string
  params: Partial<AIGenerationParams>
}> {
  return [
    {
      name: '学习新技能',
      description: '适合学习编程、语言、设计等新技能',
      params: {
        category: '学习',
        difficulty: 'beginner',
        duration: 14
      }
    },
    {
      name: '项目开发',
      description: '适合软件开发、创作项目等',
      params: {
        category: '项目',
        difficulty: 'intermediate',
        duration: 21
      }
    },
    {
      name: '考试准备',
      description: '适合各类考试的复习计划',
      params: {
        category: '考试',
        difficulty: 'intermediate',
        duration: 30
      }
    },
    {
      name: '健身计划',
      description: '适合制定运动健身目标',
      params: {
        category: '健康',
        difficulty: 'beginner',
        duration: 28
      }
    },
    {
      name: '读书计划',
      description: '适合阅读学习计划',
      params: {
        category: '阅读',
        difficulty: 'beginner',
        duration: 21
      }
    }
  ]
}
