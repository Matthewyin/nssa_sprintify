import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SprintApiService } from '@/lib/sprint-api'
import {
  SprintInfo,
  Task,
  Milestone,
  CreateSprintRequest,
  UpdateSprintRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateMilestoneRequest,
  SprintFilters,
  PaginationParams,
  SprintStats
} from '@/types/sprint'

interface SprintState {
  // 当前冲刺
  currentSprint: SprintInfo | null
  
  // 冲刺列表
  sprints: SprintInfo[]
  
  // 当前冲刺的任务
  currentTasks: Task[]
  
  // 当前冲刺的里程碑
  currentMilestones: Milestone[]
  
  // 统计信息
  stats: SprintStats | null
  
  // 筛选和分页
  filters: SprintFilters
  pagination: PaginationParams
  
  // 加载状态
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  
  // 错误信息
  error: string | null

  // 数据管理 Actions
  clearAllData: () => void

  // 冲刺管理 Actions
  setCurrentSprint: (sprint: SprintInfo | null) => void
  createSprint: (request: CreateSprintRequest) => Promise<SprintInfo>
  updateSprint: (id: string, updates: UpdateSprintRequest) => Promise<void>
  deleteSprint: (id: string) => Promise<void>
  deleteSprintsBatch: (sprintIds: string[]) => Promise<{ deleted: string[], notFound: string[] }>
  startSprint: (id: string) => Promise<void>
  pauseSprint: (id: string) => Promise<void>
  completeSprint: (id: string) => Promise<void>
  
  // 冲刺列表管理
  loadSprints: (filters?: SprintFilters, pagination?: PaginationParams) => Promise<void>
  refreshSprints: () => Promise<void>
  
  // 任务管理 Actions
  loadTasks: (sprintId: string) => Promise<void>
  createTask: (sprintId: string, request: CreateTaskRequest) => Promise<Task>
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string, milestoneSummary?: string) => Promise<void>
  
  // 里程碑管理 Actions
  loadMilestones: (sprintId: string) => Promise<void>
  createMilestone: (sprintId: string, request: CreateMilestoneRequest) => Promise<Milestone>
  updateMilestone: (milestoneId: string, updates: Partial<Milestone>) => Promise<void>
  deleteMilestone: (milestoneId: string) => Promise<void>
  achieveMilestone: (milestoneId: string) => Promise<void>
  
  // 统计信息
  loadStats: () => Promise<void>
  
  // 筛选和搜索
  setFilters: (filters: Partial<SprintFilters>) => void
  setPagination: (pagination: Partial<PaginationParams>) => void
  clearFilters: () => void
  
  // 工具方法
  clearError: () => void
  reset: () => void
}

export const useSprintStore = create<SprintState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentSprint: null,
      sprints: [],
      currentTasks: [],
      currentMilestones: [],
      stats: null,
      filters: {},
      pagination: { page: 1, limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' },
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      error: null,

      // 数据管理 Actions
      clearAllData: () => {
        set({
          currentSprint: null,
          sprints: [],
          currentTasks: [],
          currentMilestones: [],
          stats: null,
          filters: {},
          pagination: { page: 1, limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' },
          isLoading: false,
          isCreating: false,
          isUpdating: false,
          error: null
        })
      },

      // 冲刺管理 Actions
      setCurrentSprint: (sprint) => {
        set({ currentSprint: sprint })
      },

      createSprint: async (request) => {
        set({ isCreating: true, error: null })
        try {
          // 调用API创建冲刺
          const newSprint = await SprintApiService.createSprint(request)

          // 添加到本地状态
          set((state) => ({
            sprints: [newSprint, ...state.sprints],
            currentSprint: newSprint,
            isCreating: false
          }))

          return newSprint
        } catch (error) {
          console.error('Create sprint error:', error)
          set({
            error: error instanceof Error ? error.message : '创建冲刺失败',
            isCreating: false
          })
          throw error
        }
      },

      updateSprint: async (id, updates) => {
        set({ isUpdating: true, error: null })
        try {
          // 调用API更新冲刺
          await SprintApiService.updateSprint(id, updates)

          // 更新本地状态
          set((state) => ({
            sprints: state.sprints.map(sprint =>
              sprint.id === id
                ? { ...sprint, ...updates, updatedAt: new Date() }
                : sprint
            ),
            currentSprint: state.currentSprint?.id === id
              ? { ...state.currentSprint, ...updates, updatedAt: new Date() }
              : state.currentSprint,
            isUpdating: false
          }))
        } catch (error) {
          console.error('Update sprint error:', error)
          set({
            error: error instanceof Error ? error.message : '更新冲刺失败',
            isUpdating: false
          })
          throw error
        }
      },

      deleteSprint: async (id) => {
        set({ isLoading: true, error: null })
        try {
          // 调用API删除冲刺
          await SprintApiService.deleteSprint(id)

          // 更新本地状态
          set((state) => ({
            sprints: state.sprints.filter(sprint => sprint.id !== id),
            currentSprint: state.currentSprint?.id === id ? null : state.currentSprint,
            isLoading: false
          }))
        } catch (error) {
          console.error('Delete sprint error:', error)
          set({
            error: error instanceof Error ? error.message : '删除冲刺失败',
            isLoading: false
          })
          throw error
        }
      },

      deleteSprintsBatch: async (sprintIds) => {
        set({ isLoading: true, error: null })
        try {
          // 调用API批量删除冲刺
          const result = await SprintApiService.deleteSprintsBatch(sprintIds)

          // 更新本地状态
          set((state) => ({
            sprints: state.sprints.filter(sprint => !result.deleted.includes(sprint.id)),
            currentSprint: result.deleted.includes(state.currentSprint?.id || '')
              ? null
              : state.currentSprint,
            isLoading: false
          }))

          return result
        } catch (error) {
          console.error('Batch delete sprints error:', error)
          set({
            error: error instanceof Error ? error.message : '批量删除冲刺失败',
            isLoading: false
          })
          throw error
        }
      },

      startSprint: async (id) => {
        await get().updateSprint(id, { status: 'active', startDate: new Date() })
      },

      pauseSprint: async (id) => {
        await get().updateSprint(id, { status: 'paused' })
      },

      completeSprint: async (id) => {
        await get().updateSprint(id, { 
          status: 'completed', 
          completedAt: new Date(),
          progress: 100
        })
      },

      // 冲刺列表管理
      loadSprints: async (filters, pagination) => {
        set({ isLoading: true, error: null })
        try {
          // 调用API获取冲刺列表
          const sprints = await SprintApiService.getUserSprints(filters, pagination)

          set({
            sprints,
            isLoading: false,
            filters: filters || get().filters,
            pagination: pagination || get().pagination
          })
        } catch (error) {
          console.error('Load sprints error:', error)
          set({
            error: error instanceof Error ? error.message : '加载冲刺列表失败',
            isLoading: false
          })
        }
      },

      refreshSprints: async () => {
        const { filters, pagination } = get()
        await get().loadSprints(filters, pagination)
      },

      // 任务管理 Actions
      loadTasks: async (sprintId) => {
        set({ isLoading: true, error: null })
        try {
          // 调用API加载任务
          const tasks = await SprintApiService.getTasks(sprintId)
          set({
            currentTasks: tasks,
            isLoading: false
          })
        } catch (error) {
          console.error('Load tasks error:', error)
          set({
            error: error instanceof Error ? error.message : '加载任务失败',
            isLoading: false
          })
        }
      },

      createTask: async (sprintId, request) => {
        try {
          const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          const newTask: Task = {
            id,
            sprintId,
            userId: 'current_user',
            title: request.title,
            description: request.description,
            status: 'todo',
            priority: request.priority || 'medium',
            estimatedTime: request.estimatedTime || 60,
            actualTime: 0,
            dueDate: request.dueDate,
            dependencies: request.dependencies || [],
            progress: 0,
            tags: request.tags || [],
            category: request.category,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set((state) => ({
            currentTasks: [...state.currentTasks, newTask]
          }))
          
          return newTask
        } catch (error) {
          set({ error: '创建任务失败' })
          throw error
        }
      },

      updateTask: async (taskId, updates) => {
        try {
          set((state) => ({
            currentTasks: state.currentTasks.map(task =>
              task.id === taskId
                ? { ...task, ...updates, updatedAt: new Date() }
                : task
            )
          }))
        } catch (error) {
          set({ error: '更新任务失败' })
          throw error
        }
      },

      deleteTask: async (taskId) => {
        try {
          set((state) => ({
            currentTasks: state.currentTasks.filter(task => task.id !== taskId)
          }))
        } catch (error) {
          set({ error: '删除任务失败' })
          throw error
        }
      },

      completeTask: async (taskId, milestoneSummary) => {
        await get().updateTask(taskId, {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          milestoneSummary: milestoneSummary || undefined
        })
      },

      // 里程碑管理 Actions
      loadMilestones: async (sprintId) => {
        set({ isLoading: true, error: null })
        try {
          // TODO: 调用API加载里程碑
          set({ isLoading: false })
        } catch (error) {
          set({ error: '加载里程碑失败', isLoading: false })
        }
      },

      createMilestone: async (sprintId, request) => {
        try {
          const id = `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          const newMilestone: Milestone = {
            id,
            sprintId,
            userId: 'current_user',
            title: request.title,
            description: request.description,
            status: 'pending',
            targetDate: request.targetDate,
            criteria: request.criteria,
            relatedTasks: request.relatedTasks || [],
            reward: request.reward,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set((state) => ({
            currentMilestones: [...state.currentMilestones, newMilestone]
          }))
          
          return newMilestone
        } catch (error) {
          set({ error: '创建里程碑失败' })
          throw error
        }
      },

      updateMilestone: async (milestoneId, updates) => {
        try {
          set((state) => ({
            currentMilestones: state.currentMilestones.map(milestone =>
              milestone.id === milestoneId
                ? { ...milestone, ...updates, updatedAt: new Date() }
                : milestone
            )
          }))
        } catch (error) {
          set({ error: '更新里程碑失败' })
          throw error
        }
      },

      deleteMilestone: async (milestoneId) => {
        try {
          set((state) => ({
            currentMilestones: state.currentMilestones.filter(milestone => milestone.id !== milestoneId)
          }))
        } catch (error) {
          set({ error: '删除里程碑失败' })
          throw error
        }
      },

      achieveMilestone: async (milestoneId) => {
        await get().updateMilestone(milestoneId, { 
          status: 'achieved', 
          achievedDate: new Date()
        })
      },

      // 统计信息
      loadStats: async () => {
        set({ isLoading: true, error: null })
        try {
          // TODO: 调用API加载统计信息
          set({ isLoading: false })
        } catch (error) {
          set({ error: '加载统计信息失败', isLoading: false })
        }
      },

      // 筛选和搜索
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      setPagination: (pagination) => {
        set((state) => ({
          pagination: { ...state.pagination, ...pagination }
        }))
      },

      clearFilters: () => {
        set({ filters: {} })
      },

      // 工具方法
      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          currentSprint: null,
          sprints: [],
          currentTasks: [],
          currentMilestones: [],
          stats: null,
          filters: {},
          pagination: { page: 1, limit: 10, sortBy: 'updatedAt', sortOrder: 'desc' },
          isLoading: false,
          isCreating: false,
          isUpdating: false,
          error: null
        })
      }
    }),
    {
      name: 'sprint-store',
      partialize: (state) => ({
        currentSprint: state.currentSprint,
        sprints: state.sprints,
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
)
