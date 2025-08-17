import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  
  // 冲刺管理 Actions
  setCurrentSprint: (sprint: SprintInfo | null) => void
  createSprint: (request: CreateSprintRequest) => Promise<SprintInfo>
  updateSprint: (id: string, updates: UpdateSprintRequest) => Promise<void>
  deleteSprint: (id: string) => Promise<void>
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
  completeTask: (taskId: string) => Promise<void>
  
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

      // 冲刺管理 Actions
      setCurrentSprint: (sprint) => {
        set({ currentSprint: sprint })
      },

      createSprint: async (request) => {
        set({ isCreating: true, error: null })
        try {
          // 生成ID
          const id = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          const newSprint: SprintInfo = {
            id,
            userId: 'current_user', // TODO: 从auth store获取
            title: request.title,
            description: request.description,
            type: request.type,
            template: request.template,
            difficulty: request.difficulty || 'intermediate',
            status: 'draft',
            startDate: request.startDate,
            endDate: request.endDate || new Date(request.startDate.getTime() + (request.duration || 30) * 24 * 60 * 60 * 1000),
            duration: request.duration || 30,
            progress: 0,
            stats: {
              totalTasks: 0,
              completedTasks: 0,
              totalTime: 0,
              actualTime: 0,
              completionRate: 0,
              totalMilestones: 0,
              completedMilestones: 0
            },
            tags: request.tags || [],
            category: request.category,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          set((state) => ({
            sprints: [newSprint, ...state.sprints],
            currentSprint: newSprint,
            isCreating: false
          }))
          
          return newSprint
        } catch (error) {
          set({ error: '创建冲刺失败', isCreating: false })
          throw error
        }
      },

      updateSprint: async (id, updates) => {
        set({ isUpdating: true, error: null })
        try {
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
          set({ error: '更新冲刺失败', isUpdating: false })
          throw error
        }
      },

      deleteSprint: async (id) => {
        set({ isLoading: true, error: null })
        try {
          set((state) => ({
            sprints: state.sprints.filter(sprint => sprint.id !== id),
            currentSprint: state.currentSprint?.id === id ? null : state.currentSprint,
            isLoading: false
          }))
        } catch (error) {
          set({ error: '删除冲刺失败', isLoading: false })
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
          // TODO: 调用API加载冲刺列表
          set({ 
            isLoading: false,
            filters: filters || get().filters,
            pagination: pagination || get().pagination
          })
        } catch (error) {
          set({ error: '加载冲刺列表失败', isLoading: false })
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
          // TODO: 调用API加载任务
          set({ isLoading: false })
        } catch (error) {
          set({ error: '加载任务失败', isLoading: false })
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

      completeTask: async (taskId) => {
        await get().updateTask(taskId, { 
          status: 'completed', 
          progress: 100,
          completedAt: new Date()
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
