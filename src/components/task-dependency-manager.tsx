'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"
import { useSprintStore } from "@/stores/sprint-store"
import { Task } from "@/types/sprint"
import { 
  ArrowRightIcon,
  LinkIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface TaskDependencyManagerProps {
  sprintId: string
  taskId?: string
}

export function TaskDependencyManager({ sprintId, taskId }: TaskDependencyManagerProps) {
  const { currentTasks, updateTask, loadTasks } = useSprintStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddDependency, setShowAddDependency] = useState(false)

  useEffect(() => {
    loadTasks(sprintId)
  }, [sprintId, loadTasks])

  useEffect(() => {
    if (taskId) {
      const task = currentTasks.find(t => t.id === taskId)
      setSelectedTask(task || null)
    }
  }, [taskId, currentTasks])

  const addDependency = async (taskId: string, dependencyId: string) => {
    const task = currentTasks.find(t => t.id === taskId)
    if (!task) return

    // 检查是否会造成循环依赖
    if (wouldCreateCircularDependency(taskId, dependencyId)) {
      alert('无法添加依赖：这会造成循环依赖')
      return
    }

    const newDependencies = [...task.dependencies, dependencyId]
    await updateTask(taskId, { dependencies: newDependencies })
  }

  const removeDependency = async (taskId: string, dependencyId: string) => {
    const task = currentTasks.find(t => t.id === taskId)
    if (!task) return

    const newDependencies = task.dependencies.filter(id => id !== dependencyId)
    await updateTask(taskId, { dependencies: newDependencies })
  }

  const wouldCreateCircularDependency = (taskId: string, dependencyId: string): boolean => {
    // 检查是否会创建循环依赖
    const visited = new Set<string>()
    
    const hasPath = (from: string, to: string): boolean => {
      if (from === to) return true
      if (visited.has(from)) return false
      
      visited.add(from)
      const task = currentTasks.find(t => t.id === from)
      if (!task) return false
      
      return task.dependencies.some(depId => hasPath(depId, to))
    }
    
    return hasPath(dependencyId, taskId)
  }

  const getTaskDependencies = (task: Task): Task[] => {
    return task.dependencies
      .map(depId => currentTasks.find(t => t.id === depId))
      .filter(Boolean) as Task[]
  }

  const getTaskDependents = (taskId: string): Task[] => {
    return currentTasks.filter(task => task.dependencies.includes(taskId))
  }

  const getAvailableDependencies = (taskId: string): Task[] => {
    return currentTasks.filter(task => 
      task.id !== taskId && 
      !task.dependencies.includes(taskId) &&
      !wouldCreateCircularDependency(taskId, task.id)
    )
  }

  const getTaskStatusColor = (status: string) => {
    const colors = {
      todo: 'secondary',
      'in-progress': 'warning',
      completed: 'success',
      cancelled: 'error'
    }
    return colors[status as keyof typeof colors] || 'secondary'
  }

  const canStartTask = (task: Task): boolean => {
    const dependencies = getTaskDependencies(task)
    return dependencies.every(dep => dep.status === 'completed')
  }

  const getBlockedTasks = (): Task[] => {
    return currentTasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'cancelled' &&
      !canStartTask(task)
    )
  }

  return (
    <div className="space-y-6">
      {/* 任务选择器 */}
      {!taskId && (
        <Card>
          <CardHeader>
            <CardTitle>选择任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-primary bg-primary/10'
                      : 'border-input hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <Badge variant={getTaskStatusColor(task.status) as any} size="sm">
                      {task.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    依赖: {task.dependencies.length} | 被依赖: {getTaskDependents(task.id).length}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 被阻塞的任务警告 */}
      {getBlockedTasks().length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <ExclamationTriangleIcon className="h-5 w-5" />
              被阻塞的任务
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getBlockedTasks().map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-warning/10 rounded">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-sm text-muted-foreground">
                    等待 {getTaskDependencies(task).filter(dep => dep.status !== 'completed').length} 个依赖完成
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 选中任务的依赖管理 */}
      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 依赖任务 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightIcon className="h-5 w-5" />
                  {selectedTask.title} 的依赖
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAddDependency(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {getTaskDependencies(selectedTask).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">没有依赖任务</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getTaskDependencies(selectedTask).map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{dep.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getTaskStatusColor(dep.status) as any} size="sm">
                            {dep.status}
                          </Badge>
                          {dep.status !== 'completed' && (
                            <span className="text-xs text-warning">阻塞中</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDependency(selectedTask.id, dep.id)}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 被依赖的任务 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightIcon className="h-5 w-5 rotate-180" />
                依赖 {selectedTask.title} 的任务
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getTaskDependents(selectedTask.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">没有任务依赖此任务</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getTaskDependents(selectedTask.id).map((dependent) => (
                    <div key={dependent.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{dependent.title}</h4>
                        <Badge variant={getTaskStatusColor(dependent.status) as any} size="sm">
                          {dependent.status}
                        </Badge>
                      </div>
                      {!canStartTask(dependent) && (
                        <p className="text-xs text-warning mt-1">
                          等待依赖完成
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 添加依赖对话框 */}
      {showAddDependency && selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>为 "{selectedTask.title}" 添加依赖</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getAvailableDependencies(selectedTask.id).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <Badge variant={getTaskStatusColor(task.status) as any} size="sm">
                      {task.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      addDependency(selectedTask.id, task.id)
                      setShowAddDependency(false)
                    }}
                  >
                    添加依赖
                  </Button>
                </div>
              ))}
              {getAvailableDependencies(selectedTask.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">没有可用的依赖任务</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddDependency(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 依赖关系图 */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>依赖关系图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">依赖关系可视化</h3>
              <p className="text-sm">
                即将推出任务依赖关系的可视化图表
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
