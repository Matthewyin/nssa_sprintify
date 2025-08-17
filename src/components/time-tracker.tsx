'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"
import { useSprintStore } from "@/stores/sprint-store"
import { Task } from "@/types/sprint"
import { 
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface TimeTrackerProps {
  sprintId: string
}

interface TimeSession {
  id: string
  taskId: string
  startTime: Date
  endTime?: Date
  duration: number // 分钟
  description?: string
}

export function TimeTracker({ sprintId }: TimeTrackerProps) {
  const { currentTasks, updateTask, loadTasks } = useSprintStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // 秒
  const [sessions, setSessions] = useState<TimeSession[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadTasks(sprintId)
  }, [sprintId, loadTasks])

  useEffect(() => {
    // 从localStorage加载会话数据
    const savedSessions = localStorage.getItem(`time-sessions-${sprintId}`)
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions))
    }

    // 检查是否有正在进行的计时
    const activeSession = localStorage.getItem(`active-session-${sprintId}`)
    if (activeSession) {
      const session = JSON.parse(activeSession)
      const task = currentTasks.find(t => t.id === session.taskId)
      if (task) {
        setActiveTask(task)
        setStartTime(new Date(session.startTime))
        setIsRunning(true)
      }
    }
  }, [sprintId, currentTasks])

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime])

  const startTimer = (task: Task) => {
    const now = new Date()
    setActiveTask(task)
    setStartTime(now)
    setElapsedTime(0)
    setIsRunning(true)

    // 保存到localStorage
    localStorage.setItem(`active-session-${sprintId}`, JSON.stringify({
      taskId: task.id,
      startTime: now.toISOString()
    }))

    // 更新任务状态为进行中
    if (task.status === 'todo') {
      updateTask(task.id, { status: 'in-progress', startedAt: now })
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
    localStorage.removeItem(`active-session-${sprintId}`)
  }

  const stopTimer = async (description?: string) => {
    if (!activeTask || !startTime) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 60000) // 分钟

    // 创建时间会话记录
    const session: TimeSession = {
      id: `session_${Date.now()}`,
      taskId: activeTask.id,
      startTime,
      endTime,
      duration,
      description
    }

    // 更新会话列表
    const newSessions = [...sessions, session]
    setSessions(newSessions)
    localStorage.setItem(`time-sessions-${sprintId}`, JSON.stringify(newSessions))

    // 更新任务的实际时间
    const taskSessions = newSessions.filter(s => s.taskId === activeTask.id)
    const totalTime = taskSessions.reduce((sum, s) => sum + s.duration, 0)
    
    await updateTask(activeTask.id, { 
      actualTime: totalTime,
      updatedAt: endTime
    })

    // 重置状态
    setActiveTask(null)
    setStartTime(null)
    setElapsedTime(0)
    setIsRunning(false)
    localStorage.removeItem(`active-session-${sprintId}`)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`
    }
    return `${mins}分钟`
  }

  const getTaskSessions = (taskId: string): TimeSession[] => {
    return sessions.filter(s => s.taskId === taskId)
  }

  const getTaskTotalTime = (taskId: string): number => {
    return getTaskSessions(taskId).reduce((sum, s) => sum + s.duration, 0)
  }

  const getTodaySessions = (): TimeSession[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sessions.filter(s => new Date(s.startTime) >= today)
  }

  const getTodayTotalTime = (): number => {
    return getTodaySessions().reduce((sum, s) => sum + s.duration, 0)
  }

  return (
    <div className="space-y-6">
      {/* 当前计时器 */}
      {activeTask && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              正在计时
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">{activeTask.title}</h3>
              <div className="text-4xl font-mono font-bold text-primary">
                {formatTime(elapsedTime)}
              </div>
              <div className="flex gap-2 justify-center">
                {isRunning ? (
                  <Button onClick={pauseTimer} variant="outline">
                    <PauseIcon className="h-4 w-4 mr-2" />
                    暂停
                  </Button>
                ) : (
                  <Button onClick={() => setIsRunning(true)}>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    继续
                  </Button>
                )}
                <Button onClick={() => stopTimer()} variant="outline">
                  <StopIcon className="h-4 w-4 mr-2" />
                  停止
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>选择任务开始计时</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentTasks
              .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
              .map((task) => {
                const totalTime = getTaskTotalTime(task.id)
                const isActive = activeTask?.id === task.id
                
                return (
                  <div key={task.id} className={`p-4 border rounded-lg ${isActive ? 'border-primary bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>预估: {formatDuration(task.estimatedTime)}</span>
                          <span>实际: {formatDuration(totalTime)}</span>
                          <Badge variant={task.status === 'in-progress' ? 'warning' : 'secondary'}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4">
                        {!isActive ? (
                          <Button
                            onClick={() => startTimer(task)}
                            disabled={!!activeTask}
                          >
                            <PlayIcon className="h-4 w-4 mr-2" />
                            开始计时
                          </Button>
                        ) : (
                          <Badge variant="warning">计时中</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* 今日统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">今日总时长</p>
                <p className="text-xl font-bold">{formatDuration(getTodayTotalTime())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">今日会话</p>
                <p className="text-xl font-bold">{getTodaySessions().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">平均会话</p>
                <p className="text-xl font-bold">
                  {getTodaySessions().length > 0 
                    ? formatDuration(Math.round(getTodayTotalTime() / getTodaySessions().length))
                    : '0分钟'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近会话 */}
      <Card>
        <CardHeader>
          <CardTitle>最近会话</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="h-12 w-12 mx-auto mb-4" />
              <p>还没有时间记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions
                .slice(-10)
                .reverse()
                .map((session) => {
                  const task = currentTasks.find(t => t.id === session.taskId)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task?.title || '未知任务'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startTime).toLocaleString('zh-CN')}
                          {session.description && ` - ${session.description}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDuration(session.duration)}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
