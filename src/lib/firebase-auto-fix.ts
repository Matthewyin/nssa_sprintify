/**
 * Firebase自动修复工具
 * 检测并自动修复模拟器连接问题
 */


import { auth } from './firebase'
import { resetFirebaseWithEmulator } from './firebase-reset'

let isFixing = false
let fixedAuth: any = null

/**
 * 检测Firebase连接是否正常
 */
async function testFirebaseConnection(): Promise<boolean> {
  try {
    // 直接测试端口连接，而不是使用Firebase SDK
    const response = await fetch('http://127.0.0.1:9098/identitytoolkit.googleapis.com/v1/projects/n8n-project-460516/accounts:signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    })

    // 如果能连接到9098端口，说明模拟器正常
    if (response.status === 400 || response.ok) {
      console.log('🔍 Firebase模拟器连接正常 (9098端口)')
      return true
    }

    console.log('🔍 Firebase模拟器响应异常:', response.status)
    return false
  } catch (error: any) {
    console.log('🔍 Firebase模拟器连接失败:', error.message)
    return false
  }
}

/**
 * 自动修复Firebase连接
 */
async function autoFixFirebase(): Promise<any> {
  if (isFixing) {
    console.log('🔄 Firebase修复正在进行中...')
    return fixedAuth
  }
  
  isFixing = true
  console.log('🔧 开始自动修复Firebase连接...')
  
  try {
    const { auth: newAuth } = await resetFirebaseWithEmulator()
    fixedAuth = newAuth
    console.log('✅ Firebase自动修复成功')
    return newAuth
  } catch (error) {
    console.error('❌ Firebase自动修复失败:', error)
    throw error
  } finally {
    isFixing = false
  }
}

/**
 * 获取可用的Auth实例（自动修复）
 */
export async function getWorkingAuth() {
  // 如果已经有修复后的实例，直接返回
  if (fixedAuth) {
    return fixedAuth
  }
  
  // 测试当前连接
  const isWorking = await testFirebaseConnection()
  if (isWorking) {
    return auth
  }
  
  // 连接有问题，尝试自动修复
  console.log('🔧 检测到Firebase连接问题，开始自动修复...')
  return await autoFixFirebase()
}



/**
 * 重置修复状态（用于测试）
 */
export function resetFixState() {
  isFixing = false
  fixedAuth = null
}
