'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge, Progress } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useSprintStore } from "@/stores/sprint-store"
import { SprintInfo, SprintStatus, SprintType } from "@/types/sprint"
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'

export default function SprintsPage() {
  const router = useRouter()
  const { 
    sprints, 
    currentSprint,
    isLoading, 
    error, 
    loadSprints, 
    setCurrentSprint,
    startSprint,
    pauseSprint,
    completeSprint,
    clearError 
  } = useSprintStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SprintStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SprintType | 'all'>('all')

  useEffect(() => {
    loadSprints()
  }, [loadSprints])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // 筛选冲刺
  const filteredSprints = sprints.filter(sprint => {
    const matchesSearch = sprint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sprint.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sprint.status === statusFilter
    const matchesType = typeFilter === 'all' || sprint.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: SprintStatus) => {
    const colors = {
      draft: 'secondary',
      active: 'warning',
      completed: 'success',
      cancelled: 'error',
      paused: 'secondary'
    }
    return colors[status] || 'secondary'
  }

  const getStatusText = (status: SprintStatus) => {
    const texts = {
      draft: '草稿',
      active: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      paused: '已暂停'
    }
    return texts[status] || status
  }

  const getTypeIcon = (type: SprintType) => {
    return type === 'learning' ? AcademicCapIcon : BriefcaseIcon
  }

  const getTypeText = (type: SprintType) => {
    return type === 'learning' ? '学习模式' : '项目模式'
  }

  const handleSprintAction = async (sprintId: string, action: 'start' | 'pause' | 'complete') => {
    try {
      switch (action) {
        case 'start':
          await startSprint(sprintId)
          break
        case 'pause':
          await pauseSprint(sprintId)
          break
        case 'complete':
          await completeSprint(sprintId)
          break
      }
    } catch (error) {
      console.error(`${action} sprint failed:`, error)
    }
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

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">我的冲刺</h1>
              <p className="text-muted-foreground mt-1">
                管理您的冲刺计划和进度
              </p>
            </div>
            <Link href="/sprints/create">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                创建冲刺
              </Button>
            </Link>
          </div>

          {/* 当前活跃冲刺 */}
          {currentSprint && currentSprint.status === 'active' && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayIcon className="h-5 w-5 text-primary" />
                  当前冲刺
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{currentSprint.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        剩余 {calculateDaysRemaining(currentSprint.endDate)} 天
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>进度</span>
                        <span>{currentSprint.progress}%</span>
                      </div>
                      <Progress value={currentSprint.progress} className="h-2" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <Link href={`/sprints/${currentSprint.id}`}>
                      <Button>查看详情</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 搜索和筛选 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索冲刺标题或描述..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as SprintStatus | 'all')}
                    className="px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">所有状态</option>
                    <option value="draft">草稿</option>
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="paused">已暂停</option>
                    <option value="cancelled">已取消</option>
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as SprintType | 'all')}
                    className="px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">所有类型</option>
                    <option value="learning">学习模式</option>
                    <option value="project">项目模式</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 冲刺列表 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : filteredSprints.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? '没有找到匹配的冲刺' 
                    : '还没有冲刺计划'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? '尝试调整搜索条件或筛选器'
                    : '创建您的第一个冲刺计划，开始高效学习之旅'}
                </p>
                {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                  <Link href="/sprints/create">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      创建冲刺
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSprints.map((sprint) => {
                const TypeIcon = getTypeIcon(sprint.type)
                const daysRemaining = calculateDaysRemaining(sprint.endDate)
                
                return (
                  <Card key={sprint.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{sprint.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusColor(sprint.status) as any}>
                              {getStatusText(sprint.status)}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <TypeIcon className="h-3 w-3" />
                              {getTypeText(sprint.type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {sprint.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(sprint.startDate)}
                          </span>
                          {sprint.status === 'active' && (
                            <span className="flex items-center gap-1 text-warning">
                              <ClockIcon className="h-3 w-3" />
                              {daysRemaining > 0 ? `${daysRemaining}天` : '已到期'}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>进度</span>
                            <span>{sprint.progress}%</span>
                          </div>
                          <Progress value={sprint.progress} className="h-1.5" />
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Link href={`/sprints/${sprint.id}`}>
                            <Button variant="outline" size="sm">
                              查看详情
                            </Button>
                          </Link>
                          
                          <div className="flex gap-1">
                            {sprint.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleSprintAction(sprint.id, 'start')}
                              >
                                <PlayIcon className="h-3 w-3" />
                              </Button>
                            )}
                            {sprint.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSprintAction(sprint.id, 'pause')}
                                >
                                  <PauseIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSprintAction(sprint.id, 'complete')}
                                >
                                  <CheckIcon className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {sprint.status === 'paused' && (
                              <Button
                                size="sm"
                                onClick={() => handleSprintAction(sprint.id, 'start')}
                              >
                                <PlayIcon className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

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
