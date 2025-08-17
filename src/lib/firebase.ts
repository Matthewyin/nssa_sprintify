// Firebase配置和初始化

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, Messaging, isSupported } from 'firebase/messaging'
import { logFirebaseConfig } from './firebase-diagnostics'

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// 验证配置（延迟执行，确保环境变量已加载）
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const isValid = validateFirebaseConfig()
    if (!isValid) {
      console.warn('Firebase配置无效，某些功能可能无法正常工作')
    }
  }, 100)
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

// 临时禁用模拟器，使用生产环境进行测试
console.log('🔥 临时使用生产环境Firebase（用于测试Sprint创建功能）')

/*
// 在客户端环境中同步连接到模拟器
if (typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {

  console.log('🔍 检查模拟器连接条件:')
  console.log('  - 客户端环境: ✅')
  console.log('  - NODE_ENV:', process.env.NODE_ENV)
  console.log('  - USE_FIREBASE_EMULATOR:', process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR)
  console.log('🚀 开始同步连接Firebase模拟器...')

  try {
    // 同步连接Auth模拟器
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    console.log('✅ Auth模拟器连接成功')

    // 同步连接Firestore模拟器
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    console.log('✅ Firestore模拟器连接成功')

    // 同步连接Functions模拟器
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    console.log('✅ Functions模拟器连接成功')

    console.log('🎉 Firebase模拟器套件连接成功')
  } catch (error) {
    console.log('Firebase模拟器连接状态:', error instanceof Error ? error.message : '未知错误')
  }
} else if (typeof window !== 'undefined') {
  console.log('❌ 客户端模拟器连接条件不满足，使用生产环境')
*/

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
