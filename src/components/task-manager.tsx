'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, Progress, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea } from "@/components/ui"
import { useSprintStore } from "@/stores/sprint-store"
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from "@/types/sprint"
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface TaskManagerProps {
  sprintId: string
}

export function TaskManager({ sprintId }: TaskManagerProps) {
  const { 
    currentTasks, 
    isLoading, 
    createTask, 
    updateTask, 
    deleteTask, 
    completeTask,
    loadTasks 
  } = useSprintStore()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'medium',
    estimatedTime: 60,
    tags: []
  })

  // 里程碑总结相关状态
  const [showMilestoneSummary, setShowMilestoneSummary] = useState(false)
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [milestoneSummary, setMilestoneSummary] = useState('')

  useEffect(() => {
    loadTasks(sprintId)
  }, [sprintId, loadTasks])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      estimatedTime: 60,
      tags: []
    })
    setShowCreateForm(false)
    setEditingTask(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData as UpdateTaskRequest)
      } else {
        await createTask(sprintId, formData)
      }
      resetForm()
    } catch (error) {
      console.error('Task operation failed:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      tags: task.tags
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error('Delete task failed:', error)
      }
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      if (status === 'completed') {
        // 完成任务时显示里程碑总结对话框
        const task = currentTasks.find(t => t.id === taskId)
        if (task) {
          setCompletingTask(task)
          setShowMilestoneSummary(true)
        }
      } else {
        await updateTask(taskId, { status })
      }
    } catch (error) {
      console.error('Update task status failed:', error)
    }
  }

  // 处理里程碑总结提交
  const handleMilestoneSummarySubmit = async () => {
    if (!completingTask) return

    try {
      // 完成任务并添加里程碑总结
      await completeTask(completingTask.id, milestoneSummary)

      // 重置状态
      setShowMilestoneSummary(false)
      setCompletingTask(null)
      setMilestoneSummary('')
    } catch (error) {
      console.error('Complete task with milestone summary failed:', error)
    }
  }

  // 取消里程碑总结
  const handleMilestoneSummaryCancel = () => {
    setShowMilestoneSummary(false)
    setCompletingTask(null)
    setMilestoneSummary('')
  }

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    }
    return colors[priority] || 'secondary'
  }

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      todo: 'secondary',
      'in-progress': 'warning',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status] || 'secondary'
  }

  const getStatusText = (status: TaskStatus) => {
    const texts = {
      todo: '待办',
      'in-progress': '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  const getPriorityText = (priority: TaskPriority) => {
    const texts = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }
    return texts[priority] || priority
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`
    }
    return `${mins}分钟`
  }

  // 按状态分组任务
  const groupedTasks = {
    todo: currentTasks.filter(task => task.status === 'todo'),
    'in-progress': currentTasks.filter(task => task.status === 'in-progress'),
    completed: currentTasks.filter(task => task.status === 'completed'),
    cancelled: currentTasks.filter(task => task.status === 'cancelled')
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">任务管理</h2>
          <p className="text-sm text-muted-foreground">
            共 {currentTasks.length} 个任务，已完成 {groupedTasks.completed.length} 个
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          添加任务
        </Button>
      </div>

      {/* 创建/编辑表单 */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? '编辑任务' : '创建任务'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    任务标题 *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入任务标题"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  任务描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="详细描述任务内容..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    预估时间（分钟）
                  </label>
                  <Input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: Number(e.target.value) }))}
                    min={1}
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    截止日期
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dueDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTask ? '更新任务' : '创建任务'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 任务看板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(groupedTasks).map(([status, tasks]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{getStatusText(status as TaskStatus)}</span>
                <Badge variant={getStatusColor(status as TaskStatus) as any}>
                  {tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg bg-card">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(task)}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant={getPriorityColor(task.priority) as any} size="sm">
                          {getPriorityText(task.priority)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ClockIcon className="h-3 w-3" />
                          {formatTime(task.estimatedTime)}
                        </div>
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                        </div>
                      )}

                      {task.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>进度</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1" />
                        </div>
                      )}

                      {/* 状态操作按钮 */}
                      <div className="flex gap-1">
                        {task.status === 'todo' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(task.id, 'in-progress')}
                            className="flex-1"
                          >
                            开始
                          </Button>
                        )}
                        {task.status === 'in-progress' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(task.id, 'todo')}
                              className="flex-1"
                            >
                              暂停
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              className="flex-1"
                            >
                              <CheckIcon className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {task.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(task.id, 'in-progress')}
                            className="flex-1"
                          >
                            重新开始
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">暂无任务</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      )}

      {/* 里程碑总结对话框 */}
      <Dialog open={showMilestoneSummary} onOpenChange={setShowMilestoneSummary}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-success" />
              完成任务 - 里程碑达成！
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {completingTask && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{completingTask.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completingTask.description}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                里程碑总结 <span className="text-muted-foreground">(可选，最多300字)</span>
              </label>
              <Textarea
                value={milestoneSummary}
                onChange={(e) => setMilestoneSummary(e.target.value)}
                placeholder="记录这个任务的完成过程、收获或心得..."
                maxLength={300}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {milestoneSummary.length}/300
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleMilestoneSummaryCancel}>
              取消
            </Button>
            <Button onClick={handleMilestoneSummarySubmit}>
              完成任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
