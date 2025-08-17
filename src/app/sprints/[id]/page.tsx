'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { TaskManager } from "@/components/task-manager"
import { MilestoneManager } from "@/components/milestone-manager"
import { useSprintStore } from "@/stores/sprint-store"
import { SprintInfo, Task, Milestone } from "@/types/sprint"
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  PlusIcon,
  ListBulletIcon,
  FlagIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface SprintDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SprintDetailPage({ params }: SprintDetailPageProps) {
  const router = useRouter()
  const {
    sprints,
    currentTasks,
    currentMilestones,
    isLoading,
    error,
    loadTasks,
    loadMilestones,
    startSprint,
    pauseSprint,
    completeSprint,
    clearError
  } = useSprintStore()

  const [activeTab, setActiveTab] = useState('tasks')
  const [sprintId, setSprintId] = useState<string | null>(null)
  const [sprint, setSprint] = useState<any>(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSprintId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (sprintId) {
      const foundSprint = sprints.find(s => s.id === sprintId)
      setSprint(foundSprint)
    }
  }, [sprintId, sprints])

  useEffect(() => {
    if (sprintId) {
      loadTasks(sprintId)
      loadMilestones(sprintId)
    }
  }, [sprintId, loadTasks, loadMilestones])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  if (!sprint) {
    return (
      <PermissionGuard requireAuth>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">冲刺不存在</h1>
              <p className="text-muted-foreground mb-6">
                您访问的冲刺可能已被删除或不存在
              </p>
              <Button onClick={() => router.push('/sprints')}>
                返回冲刺列表
              </Button>
            </div>
          </div>
        </div>
      </PermissionGuard>
    )
  }

  const handleSprintAction = async (action: 'start' | 'pause' | 'complete') => {
    try {
      switch (action) {
        case 'start':
          await startSprint(sprint.id)
          break
        case 'pause':
          await pauseSprint(sprint.id)
          break
        case 'complete':
          await completeSprint(sprint.id)
          break
      }
    } catch (error) {
      console.error(`${action} sprint failed:`, error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'secondary',
      active: 'warning',
      completed: 'success',
      cancelled: 'error',
      paused: 'secondary'
    }
    return colors[status as keyof typeof colors] || 'secondary'
  }

  const getStatusText = (status: string) => {
    const texts = {
      draft: '草稿',
      active: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      paused: '已暂停'
    }
    return texts[status as keyof typeof texts] || status
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = calculateDaysRemaining(sprint.endDate)

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/sprints')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回列表
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{sprint.title}</h1>
                <Badge variant={getStatusColor(sprint.status) as any}>
                  {getStatusText(sprint.status)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {sprint.description}
              </p>
            </div>
            <div className="flex gap-2">
              {sprint.status === 'draft' && (
                <Button onClick={() => handleSprintAction('start')}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  开始冲刺
                </Button>
              )}
              {sprint.status === 'active' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleSprintAction('pause')}
                  >
                    <PauseIcon className="h-4 w-4 mr-2" />
                    暂停
                  </Button>
                  <Button onClick={() => handleSprintAction('complete')}>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    完成
                  </Button>
                </>
              )}
              {sprint.status === 'paused' && (
                <Button onClick={() => handleSprintAction('start')}>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  继续
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push(`/sprints/${sprintId}/edit`)}
              >
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                编辑冲刺
              </Button>
            </div>
          </div>

          {/* 冲刺概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">时间范围</p>
                    <p className="font-semibold">
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">剩余时间</p>
                    <p className="font-semibold">
                      {daysRemaining > 0 ? `${daysRemaining} 天` : '已到期'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ListBulletIcon className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">任务进度</p>
                    <p className="font-semibold">
                      {sprint.stats.completedTasks} / {sprint.stats.totalTasks}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-8 w-8 text-info" />
                  <div>
                    <p className="text-sm text-muted-foreground">完成率</p>
                    <p className="font-semibold">{sprint.progress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 进度条 */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">整体进度</h3>
                  <span className="text-2xl font-bold text-primary">{sprint.progress}%</span>
                </div>
                <Progress value={sprint.progress} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>开始日期: {formatDate(sprint.startDate)}</span>
                  <span>结束日期: {formatDate(sprint.endDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主要内容区域 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListBulletIcon className="h-4 w-4" />
                任务管理
              </TabsTrigger>
              <TabsTrigger value="milestones" className="flex items-center gap-2">
                <FlagIcon className="h-4 w-4" />
                里程碑
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                数据分析
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Cog6ToothIcon className="h-4 w-4" />
                设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              {sprintId && <TaskManager sprintId={sprintId} />}
            </TabsContent>

            <TabsContent value="milestones" className="mt-6">
              {sprintId && <MilestoneManager sprintId={sprintId} />}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>数据分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">数据分析功能</h3>
                    <p className="text-muted-foreground">
                      即将推出详细的数据分析和可视化功能
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>冲刺设置</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Cog6ToothIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">冲刺设置</h3>
                    <p className="text-muted-foreground">
                      即将推出冲刺配置和管理功能
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 错误提示 */}
          {error && (
            <div className="fixed bottom-4 right-4 p-4 bg-error text-white rounded-md shadow-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  )
}
