'use client'

import { useEffect } from 'react'
import { auth, db, functions } from '@/lib/firebase'
import { connectAuthEmulator } from 'firebase/auth'
import { connectFirestoreEmulator } from 'firebase/firestore'
import { connectFunctionsEmulator } from 'firebase/functions'

let emulatorInitialized = false

export function FirebaseEmulatorInit() {
  useEffect(() => {
    console.log('🔥🔥🔥 FirebaseEmulatorInit useEffect 执行了！')
    console.log('🔥🔥🔥 当前环境:', {
      window: typeof window,
      NODE_ENV: process.env.NODE_ENV,
      USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
      emulatorInitialized
    })

    if (emulatorInitialized) {
      console.log('🔄 模拟器已初始化，跳过重复连接')
      return
    }

    if (process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      
      console.log('🔍 客户端检查模拟器连接条件:')
      console.log('  - 客户端环境: ✅')
      console.log('  - NODE_ENV:', process.env.NODE_ENV)
      console.log('  - USE_FIREBASE_EMULATOR:', process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR)
      console.log('🚀 客户端开始连接Firebase模拟器...')
      
      try {
        // 连接Auth模拟器
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
        console.log('✅ 客户端Auth模拟器连接成功')

        // 连接Firestore模拟器
        connectFirestoreEmulator(db, '127.0.0.1', 8080)
        console.log('✅ 客户端Firestore模拟器连接成功')

        // 连接Functions模拟器
        connectFunctionsEmulator(functions, '127.0.0.1', 5001)
        console.log('✅ 客户端Functions模拟器连接成功')

        console.log('🎉 客户端Firebase模拟器套件连接成功')
        emulatorInitialized = true
      } catch (error) {
        console.log('客户端Firebase模拟器连接状态:', error instanceof Error ? error.message : '未知错误')
        emulatorInitialized = true // 标记为已尝试，避免重复
      }
    } else {
      console.log('❌ 客户端模拟器连接条件不满足，使用生产环境')
      console.log('  - NODE_ENV:', process.env.NODE_ENV)
      console.log('  - USE_FIREBASE_EMULATOR:', process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR)
    }
  }, [])

  // 这个组件不渲染任何内容
  return null
}

// 导出连接函数供手动调用
export function connectToEmulators() {
  if (emulatorInitialized) {
    console.log('🔄 模拟器已初始化，跳过重复连接')
    return
  }

  if (typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'development' && 
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    
    console.log('🔍 手动检查模拟器连接条件:')
    console.log('  - window:', typeof window !== 'undefined')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - USE_FIREBASE_EMULATOR:', process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR)
    console.log('🚀 手动开始连接Firebase模拟器...')
    
    try {
      // 连接Auth模拟器
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
      console.log('✅ 手动Auth模拟器连接成功')

      // 连接Firestore模拟器
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      console.log('✅ 手动Firestore模拟器连接成功')

      // 连接Functions模拟器
      connectFunctionsEmulator(functions, '127.0.0.1', 5001)
      console.log('✅ 手动Functions模拟器连接成功')

      console.log('🎉 手动Firebase模拟器套件连接成功')
      emulatorInitialized = true
    } catch (error) {
      console.log('手动Firebase模拟器连接状态:', error instanceof Error ? error.message : '未知错误')
      emulatorInitialized = true // 标记为已尝试连接
    }
  } else {
    console.log('❌ 手动模拟器连接条件不满足，使用生产环境')
  }
}
