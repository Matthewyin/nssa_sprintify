// 用户相关类型
export interface User {
  id: string
  email: string
  displayName?: string
  userType: UserType
  createdAt: Date
  updatedAt: Date
}

export type UserType = 'normal' | 'premium' | 'admin'

// 冲刺计划相关类型
export interface Sprint {
  id: string
  userId: string
  title: string
  description: string
  type: SprintType
  template: SprintTemplate
  startDate: Date
  endDate: Date
  status: SprintStatus
  progress: number
  tasks: Task[]
  phases: Phase[]
  milestones: Milestone[]
  createdAt: Date
  updatedAt: Date
}

export type SprintType = 'learning' | 'project'
export type SprintTemplate = '7days' | '21days' | '30days' | '60days' | '90days'
export type SprintStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

// 任务相关类型
export interface Task {
  id: string
  sprintId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  estimatedTime?: number // 分钟
  actualTime?: number // 分钟
  dueDate?: Date
  completedAt?: Date
  tags: string[]
  resources: Resource[]
  createdAt: Date
  updatedAt: Date
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'

// 阶段相关类型
export interface Phase {
  id: string
  sprintId: string
  title: string
  description?: string
  order: number
  startDate: Date
  endDate: Date
  status: PhaseStatus
  tasks: string[] // task IDs
  createdAt: Date
  updatedAt: Date
}

export type PhaseStatus = 'pending' | 'active' | 'completed'

// 里程碑相关类型
export interface Milestone {
  id: string
  sprintId: string
  title: string
  description?: string
  targetDate: Date
  completedAt?: Date
  status: MilestoneStatus
  criteria: string[]
  createdAt: Date
  updatedAt: Date
}

export type MilestoneStatus = 'pending' | 'completed'

// 资源相关类型
export interface Resource {
  id: string
  type: ResourceType
  title: string
  url?: string
  content?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type ResourceType = 'link' | 'file' | 'note' | 'video' | 'book'

// AI相关类型
export interface AIUsage {
  userId: string
  date: string // YYYY-MM-DD
  count: number
  limit: number
  resetAt: Date
}

export interface AIConversation {
  id: string
  userId: string
  messages: AIMessage[]
  generatedPlan?: Sprint
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 设置相关类型
export interface UserSettings {
  userId: string
  notifications: NotificationSettings
  preferences: UserPreferences
  obsidian?: ObsidianSettings
  updatedAt: Date
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  dailyReminder: boolean
  deadlineReminder: boolean
  milestoneReminder: boolean
  reminderTime: string // HH:MM format
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
}

export interface ObsidianSettings {
  enabled: boolean
  vaultPath?: string
  syncEnabled: boolean
  autoSync: boolean
  lastSyncAt?: Date
}

// 统计相关类型
export interface UserStats {
  userId: string
  totalSprints: number
  completedSprints: number
  totalTasks: number
  completedTasks: number
  totalTime: number // 分钟
  streakDays: number
  longestStreak: number
  lastActiveDate: Date
  achievements: Achievement[]
  updatedAt: Date
}

export interface Achievement {
  id: string
  type: AchievementType
  title: string
  description: string
  unlockedAt: Date
}

export type AchievementType = 'first-sprint' | 'streak-7' | 'streak-30' | 'complete-10' | 'complete-50'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 表单相关类型
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
}

export interface CreateSprintForm {
  title: string
  description: string
  type: SprintType
  template: SprintTemplate
  startDate: Date
}

export interface CreateTaskForm {
  title: string
  description?: string
  priority: TaskPriority
  estimatedTime?: number
  dueDate?: Date
  tags: string[]
}
