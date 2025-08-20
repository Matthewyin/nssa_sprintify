'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { ProgressCharts } from "@/components/progress-charts"
import { ActivityHeatmap } from "@/components/activity-heatmap"
import { CountdownTimer } from "@/components/countdown-timer"
import { useSprintStore } from "@/stores/sprint-store"
import { useAuthStore } from "@/stores/auth-store"
import {
  ChartBarIcon,
  CalendarIcon,
  TrophyIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const { 
    sprints, 
    currentSprint,
    isLoading, 
    loadSprints 
  } = useSprintStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)

  useEffect(() => {
    loadSprints()
  }, [loadSprints])

  // 页面可见性检测，返回时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 数据分析页面重新可见，刷新数据')
        loadSprints()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadSprints])

  // 获取当前活跃的冲刺
  const getActiveSprint = () => {
    return sprints.find(s => s.status === 'active') || null
  }

  // 获取选中的冲刺（用于倒计时）
  const getSelectedSprint = () => {
    if (selectedSprintId) {
      return sprints.find(s => s.id === selectedSprintId) || null
    }
    return getActiveSprint()
  }

  // 获取可选择的冲刺列表（活跃的和即将开始的）
  const getSelectableSprints = () => {
    return sprints.filter(s => s.status === 'completed' || s.status === 'draft')
  }

  const getFilteredSprints = () => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    return sprints.filter(sprint => new Date(sprint.createdAt) >= cutoffDate)
  }

  const calculateInsights = () => {
    const filteredSprints = getFilteredSprints()
    
    const totalSprints = filteredSprints.length
    const completedSprints = filteredSprints.filter(s => s.status === 'completed').length
    const activeSprints = filteredSprints.filter(s => s.status === 'active').length
    
    const completionRate = totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0
    
    const totalTasks = filteredSprints.reduce((sum, s) => sum + s.stats.totalTasks, 0)
    const completedTasks = filteredSprints.reduce((sum, s) => sum + s.stats.completedTasks, 0)
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    const totalTime = filteredSprints.reduce((sum, s) => sum + (s.stats.totalTime || 0), 0)
    const avgTimePerSprint = totalSprints > 0 ? Math.round(totalTime / totalSprints) : 0
    
    const avgProgress = totalSprints > 0 
      ? Math.round(filteredSprints.reduce((sum, s) => sum + s.progress, 0) / totalSprints)
      : 0

    return {
      totalSprints,
      completedSprints,
      activeSprints,
      completionRate,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      totalTime,
      avgTimePerSprint,
      avgProgress
    }
  }

  const getProductivityTrend = () => {
    const last7Days = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      
      const dayTasks = Math.floor(Math.random() * 8) + 1 // 模拟数据
      const completedTasks = Math.floor(Math.random() * dayTasks)
      
      last7Days.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        completed: completedTasks,
        total: dayTasks,
        rate: dayTasks > 0 ? Math.round((completedTasks / dayTasks) * 100) : 0
      })
    }
    
    return last7Days
  }

  const getTopPerformingCategories = () => {
    const categories = sprints.reduce((acc, sprint) => {
      const category = sprint.type === 'learning' ? '学习' : '项目'
      if (!acc[category]) {
        acc[category] = { total: 0, completed: 0 }
      }
      acc[category].total++
      if (sprint.status === 'completed') {
        acc[category].completed++
      }
      return acc
    }, {} as Record<string, { total: number; completed: number }>)

    return Object.entries(categories)
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        completed: stats.completed,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate)
  }

  const insights = calculateInsights()
  const productivityTrend = getProductivityTrend()
  const topCategories = getTopPerformingCategories()

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}小时${minutes % 60 > 0 ? `${minutes % 60}分钟` : ''}`
    }
    return `${minutes}分钟`
  }

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">数据分析</h1>
              <p className="text-muted-foreground mt-1">
                深入了解您的冲刺表现和进步趋势
              </p>
            </div>
            
            {/* 时间范围选择器 */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {range === 'week' && '7天'}
                  {range === 'month' && '30天'}
                  {range === 'quarter' && '3个月'}
                  {range === 'year' && '1年'}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                概览
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                进度分析
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                活动热力图
              </TabsTrigger>
              <TabsTrigger value="countdown" className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                倒计时
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* 核心指标 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <TrophyIcon className="h-8 w-8 text-warning" />
                        <div>
                          <p className="text-sm text-muted-foreground">冲刺完成率</p>
                          <p className="text-2xl font-bold">{insights.completionRate}%</p>
                          <p className="text-xs text-muted-foreground">
                            {insights.completedSprints}/{insights.totalSprints}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <ChartBarIcon className="h-8 w-8 text-success" />
                        <div>
                          <p className="text-sm text-muted-foreground">任务完成率</p>
                          <p className="text-2xl font-bold">{insights.taskCompletionRate}%</p>
                          <p className="text-xs text-muted-foreground">
                            {insights.completedTasks}/{insights.totalTasks}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">平均投入时间</p>
                          <p className="text-2xl font-bold">{formatTime(insights.avgTimePerSprint)}</p>
                          <p className="text-xs text-muted-foreground">
                            每个冲刺
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <FireIcon className="h-8 w-8 text-error" />
                        <div>
                          <p className="text-sm text-muted-foreground">平均进度</p>
                          <p className="text-2xl font-bold">{insights.avgProgress}%</p>
                          <p className="text-xs text-muted-foreground">
                            所有冲刺
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 生产力趋势 */}
                <Card>
                  <CardHeader>
                    <CardTitle>7天生产力趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between gap-2">
                      {productivityTrend.map((day, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-muted rounded-t mb-2 relative">
                            <div 
                              className="w-full bg-primary rounded-t transition-all duration-300"
                              style={{ height: `${day.rate * 2}px` }}
                              title={`${day.date}: ${day.completed}/${day.total} (${day.rate}%)`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{day.date}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 分类表现 */}
                <Card>
                  <CardHeader>
                    <CardTitle>分类表现</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topCategories.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{category.category}</span>
                            <span>{category.completed}/{category.total} ({category.rate}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${category.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <ProgressCharts sprints={getFilteredSprints()} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <ActivityHeatmap sprints={sprints} />
            </TabsContent>

            <TabsContent value="countdown" className="mt-6">
              <div className="space-y-6">
                {/* 冲刺选择器 */}
                {getSelectableSprints().length > 1 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">选择冲刺:</span>
                        <div className="flex gap-2">
                          {getSelectableSprints().map((sprint) => (
                            <button
                              key={sprint.id}
                              onClick={() => setSelectedSprintId(sprint.id)}
                              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                (selectedSprintId === sprint.id) ||
                                (!selectedSprintId && sprint.status === 'active')
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {sprint.title}
                              <span className="ml-1 text-xs opacity-75">
                                ({sprint.status === 'active' ? '进行中' : '待开始'})
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 倒计时显示 */}
                {getSelectedSprint() ? (
                  <div className="max-w-2xl mx-auto">
                    <CountdownTimer sprint={getSelectedSprint()!} />
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">没有可用的冲刺</h3>
                      <p className="text-muted-foreground mb-4">
                        创建一个新的冲刺来开始倒计时
                      </p>
                      <button
                        onClick={() => window.location.href = '/sprints/create'}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        创建冲刺
                      </button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

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
