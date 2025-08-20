/**
 * Firebase重置工具
 * 用于解决模拟器端口缓存问题
 */

import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'
import { ENV_CONFIG } from './env-config'

// Firebase配置
const firebaseConfig = {
  apiKey: ENV_CONFIG.FIREBASE.API_KEY,
  authDomain: ENV_CONFIG.FIREBASE.AUTH_DOMAIN,
  projectId: ENV_CONFIG.FIREBASE.PROJECT_ID,
  storageBucket: ENV_CONFIG.FIREBASE.STORAGE_BUCKET,
  messagingSenderId: ENV_CONFIG.FIREBASE.MESSAGING_SENDER_ID,
  appId: ENV_CONFIG.FIREBASE.APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

/**
 * 强制重置Firebase应用并重新连接模拟器
 */
export async function resetFirebaseWithEmulator() {
  console.log('🔄 强制重置Firebase应用...')
  
  try {
    // 删除所有现有的Firebase应用
    const existingApps = getApps()
    for (const app of existingApps) {
      await deleteApp(app)
      console.log('🗑️ 删除现有Firebase应用')
    }
    
    // 清除浏览器中的Firebase相关存储
    if (typeof window !== 'undefined') {
      // 清除localStorage中的Firebase数据
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('firebase:') || key.includes('firebaseLocalStorageDb'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log('🧹 清除Firebase localStorage数据')
      
      // 清除sessionStorage中的Firebase数据
      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('firebase:')) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
      console.log('🧹 清除Firebase sessionStorage数据')
    }
    
    // 设置模拟器环境变量
    if (ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
      if (typeof process !== 'undefined' && process.env) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`
        process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT}`
        console.log('🔧 设置模拟器环境变量')
      }
    }
    
    // 重新初始化Firebase应用
    const app = initializeApp(firebaseConfig, 'reset-app-' + Date.now())
    console.log('✅ Firebase应用重新初始化成功')
    
    // 获取服务实例
    const auth = getAuth(app)
    const db = getFirestore(app)
    const functions = getFunctions(app)
    
    // 连接模拟器
    if (ENV_CONFIG.FIREBASE_EMULATOR.ENABLED) {
      console.log('🔥 连接Firebase模拟器...')
      
      // 连接Auth模拟器
      connectAuthEmulator(auth, `http://127.0.0.1:${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`, { disableWarnings: true })
      console.log(`✅ Auth模拟器连接成功: ${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`)
      
      // 连接Firestore模拟器
      connectFirestoreEmulator(db, '127.0.0.1', ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT)
      console.log(`✅ Firestore模拟器连接成功: ${ENV_CONFIG.FIREBASE_EMULATOR.FIRESTORE_PORT}`)
      
      // 连接Functions模拟器
      connectFunctionsEmulator(functions, '127.0.0.1', ENV_CONFIG.FIREBASE_EMULATOR.FUNCTIONS_PORT)
      console.log(`✅ Functions模拟器连接成功: ${ENV_CONFIG.FIREBASE_EMULATOR.FUNCTIONS_PORT}`)
      
      console.log('🎉 Firebase模拟器套件重新连接成功')
    }
    
    return { app, auth, db, functions }
    
  } catch (error) {
    console.error('❌ Firebase重置失败:', error)
    throw error
  }
}

/**
 * 检查当前Auth模拟器连接状态
 */
export function checkAuthEmulatorConnection(auth: Auth): boolean {
  try {
    // 检查auth配置中的模拟器设置
    const config = (auth as any)._config
    if (config && config.emulator) {
      console.log('🔍 当前Auth模拟器配置:', config.emulator)
      return config.emulator.url.includes(`${ENV_CONFIG.FIREBASE_EMULATOR.AUTH_PORT}`)
    }
    return false
  } catch (error) {
    console.log('🔍 无法检查Auth模拟器连接状态')
    return false
  }
}
