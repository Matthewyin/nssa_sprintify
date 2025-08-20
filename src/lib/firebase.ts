// Firebase配置和初始化

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, Messaging, isSupported } from 'firebase/messaging'
import { ENV_CONFIG, logEnvironmentInfo } from './env-config'

// Firebase配置 - 直接使用环境变量以避免客户端访问问题
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQVuM1XSbFw_x3IQ0ZV98XwCWGbgFhIGM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "n8n-project-460516.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "n8n-project-460516",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "n8n-project-460516.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "18068529376",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:18068529376:web:d1fe5d7e4e53c2817a3085",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// 打印环境配置信息（仅在客户端）
if (typeof window !== 'undefined') {
  setTimeout(() => {
    // 临时禁用环境变量验证，直接打印基本信息
    console.log('🔧 Firebase配置状态:')
    console.log(`  - NODE_ENV: ${ENV_CONFIG.NODE_ENV}`)
    console.log(`  - Firebase模拟器: ${ENV_CONFIG.FIREBASE_EMULATOR.ENABLED ? '启用' : '禁用'}`)
    console.log(`  - API基础URL: ${ENV_CONFIG.API.BASE_URL}`)
    console.log('✅ Firebase配置已加载（跳过详细验证）')
  }, 100)
}

// 在开发环境中设置模拟器环境变量（必须在初始化之前）
if (typeof window !== 'undefined' && ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
  console.log('🔧 开发环境：设置模拟器环境变量')
  // 强制设置环境变量
  if (typeof process !== 'undefined' && process.env) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`
    process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT}`
    console.log('  - Auth模拟器:', process.env.FIREBASE_AUTH_EMULATOR_HOST)
    console.log('  - Firestore模拟器:', process.env.FIRESTORE_EMULATOR_HOST)
  }
}

// 初始化Firebase应用
let app: FirebaseApp
try {
  if (getApps().length === 0) {
    // 只有在配置有效时才初始化
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig)
      console.log('Firebase应用初始化成功')
    } else {
      throw new Error('Firebase配置不完整')
    }
  } else {
    app = getApps()[0]
  }
} catch (error) {
  console.error('Firebase初始化失败:', error)
  // 创建一个空的应用实例作为fallback
  throw error
}

// 初始化Firebase服务
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const functions: Functions = getFunctions(app)

// 检查是否需要强制重置Firebase连接
let needsReset = false
if (typeof window !== 'undefined' && ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
  // 检查localStorage中是否有重置标记
  const resetFlag = localStorage.getItem('firebase-needs-reset')
  if (resetFlag === 'true') {
    needsReset = true
    localStorage.removeItem('firebase-needs-reset')
  }
}

// 在客户端连接模拟器（在服务初始化之后）
if (typeof window !== 'undefined') {
  if (ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
    console.log('🔥 开发环境：连接Firebase模拟器')
    console.log(`  - Auth端口: ${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`)
    console.log(`  - Firestore端口: ${ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT}`)
    console.log(`  - Functions端口: ${ENV_CONFIG.FIREBASE_EMULATOR.FUNCTIONS_PORT}`)

    try {
      // 连接Auth模拟器
      connectAuthEmulator(auth, `http://127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`, { disableWarnings: true })
      console.log('✅ Auth模拟器连接成功')

      // 连接Firestore模拟器
      connectFirestoreEmulator(db, '127.0.0.1', ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT)
      console.log('✅ Firestore模拟器连接成功')

      // 连接Functions模拟器
      connectFunctionsEmulator(functions, '127.0.0.1', ENV_CONFIG.FIREBASE_EMULATOR.FUNCTIONS_PORT)
      console.log('✅ Functions模拟器连接成功')

      console.log('🎉 Firebase模拟器套件连接成功')
      console.log(`📱 模拟器UI: http://127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.UI_PORT}`)

      // 设置成功连接标记
      localStorage.setItem('firebase-emulator-connected', 'true')
    } catch (error) {
      console.error('❌ Firebase模拟器连接失败:', error)
      console.log('请确保Firebase模拟器正在运行: firebase emulators:start')
      console.log('如果仍然连接到错误端口，请清除浏览器缓存并刷新页面')

      // 设置需要重置标记
      localStorage.setItem('firebase-needs-reset', 'true')
    }
  } else {
    console.log('🌐 生产环境：使用真实Firebase服务')
  }
} else {
  console.log('🖥️ 服务器端环境，Firebase将根据环境自动配置')
}

// 初始化Firebase Messaging（仅在支持的环境中）
let messaging: Messaging | null = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
    }
  })
}

export { messaging }

// 导出Firebase应用实例
export default app

// 环境变量验证
export function validateFirebaseConfig(): boolean {
  // 直接检查配置对象而不是环境变量
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  }

  const missingKeys = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration values:', missingKeys)
    console.log('Current config:', config)
    return false
  }

  console.log('✅ Firebase配置验证通过')
  return true
}

// Firebase连接状态检查
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    // 尝试连接Firestore
    const { connectFirestoreEmulator, enableNetwork } = await import('firebase/firestore')
    
    // 在开发环境中，可以连接到模拟器
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080)
      } catch (error) {
        // 模拟器可能已经连接，忽略错误
      }
    }
    
    await enableNetwork(db)
    return true
  } catch (error) {
    console.error('Firebase connection failed:', error)
    return false
  }
}
