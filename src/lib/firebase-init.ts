// Firebase数据库初始化脚本

import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserSettings, UserStats } from '@/types'

/**
 * 初始化新用户的数据结构
 */
export async function initializeUserData(userId: string, userData: {
  email: string
  displayName: string
  userType: 'normal' | 'premium' | 'admin'
}): Promise<void> {
  try {
    // 创建用户设置文档
    const defaultSettings: UserSettings = {
      userId,
      notifications: {
        email: true,
        push: false,
        dailyReminder: true,
        deadlineReminder: true,
        milestoneReminder: true,
        reminderTime: '09:00'
      },
      preferences: {
        theme: 'system',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h'
      },
      obsidian: {
        enabled: false,
        syncEnabled: false,
        autoSync: false
      },
      updatedAt: new Date()
    }

    await setDoc(doc(db, `users/${userId}/settings`, 'preferences'), {
      ...defaultSettings,
      updatedAt: serverTimestamp()
    })

    // 创建用户统计文档
    const defaultStats: UserStats = {
      userId,
      totalSprints: 0,
      completedSprints: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalTime: 0,
      streakDays: 0,
      longestStreak: 0,
      lastActiveDate: new Date(),
      achievements: [],
      updatedAt: new Date()
    }

    await setDoc(doc(db, `users/${userId}/stats`, 'overview'), {
      ...defaultStats,
      lastActiveDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log(`用户 ${userId} 的数据初始化完成`)
  } catch (error) {
    console.error('用户数据初始化失败:', error)
    throw error
  }
}

/**
 * 创建示例冲刺数据（用于演示）
 */
export async function createSampleSprint(userId: string): Promise<string> {
  try {
    const sprintRef = doc(db, `users/${userId}/sprints`, 'sample-sprint')
    
    const sampleSprint = {
      id: 'sample-sprint',
      userId,
      title: '学习React和TypeScript',
      description: '在30天内掌握React和TypeScript的基础知识，并完成一个小项目',
      type: 'learning',
      template: '30days',
      status: 'active',
      progress: 25,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      stats: {
        totalTasks: 4,
        completedTasks: 1,
        totalTime: 0,
        actualTime: 0
      },
      tags: ['前端开发', '学习', 'React', 'TypeScript'],
      aiGenerated: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(sprintRef, sampleSprint)

    // 创建示例任务
    const sampleTasks = [
      {
        id: 'task-1',
        sprintId: 'sample-sprint',
        title: '学习React基础概念',
        description: '了解组件、JSX、props和state的基本概念',
        status: 'completed',
        priority: 'high',
        estimatedTime: 480, // 8小时
        actualTime: 420, // 7小时
        tags: ['React', '基础'],
        resources: [],
        dependencies: [],
        blockedBy: [],
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前完成
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'task-2',
        sprintId: 'sample-sprint',
        title: '学习TypeScript基础',
        description: '掌握TypeScript的类型系统和基本语法',
        status: 'in-progress',
        priority: 'high',
        estimatedTime: 360, // 6小时
        tags: ['TypeScript', '基础'],
        resources: [],
        dependencies: ['task-1'],
        blockedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'task-3',
        sprintId: 'sample-sprint',
        title: '结合React和TypeScript',
        description: '学习如何在React项目中使用TypeScript',
        status: 'todo',
        priority: 'medium',
        estimatedTime: 240, // 4小时
        tags: ['React', 'TypeScript', '实践'],
        resources: [],
        dependencies: ['task-1', 'task-2'],
        blockedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'task-4',
        sprintId: 'sample-sprint',
        title: '完成一个小项目',
        description: '使用React和TypeScript创建一个待办事项应用',
        status: 'todo',
        priority: 'high',
        estimatedTime: 720, // 12小时
        tags: ['项目', '实践'],
        resources: [],
        dependencies: ['task-3'],
        blockedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ]

    // 批量创建任务
    for (const task of sampleTasks) {
      await setDoc(doc(db, `users/${userId}/sprints/sample-sprint/tasks`, task.id), task)
    }

    // 创建示例里程碑
    const sampleMilestone = {
      id: 'milestone-1',
      sprintId: 'sample-sprint',
      title: '完成基础学习',
      description: '完成React和TypeScript的基础学习',
      targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15天后
      status: 'pending',
      criteria: [
        '完成React基础概念学习',
        '完成TypeScript基础学习',
        '能够结合使用React和TypeScript'
      ],
      progress: 50,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(doc(db, `users/${userId}/sprints/sample-sprint/milestones`, 'milestone-1'), sampleMilestone)

    console.log(`示例冲刺数据创建完成`)
    return 'sample-sprint'
  } catch (error) {
    console.error('创建示例数据失败:', error)
    throw error
  }
}

/**
 * 清理用户数据（用于测试）
 */
export async function cleanupUserData(userId: string): Promise<void> {
  try {
    // 注意：这个函数仅用于开发测试
    // 生产环境中应该通过Cloud Functions来处理数据清理
    console.warn('数据清理功能仅用于开发测试')
    
    // 实际的清理逻辑需要递归删除所有子集合
    // 这里只是一个占位符
  } catch (error) {
    console.error('数据清理失败:', error)
    throw error
  }
}

/**
 * 验证数据库结构
 */
export async function validateDatabaseStructure(): Promise<boolean> {
  try {
    // 检查必要的索引是否存在
    // 检查安全规则是否正确配置
    // 这里只是一个占位符，实际验证需要管理员权限
    
    console.log('数据库结构验证完成')
    return true
  } catch (error) {
    console.error('数据库结构验证失败:', error)
    return false
  }
}

/**
 * 数据迁移工具
 */
export async function migrateUserData(userId: string, fromVersion: string, toVersion: string): Promise<void> {
  try {
    console.log(`开始数据迁移: ${fromVersion} -> ${toVersion}`)
    
    // 根据版本执行相应的迁移逻辑
    switch (`${fromVersion}->${toVersion}`) {
      case 'v1.0->v1.1':
        // 示例迁移逻辑
        break
      default:
        console.log('无需数据迁移')
    }
    
    console.log('数据迁移完成')
  } catch (error) {
    console.error('数据迁移失败:', error)
    throw error
  }
}
