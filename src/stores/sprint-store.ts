import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Sprint, Task, Phase, Milestone, CreateSprintForm, CreateTaskForm } from '@/types'
import { generateId } from '@/lib/utils'

interface SprintState {
  // 状态
  sprints: Sprint[]
  currentSprint: Sprint | null
  isLoading: boolean
  error: string | null

  // 操作
  createSprint: (sprintData: CreateSprintForm) => Promise<void>
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => Promise<void>
  deleteSprint: (sprintId: string) => Promise<void>
  setCurrentSprint: (sprintId: string | null) => void
  
  // 任务操作
  addTask: (sprintId: string, taskData: CreateTaskForm) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleTaskStatus: (taskId: string) => Promise<void>
  
  // 阶段操作
  addPhase: (sprintId: string, phase: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePhase: (phaseId: string, updates: Partial<Phase>) => Promise<void>
  deletePhase: (phaseId: string) => Promise<void>
  
  // 里程碑操作
  addMilestone: (sprintId: string, milestone: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMilestone: (milestoneId: string, updates: Partial<Milestone>) => Promise<void>
  deleteMilestone: (milestoneId: string) => Promise<void>
  
  // 工具方法
  getSprint: (sprintId: string) => Sprint | undefined
  getActiveSprints: () => Sprint[]
  getCompletedSprints: () => Sprint[]
  calculateSprintProgress: (sprintId: string) => number
  clearError: () => void
  
  // 初始化
  loadSprints: () => Promise<void>
}

export const useSprintStore = create<SprintState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sprints: [],
      currentSprint: null,
      isLoading: false,
      error: null,

      // 创建冲刺
      createSprint: async (sprintData: CreateSprintForm) => {
        set({ isLoading: true, error: null })
        
        try {
          const newSprint: Sprint = {
            id: generateId(),
            userId: 'current-user-id', // TODO: 从auth store获取
            title: sprintData.title,
            description: sprintData.description,
            type: sprintData.type,
            template: sprintData.template,
            startDate: sprintData.startDate,
            endDate: new Date(sprintData.startDate.getTime() + getDurationByTemplate(sprintData.template)),
            status: 'draft',
            progress: 0,
            tasks: [],
            phases: [],
            milestones: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set(state => ({
            sprints: [...state.sprints, newSprint],
            currentSprint: newSprint,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '创建冲刺失败', 
            isLoading: false 
          })
        }
      },

      // 更新冲刺
      updateSprint: async (sprintId: string, updates: Partial<Sprint>) => {
        set({ isLoading: true, error: null })
        
        try {
          set(state => ({
            sprints: state.sprints.map(sprint =>
              sprint.id === sprintId
                ? { ...sprint, ...updates, updatedAt: new Date() }
                : sprint
            ),
            currentSprint: state.currentSprint?.id === sprintId
              ? { ...state.currentSprint, ...updates, updatedAt: new Date() }
              : state.currentSprint,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新冲刺失败', 
            isLoading: false 
          })
        }
      },

      // 删除冲刺
      deleteSprint: async (sprintId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          set(state => ({
            sprints: state.sprints.filter(sprint => sprint.id !== sprintId),
            currentSprint: state.currentSprint?.id === sprintId ? null : state.currentSprint,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '删除冲刺失败', 
            isLoading: false 
          })
        }
      },

      // 设置当前冲刺
      setCurrentSprint: (sprintId: string | null) => {
        const { sprints } = get()
        const sprint = sprintId ? sprints.find(s => s.id === sprintId) : null
        set({ currentSprint: sprint || null })
      },

      // 添加任务
      addTask: async (sprintId: string, taskData: CreateTaskForm) => {
        set({ isLoading: true, error: null })
        
        try {
          const newTask: Task = {
            id: generateId(),
            sprintId,
            title: taskData.title,
            description: taskData.description,
            status: 'todo',
            priority: taskData.priority,
            estimatedTime: taskData.estimatedTime,
            dueDate: taskData.dueDate,
            tags: taskData.tags,
            resources: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set(state => ({
            sprints: state.sprints.map(sprint =>
              sprint.id === sprintId
                ? { ...sprint, tasks: [...sprint.tasks, newTask], updatedAt: new Date() }
                : sprint
            ),
            currentSprint: state.currentSprint?.id === sprintId
              ? { ...state.currentSprint, tasks: [...state.currentSprint.tasks, newTask], updatedAt: new Date() }
              : state.currentSprint,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '添加任务失败', 
            isLoading: false 
          })
        }
      },

      // 更新任务
      updateTask: async (taskId: string, updates: Partial<Task>) => {
        set({ isLoading: true, error: null })
        
        try {
          set(state => ({
            sprints: state.sprints.map(sprint => ({
              ...sprint,
              tasks: sprint.tasks.map(task =>
                task.id === taskId
                  ? { ...task, ...updates, updatedAt: new Date() }
                  : task
              ),
              updatedAt: new Date()
            })),
            currentSprint: state.currentSprint ? {
              ...state.currentSprint,
              tasks: state.currentSprint.tasks.map(task =>
                task.id === taskId
                  ? { ...task, ...updates, updatedAt: new Date() }
                  : task
              ),
              updatedAt: new Date()
            } : null,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '更新任务失败', 
            isLoading: false 
          })
        }
      },

      // 删除任务
      deleteTask: async (taskId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          set(state => ({
            sprints: state.sprints.map(sprint => ({
              ...sprint,
              tasks: sprint.tasks.filter(task => task.id !== taskId),
              updatedAt: new Date()
            })),
            currentSprint: state.currentSprint ? {
              ...state.currentSprint,
              tasks: state.currentSprint.tasks.filter(task => task.id !== taskId),
              updatedAt: new Date()
            } : null,
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '删除任务失败', 
            isLoading: false 
          })
        }
      },

      // 切换任务状态
      toggleTaskStatus: async (taskId: string) => {
        const { sprints } = get()
        const task = sprints.flatMap(s => s.tasks).find(t => t.id === taskId)
        
        if (task) {
          const newStatus = task.status === 'completed' ? 'todo' : 'completed'
          const updates: Partial<Task> = {
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date() : undefined
          }
          
          await get().updateTask(taskId, updates)
        }
      },

      // 添加阶段
      addPhase: async (sprintId: string, phaseData: Omit<Phase, 'id' | 'createdAt' | 'updatedAt'>) => {
        // TODO: 实现阶段添加逻辑
      },

      // 更新阶段
      updatePhase: async (phaseId: string, updates: Partial<Phase>) => {
        // TODO: 实现阶段更新逻辑
      },

      // 删除阶段
      deletePhase: async (phaseId: string) => {
        // TODO: 实现阶段删除逻辑
      },

      // 添加里程碑
      addMilestone: async (sprintId: string, milestoneData: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => {
        // TODO: 实现里程碑添加逻辑
      },

      // 更新里程碑
      updateMilestone: async (milestoneId: string, updates: Partial<Milestone>) => {
        // TODO: 实现里程碑更新逻辑
      },

      // 删除里程碑
      deleteMilestone: async (milestoneId: string) => {
        // TODO: 实现里程碑删除逻辑
      },

      // 获取冲刺
      getSprint: (sprintId: string) => {
        const { sprints } = get()
        return sprints.find(sprint => sprint.id === sprintId)
      },

      // 获取活跃冲刺
      getActiveSprints: () => {
        const { sprints } = get()
        return sprints.filter(sprint => sprint.status === 'active')
      },

      // 获取已完成冲刺
      getCompletedSprints: () => {
        const { sprints } = get()
        return sprints.filter(sprint => sprint.status === 'completed')
      },

      // 计算冲刺进度
      calculateSprintProgress: (sprintId: string) => {
        const sprint = get().getSprint(sprintId)
        if (!sprint || sprint.tasks.length === 0) return 0
        
        const completedTasks = sprint.tasks.filter(task => task.status === 'completed').length
        return Math.round((completedTasks / sprint.tasks.length) * 100)
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 加载冲刺数据
      loadSprints: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // TODO: 从Firebase加载数据
          // const sprints = await loadSprintsFromFirebase()
          
          set({ isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '加载数据失败', 
            isLoading: false 
          })
        }
      }
    }),
    {
      name: 'sprint-storage',
      partialize: (state) => ({ 
        sprints: state.sprints, 
        currentSprint: state.currentSprint 
      }),
    }
  )
)

// 工具函数：根据模板获取持续时间（毫秒）
function getDurationByTemplate(template: string): number {
  const durations = {
    '7days': 7 * 24 * 60 * 60 * 1000,
    '21days': 21 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
    '60days': 60 * 24 * 60 * 60 * 1000,
    '90days': 90 * 24 * 60 * 60 * 1000,
  }
  return durations[template as keyof typeof durations] || durations['30days']
}
