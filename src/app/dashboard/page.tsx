'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Progress, Badge, Button } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useSprintStore } from "@/stores/sprint-store"
import { useAuthStore } from "@/stores/auth-store"
import { useAuthInitialized } from "@/hooks/useAuth"
import { SprintInfo } from "@/types/sprint"
import { SprintSelector } from "@/components/sprint-selector"
import {
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const {
    sprints,
    currentSprint,
    isLoading,
    loadSprints
  } = useSprintStore()

  const authInitialized = useAuthInitialized()

  // 选中的冲刺状态
  const [selectedSprint, setSelectedSprint] = useState<SprintInfo | null>(null)

  const [stats, setStats] = useState({
    totalSprints: 0,
    activeSprints: 0,
    completedSprints: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalTime: 0,
    streak: 0
  })

  // 等待Auth初始化完成后再加载数据
  useEffect(() => {
    if (authInitialized) {
      loadSprints()
    }
  }, [authInitialized, loadSprints])

  // 智能默认选择冲刺
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprint) {
      // 优先选择活跃冲刺，其次是最新的草稿冲刺
      const activeSprint = sprints.find(s => s.status === 'active')
      const latestDraftSprint = sprints
        .filter(s => s.status === 'draft')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

      setSelectedSprint(activeSprint || latestDraftSprint || null)
    }
  }, [sprints, selectedSprint])

  // 页面可见性检测，返回时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && authInitialized) {
        console.log('🔄 页面重新可见，刷新数据')
        loadSprints()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authInitialized, loadSprints])

  useEffect(() => {
    if (sprints.length > 0) {
      calculateStats()
    }
  }, [sprints])

  const calculateStats = () => {
    const totalSprints = sprints.length
    const activeSprints = sprints.filter(s => s.status === 'active').length
    const completedSprints = sprints.filter(s => s.status === 'completed').length
    
    const totalTasks = sprints.reduce((sum, sprint) => sum + sprint.stats.totalTasks, 0)
    const completedTasks = sprints.reduce((sum, sprint) => sum + sprint.stats.completedTasks, 0)
    const totalTime = sprints.reduce((sum, sprint) => sum + (sprint.stats.totalTime || 0), 0)
    
    // 计算连续完成天数（简化版）
    const streak = calculateStreak()

    setStats({
      totalSprints,
      activeSprints,
      completedSprints,
      totalTasks,
      completedTasks,
      totalTime,
      streak
    })
  }

  const calculateStreak = (): number => {
    // 简化的连续天数计算
    const completedSprints = sprints.filter(s => s.status === 'completed')
    return completedSprints.length
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}小时`
    }
    return `${minutes}分钟`
  }

  const getCompletionRate = (): number => {
    if (stats.totalTasks === 0) return 0
    return Math.round((stats.completedTasks / stats.totalTasks) * 100)
  }

  // 获取当前活跃的冲刺（第一个状态为active的冲刺）
  const getActiveSprint = () => {
    return sprints.find(s => s.status === 'active') || null
  }

  // 获取要显示的冲刺（使用选中的冲刺）
  const getDisplaySprint = () => {
    return selectedSprint
  }

  const getSelectedSprintProgress = (): number => {
    const sprint = getDisplaySprint()
    if (!sprint) return 0
    return sprint.progress
  }

  const getDaysUntilDeadline = (): number => {
    const sprint = getDisplaySprint()
    if (!sprint) return 0
    const now = new Date()
    const end = new Date(sprint.endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getMotivationalMessage = (): string => {
    const completionRate = getCompletionRate()
    if (completionRate >= 80) return "🎉 表现出色！继续保持！"
    if (completionRate >= 60) return "💪 进展不错，再接再厉！"
    if (completionRate >= 40) return "🚀 稳步前进，加油！"
    if (completionRate >= 20) return "🌱 刚刚起步，坚持下去！"
    return "✨ 开始您的冲刺之旅吧！"
  }

  const getRecentActivity = () => {
    return sprints
      .filter(s => s.status === 'active' || s.status === 'completed')
      .slice(0, 5)
      .map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        status: sprint.status,
        progress: sprint.progress,
        updatedAt: sprint.updatedAt || sprint.createdAt
      }))
  }

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              欢迎回来，{user?.displayName || '用户'}！
            </h1>
            <p className="text-muted-foreground">
              {getMotivationalMessage()}
            </p>
          </div>

          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 当前冲刺进度 */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BoltIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedSprint ? '选中冲刺' : '冲刺进度'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {getSelectedSprintProgress()}%
                    </p>
                  </div>
                </div>
                {getDisplaySprint() && (
                  <div className="space-y-2">
                    <Progress value={getSelectedSprintProgress()} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {getDisplaySprint()!.title}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 任务完成率 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">任务完成率</p>
                    <p className="text-2xl font-bold">{getCompletionRate()}%</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedTasks} / {stats.totalTasks} 个任务
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 总投入时间 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">总投入时间</p>
                    <p className="text-2xl font-bold">{formatTime(stats.totalTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      跨 {stats.totalSprints} 个冲刺
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 连续天数 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <FireIcon className="h-8 w-8 text-error" />
                  <div>
                    <p className="text-sm text-muted-foreground">连续完成</p>
                    <p className="text-2xl font-bold">{stats.streak}</p>
                    <p className="text-xs text-muted-foreground">
                      个冲刺
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 当前冲刺详情 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5" />
                      冲刺概览
                    </CardTitle>
                    <SprintSelector
                      sprints={sprints}
                      selectedSprint={selectedSprint}
                      onSprintSelect={setSelectedSprint}
                      isLoading={isLoading}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {getDisplaySprint() ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{getDisplaySprint()!.title}</h3>
                          {getDisplaySprint()!.status === 'active' ? (
                            <Badge variant="warning">进行中</Badge>
                          ) : (
                            <Badge variant="secondary">草稿</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {getDisplaySprint()!.description}
                        </p>

                        {getDisplaySprint()!.status === 'draft' && (
                          <div className="mb-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                // TODO: 实现启动冲刺功能
                                console.log('启动冲刺:', getDisplaySprint()!.id)
                              }}
                            >
                              <PlayIcon className="h-4 w-4 mr-2" />
                              开始冲刺
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <CalendarIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">剩余天数</p>
                          <p className="text-xl font-bold">{getDaysUntilDeadline()}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <CheckCircleIcon className="h-6 w-6 mx-auto mb-2 text-success" />
                          <p className="text-sm text-muted-foreground">已完成任务</p>
                          <p className="text-xl font-bold">{getDisplaySprint()!.stats.completedTasks}</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <TrophyIcon className="h-6 w-6 mx-auto mb-2 text-warning" />
                          <p className="text-sm text-muted-foreground">里程碑</p>
                          <p className="text-xl font-bold">{getDisplaySprint()!.stats.completedMilestones || 0}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>整体进度</span>
                          <span>{getDisplaySprint()!.progress}%</span>
                        </div>
                        <Progress value={getDisplaySprint()!.progress} className="h-3" />
                      </div>

                      {getDaysUntilDeadline() <= 3 && getDaysUntilDeadline() > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                          <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
                          <span className="text-sm text-warning">
                            冲刺即将结束，还有 {getDaysUntilDeadline()} 天！
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BoltIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">没有活跃的冲刺</h3>
                      <p className="text-muted-foreground mb-4">
                        创建一个新的冲刺来开始您的目标之旅
                      </p>
                      <button 
                        onClick={() => window.location.href = '/sprints/create'}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        创建冲刺
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 最近活动 */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getRecentActivity().length > 0 ? (
                      getRecentActivity().map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={activity.status === 'completed' ? 'success' : 'warning'} 
                                size="sm"
                              >
                                {activity.status === 'completed' ? '已完成' : '进行中'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {activity.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">暂无活动记录</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 快速统计 */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>快速统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">总冲刺数</span>
                      <span className="font-medium">{stats.totalSprints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">活跃冲刺</span>
                      <span className="font-medium">{stats.activeSprints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">已完成冲刺</span>
                      <span className="font-medium">{stats.completedSprints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">成功率</span>
                      <span className="font-medium">
                        {stats.totalSprints > 0 
                          ? Math.round((stats.completedSprints / stats.totalSprints) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 加载状态 */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载数据中...</p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  )
}
