// 表单验证工具函数

/**
 * 邮箱格式验证
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 密码强度验证
 */
export function isValidPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需包含至少一个大写字母')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码需包含至少一个小写字母')
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码需包含至少一个数字')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 用户名验证
 */
export function isValidUsername(username: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (username.length < 3) {
    errors.push('用户名长度至少3位')
  }
  
  if (username.length > 20) {
    errors.push('用户名长度不能超过20位')
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字、下划线和连字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 冲刺标题验证
 */
export function isValidSprintTitle(title: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!title.trim()) {
    errors.push('冲刺标题不能为空')
  }
  
  if (title.length > 100) {
    errors.push('冲刺标题不能超过100个字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 任务标题验证
 */
export function isValidTaskTitle(title: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!title.trim()) {
    errors.push('任务标题不能为空')
  }
  
  if (title.length > 200) {
    errors.push('任务标题不能超过200个字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 日期验证
 */
export function isValidDate(date: Date | string): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

/**
 * 未来日期验证
 */
export function isFutureDate(date: Date | string): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.getTime() > now.getTime()
}

/**
 * 日期范围验证
 */
export function isValidDateRange(startDate: Date | string, endDate: Date | string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (!isValidDate(start)) {
    errors.push('开始日期格式无效')
  }
  
  if (!isValidDate(end)) {
    errors.push('结束日期格式无效')
  }
  
  if (start.getTime() >= end.getTime()) {
    errors.push('结束日期必须晚于开始日期')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * URL验证
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 时间估算验证（分钟）
 */
export function isValidTimeEstimate(minutes: number): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (minutes < 0) {
    errors.push('时间估算不能为负数')
  }
  
  if (minutes > 24 * 60) {
    errors.push('时间估算不能超过24小时')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 标签验证
 */
export function isValidTag(tag: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!tag.trim()) {
    errors.push('标签不能为空')
  }
  
  if (tag.length > 20) {
    errors.push('标签长度不能超过20个字符')
  }
  
  if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(tag)) {
    errors.push('标签只能包含字母、数字、中文、下划线和连字符')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 批量验证标签
 */
export function validateTags(tags: string[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (tags.length > 10) {
    errors.push('标签数量不能超过10个')
  }
  
  const uniqueTags = new Set(tags)
  if (uniqueTags.size !== tags.length) {
    errors.push('标签不能重复')
  }
  
  for (const tag of tags) {
    const tagValidation = isValidTag(tag)
    if (!tagValidation.isValid) {
      errors.push(...tagValidation.errors)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 通用表单验证
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => { isValid: boolean; errors: string[] }>
): {
  isValid: boolean
  errors: Record<keyof T, string[]>
  hasErrors: boolean
} {
  const errors = {} as Record<keyof T, string[]>
  let hasErrors = false
  
  for (const [field, rule] of Object.entries(rules)) {
    const validation = rule(data[field])
    if (!validation.isValid) {
      errors[field as keyof T] = validation.errors
      hasErrors = true
    }
  }
  
  return {
    isValid: !hasErrors,
    errors,
    hasErrors
  }
}
