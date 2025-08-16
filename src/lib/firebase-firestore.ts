// Firestore数据库操作服务

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import type { 
  Sprint, 
  Task, 
  UserSettings, 
  AIUsage, 
  UserStats,
  Phase,
  Milestone 
} from '@/types'

// 集合引用
export const collections = {
  users: 'users',
  sprints: 'sprints',
  tasks: 'tasks',
  settings: 'settings',
  aiUsage: 'aiUsage',
  stats: 'stats',
  phases: 'phases',
  milestones: 'milestones'
} as const

/**
 * 冲刺计划相关操作
 */
export class SprintService {
  /**
   * 创建冲刺计划
   */
  static async createSprint(userId: string, sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const sprintRef = doc(collection(db, `users/${userId}/sprints`))
      const sprint: Sprint = {
        ...sprintData,
        id: sprintRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(sprintRef, {
        ...sprint,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return sprintRef.id
    } catch (error) {
      console.error('Create sprint error:', error)
      throw error
    }
  }

  /**
   * 获取用户的冲刺计划列表
   */
  static async getUserSprints(userId: string): Promise<Sprint[]> {
    try {
      const sprintsRef = collection(db, `users/${userId}/sprints`)
      const q = query(sprintsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date()
      })) as Sprint[]
    } catch (error) {
      console.error('Get user sprints error:', error)
      throw error
    }
  }

  /**
   * 获取单个冲刺计划
   */
  static async getSprint(userId: string, sprintId: string): Promise<Sprint | null> {
    try {
      const sprintRef = doc(db, `users/${userId}/sprints`, sprintId)
      const snapshot = await getDoc(sprintRef)
      
      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        ...data,
        id: snapshot.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date()
      } as Sprint
    } catch (error) {
      console.error('Get sprint error:', error)
      throw error
    }
  }

  /**
   * 更新冲刺计划
   */
  static async updateSprint(userId: string, sprintId: string, updates: Partial<Sprint>): Promise<void> {
    try {
      const sprintRef = doc(db, `users/${userId}/sprints`, sprintId)
      await updateDoc(sprintRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Update sprint error:', error)
      throw error
    }
  }

  /**
   * 删除冲刺计划
   */
  static async deleteSprint(userId: string, sprintId: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      // 删除冲刺计划
      const sprintRef = doc(db, `users/${userId}/sprints`, sprintId)
      batch.delete(sprintRef)
      
      // 删除相关任务
      const tasksRef = collection(db, `users/${userId}/sprints/${sprintId}/tasks`)
      const tasksSnapshot = await getDocs(tasksRef)
      tasksSnapshot.docs.forEach(taskDoc => {
        batch.delete(taskDoc.ref)
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Delete sprint error:', error)
      throw error
    }
  }

  /**
   * 监听冲刺计划变化
   */
  static onSprintChange(
    userId: string, 
    sprintId: string, 
    callback: (sprint: Sprint | null) => void
  ): Unsubscribe {
    const sprintRef = doc(db, `users/${userId}/sprints`, sprintId)
    return onSnapshot(sprintRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        const sprint: Sprint = {
          ...data,
          id: snapshot.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date()
        } as Sprint
        callback(sprint)
      } else {
        callback(null)
      }
    })
  }
}

/**
 * 任务相关操作
 */
export class TaskService {
  /**
   * 创建任务
   */
  static async createTask(
    userId: string, 
    sprintId: string, 
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const taskRef = doc(collection(db, `users/${userId}/sprints/${sprintId}/tasks`))
      const task: Task = {
        ...taskData,
        id: taskRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(taskRef, {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return taskRef.id
    } catch (error) {
      console.error('Create task error:', error)
      throw error
    }
  }

  /**
   * 获取冲刺的任务列表
   */
  static async getSprintTasks(userId: string, sprintId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, `users/${userId}/sprints/${sprintId}/tasks`)
      const q = query(tasksRef, orderBy('createdAt', 'asc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        dueDate: doc.data().dueDate?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      })) as Task[]
    } catch (error) {
      console.error('Get sprint tasks error:', error)
      throw error
    }
  }

  /**
   * 更新任务
   */
  static async updateTask(
    userId: string, 
    sprintId: string, 
    taskId: string, 
    updates: Partial<Task>
  ): Promise<void> {
    try {
      const taskRef = doc(db, `users/${userId}/sprints/${sprintId}/tasks`, taskId)
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Update task error:', error)
      throw error
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(userId: string, sprintId: string, taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, `users/${userId}/sprints/${sprintId}/tasks`, taskId)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Delete task error:', error)
      throw error
    }
  }
}

/**
 * 用户设置相关操作
 */
export class SettingsService {
  /**
   * 获取用户设置
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settingsRef = doc(db, `users/${userId}/settings`, 'preferences')
      const snapshot = await getDoc(settingsRef)
      
      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserSettings
    } catch (error) {
      console.error('Get user settings error:', error)
      throw error
    }
  }

  /**
   * 更新用户设置
   */
  static async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    try {
      const settingsRef = doc(db, `users/${userId}/settings`, 'preferences')
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (error) {
      console.error('Update user settings error:', error)
      throw error
    }
  }
}

/**
 * AI使用统计相关操作
 */
export class AIUsageService {
  /**
   * 获取今日AI使用情况
   */
  static async getTodayUsage(userId: string): Promise<AIUsage | null> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const usageRef = doc(db, `users/${userId}/aiUsage`, today)
      const snapshot = await getDoc(usageRef)
      
      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      return {
        ...data,
        resetAt: data.resetAt?.toDate() || new Date()
      } as AIUsage
    } catch (error) {
      console.error('Get today usage error:', error)
      throw error
    }
  }

  /**
   * 增加AI使用次数
   */
  static async incrementUsage(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const usageRef = doc(db, `users/${userId}/aiUsage`, today)
      
      await runTransaction(db, async (transaction) => {
        const usageDoc = await transaction.get(usageRef)
        
        if (usageDoc.exists()) {
          const currentCount = usageDoc.data().count || 0
          transaction.update(usageRef, {
            count: currentCount + 1,
            updatedAt: serverTimestamp()
          })
        } else {
          // 创建新的使用记录
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(0, 0, 0, 0)
          
          transaction.set(usageRef, {
            userId,
            date: today,
            count: 1,
            limit: 5, // 默认限制
            resetAt: tomorrow,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
      })
    } catch (error) {
      console.error('Increment usage error:', error)
      throw error
    }
  }
}
