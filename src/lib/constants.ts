// 应用常量定义

// 冲刺模板配置
export const SPRINT_TEMPLATES = {
  '7days': {
    name: '7天短期冲刺',
    description: '快速技能提升',
    duration: 7,
    color: '#ef4444',
    icon: '⚡'
  },
  '21days': {
    name: '21天习惯养成',
    description: '建立良好习惯',
    duration: 21,
    color: '#f59e0b',
    icon: '🔄'
  },
  '30days': {
    name: '30天项目冲刺',
    description: '完成小型项目',
    duration: 30,
    color: '#3b82f6',
    icon: '🚀'
  },
  '60days': {
    name: '60天项目冲刺',
    description: '完成中型项目',
    duration: 60,
    color: '#8b5cf6',
    icon: '🎯'
  },
  '90days': {
    name: '90天季度目标',
    description: '实现季度目标',
    duration: 90,
    color: '#10b981',
    icon: '🏆'
  }
} as const

// 任务优先级配置
export const TASK_PRIORITIES = {
  low: {
    name: '低优先级',
    color: '#6b7280',
    icon: '⬇️'
  },
  medium: {
    name: '中优先级',
    color: '#f59e0b',
    icon: '➡️'
  },
  high: {
    name: '高优先级',
    color: '#ef4444',
    icon: '⬆️'
  }
} as const

// 任务状态配置
export const TASK_STATUSES = {
  todo: {
    name: '待办',
    color: '#6b7280',
    icon: '📋'
  },
  'in-progress': {
    name: '进行中',
    color: '#3b82f6',
    icon: '⚡'
  },
  completed: {
    name: '已完成',
    color: '#10b981',
    icon: '✅'
  },
  cancelled: {
    name: '已取消',
    color: '#ef4444',
    icon: '❌'
  }
} as const

// 冲刺状态配置
export const SPRINT_STATUSES = {
  draft: {
    name: '草稿',
    color: '#6b7280',
    icon: '📝'
  },
  active: {
    name: '进行中',
    color: '#3b82f6',
    icon: '🔥'
  },
  paused: {
    name: '暂停',
    color: '#f59e0b',
    icon: '⏸️'
  },
  completed: {
    name: '已完成',
    color: '#10b981',
    icon: '🎉'
  },
  cancelled: {
    name: '已取消',
    color: '#ef4444',
    icon: '🚫'
  }
} as const

// 用户等级配置
export const USER_TYPES = {
  normal: {
    name: '普通用户',
    aiLimit: 5,
    color: '#6b7280',
    features: ['基础功能', '每日5次AI交流']
  },
  premium: {
    name: '高级用户',
    aiLimit: 10,
    color: '#f59e0b',
    features: ['所有功能', '每日10次AI交流', '高级统计']
  },
  admin: {
    name: '管理员',
    aiLimit: -1,
    color: '#ef4444',
    features: ['所有功能', '无限AI交流', '系统管理']
  }
} as const

// 番茄钟配置
export const POMODORO_SETTINGS = {
  work: 25 * 60, // 25分钟
  shortBreak: 5 * 60, // 5分钟
  longBreak: 15 * 60, // 15分钟
  sessionsUntilLongBreak: 4
} as const

// 通知类型
export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: 'daily_reminder',
  DEADLINE_WARNING: 'deadline_warning',
  MILESTONE_ACHIEVED: 'milestone_achieved',
  SPRINT_COMPLETED: 'sprint_completed',
  TASK_OVERDUE: 'task_overdue'
} as const

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  PWA_INSTALL_DISMISSED: 'pwa_install_dismissed',
  ONBOARDING_COMPLETED: 'onboarding_completed'
} as const

// API端点
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  SPRINTS: {
    LIST: '/sprints',
    CREATE: '/sprints',
    UPDATE: (id: string) => `/sprints/${id}`,
    DELETE: (id: string) => `/sprints/${id}`
  },
  TASKS: {
    LIST: (sprintId: string) => `/sprints/${sprintId}/tasks`,
    CREATE: (sprintId: string) => `/sprints/${sprintId}/tasks`,
    UPDATE: (sprintId: string, taskId: string) => `/sprints/${sprintId}/tasks/${taskId}`,
    DELETE: (sprintId: string, taskId: string) => `/sprints/${sprintId}/tasks/${taskId}`
  },
  AI: {
    GENERATE_PLAN: '/ai/generate-plan',
    CHAT: '/ai/chat'
  }
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  AUTH_FAILED: '认证失败，请重新登录',
  PERMISSION_DENIED: '权限不足，无法执行此操作',
  VALIDATION_ERROR: '输入数据格式错误',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  NOT_FOUND: '请求的资源不存在',
  RATE_LIMIT: 'AI使用次数已达上限，请明天再试'
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  SPRINT_CREATED: '冲刺计划创建成功',
  SPRINT_UPDATED: '冲刺计划更新成功',
  SPRINT_DELETED: '冲刺计划删除成功',
  TASK_CREATED: '任务创建成功',
  TASK_UPDATED: '任务更新成功',
  TASK_DELETED: '任务删除成功',
  SETTINGS_SAVED: '设置保存成功',
  LOGIN_SUCCESS: '登录成功',
  REGISTER_SUCCESS: '注册成功'
} as const
