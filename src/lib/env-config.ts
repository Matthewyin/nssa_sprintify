/**
 * 环境配置管理
 * 统一管理开发环境和生产环境的配置
 */

export const ENV_CONFIG = {
  // 当前环境
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 是否为开发环境
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // 是否为生产环境
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Firebase模拟器配置
  FIREBASE_EMULATOR: {
    ENABLED: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
    AUTH_PORT: 9098,
    FIRESTORE_PORT: 8081,
    FUNCTIONS_PORT: 5002,
    STORAGE_PORT: 9199,
    UI_PORT: 4003,
  },
  
  // API配置 - 反向代理模式
  API: {
    // 开发环境使用模拟器，生产环境使用反向代理
    BASE_URL: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
      ? 'http://127.0.0.1:5002/n8n-project-460516/asia-east1/api'
      : '/api',  // 🔄 生产环境使用相对路径，通过反向代理访问
    TIMEOUT: 10000,
  },
  
  // 应用配置
  APP: {
    NAME: process.env.NEXT_PUBLIC_APP_NAME || '短期冲刺管理App',
    URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Firebase配置
  FIREBASE: {
    API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  },
  
  // AI配置
  AI: {
    GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  }
} as const

/**
 * 获取当前环境的显示名称
 */
export function getEnvironmentName(): string {
  if (ENV_CONFIG.IS_DEVELOPMENT) {
    return ENV_CONFIG.FIREBASE_EMULATOR.ENABLED ? '开发环境 (模拟器)' : '开发环境'
  }
  return '生产环境'
}

/**
 * 验证必需的环境变量
 */
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const config = ENV_CONFIG.FIREBASE
  const requiredFields = [
    { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: config.API_KEY },
    { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: config.AUTH_DOMAIN },
    { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: config.PROJECT_ID },
    { name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: config.STORAGE_BUCKET },
    { name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: config.MESSAGING_SENDER_ID },
    { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: config.APP_ID }
  ]

  const missingVars = requiredFields
    .filter(field => !field.value)
    .map(field => field.name)

  return {
    isValid: missingVars.length === 0,
    missingVars
  }
}

/**
 * 打印当前环境配置信息
 */
export function logEnvironmentInfo(): void {
  console.log('🌍 环境配置信息:')
  console.log(`  - 环境: ${getEnvironmentName()}`)
  console.log(`  - NODE_ENV: ${ENV_CONFIG.NODE_ENV}`)
  console.log(`  - Firebase模拟器: ${ENV_CONFIG.FIREBASE_EMULATOR.ENABLED ? '启用' : '禁用'}`)
  console.log(`  - API基础URL: ${ENV_CONFIG.API.BASE_URL}`)
  
  if (ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
    console.log('🔥 Firebase模拟器端口:')
    console.log(`  - Auth: ${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`)
    console.log(`  - Firestore: ${ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT}`)
    console.log(`  - Functions: ${ENV_CONFIG.FIREBASE_EMULATOR.FUNCTIONS_PORT}`)
    console.log(`  - UI: http://127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.UI_PORT}`)
  }
  
  const validation = validateEnvironment()
  if (!validation.isValid) {
    console.warn('⚠️ 缺少必需的环境变量:', validation.missingVars)
  } else {
    console.log('✅ 所有必需的环境变量已配置')
  }
}
