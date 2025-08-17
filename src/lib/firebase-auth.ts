// Firebase认证服务

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { initializeUserData } from './firebase-init'
import type { User, UserType } from '@/types'

/**
 * 用户注册
 */
export async function registerUser(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User; firebaseUser: FirebaseUser }> {
  try {
    // 创建Firebase用户
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    const firebaseUser = userCredential.user

    // 更新用户显示名称
    if (displayName) {
      await updateProfile(firebaseUser, { displayName })
    }

    // 发送邮箱验证
    await sendEmailVerification(firebaseUser)

    // 创建用户文档
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: displayName || firebaseUser.email!.split('@')[0],
      userType: 'normal' as UserType,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 保存到Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // 初始化用户数据结构
    await initializeUserData(firebaseUser.uid, {
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      userType: user.userType
    })

    return { user, firebaseUser }
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; firebaseUser: FirebaseUser }> {
  try {
    // Firebase登录
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    const firebaseUser = userCredential.user

    // 获取用户文档
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

    let userData: any
    let user: User

    if (!userDoc.exists()) {
      // 如果用户文档不存在，创建一个新的
      console.log('用户文档不存在，正在创建...')

      const newUserData = {
        displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        userType: 'normal' as UserType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }

      // 创建用户文档
      await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)

      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: newUserData.displayName,
        userType: newUserData.userType,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } else {
      // 用户文档存在，使用现有数据
      userData = userDoc.data()
      user = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        userType: userData.userType || 'normal',
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date()
      }

      // 更新最后登录时间
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }

    return { user, firebaseUser }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * 用户登出
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

/**
 * 重置密码
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Password reset error:', error)
    throw error
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  try {
    // 更新Firebase用户资料
    if (auth.currentUser && updates.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName
      })
    }

    // 更新Firestore用户文档
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Profile update error:', error)
    throw error
  }
}

/**
 * 获取用户数据
 */
export async function getUserData(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))

    if (!userDoc.exists()) {
      console.warn(`用户文档不存在: ${userId}`)
      return null
    }

    const userData = userDoc.data()
    return {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      userType: userData.userType || 'normal',
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date()
    }
  } catch (error) {
    console.error('获取用户数据失败:', error)
    // 重新抛出错误，让调用者处理
    throw error
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * 检查用户是否已验证邮箱
 */
export function isEmailVerified(): boolean {
  return auth.currentUser?.emailVerified || false
}

/**
 * 重新发送邮箱验证
 */
export async function resendEmailVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser)
  } else {
    throw new Error('用户未登录')
  }
}

/**
 * 检查用户权限
 */
export async function checkUserPermission(
  userId: string,
  requiredType: UserType
): Promise<boolean> {
  try {
    const userData = await getUserData(userId)
    if (!userData) return false

    const typeHierarchy: Record<UserType, number> = {
      normal: 1,
      premium: 2,
      admin: 3
    }

    return typeHierarchy[userData.userType] >= typeHierarchy[requiredType]
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * 匿名登录（用于测试模拟器）
 */
export async function loginAnonymously(): Promise<{ user: User; firebaseUser: FirebaseUser }> {
  try {
    console.log('🔥 开始匿名登录...')
    const userCredential: UserCredential = await signInAnonymously(auth)
    const firebaseUser = userCredential.user

    console.log('✅ 匿名登录成功，用户ID:', firebaseUser.uid)

    // 获取token并检查长度
    const token = await firebaseUser.getIdToken()
    console.log('🔍 Token长度:', token.length)
    console.log('🔍 Token前50字符:', token.substring(0, 50))

    // 创建用户对象
    const user: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || `anonymous-${firebaseUser.uid}@example.com`,
      displayName: firebaseUser.displayName || '匿名用户',
      userType: 'normal',
      createdAt: new Date(),
      updatedAt: new Date(),
      isEmailVerified: false
    }

    console.log('✅ 匿名用户对象创建成功')
    return { user, firebaseUser }
  } catch (error) {
    console.error('❌ 匿名登录失败:', error)
    throw error
  }
}
