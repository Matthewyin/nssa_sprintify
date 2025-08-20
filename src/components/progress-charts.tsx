'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Progress } from "@/components/ui"
import { useSprintStore } from "@/stores/sprint-store"
import { SprintInfo } from "@/types/sprint"

interface ProgressChartsProps {
  sprints: SprintInfo[]
}

export function ProgressCharts({ sprints }: ProgressChartsProps) {
  const [chartData, setChartData] = useState({
    dailyProgress: [] as { date: string; completed: number; total: number; productivity: number }[],
    categoryBreakdown: [] as { category: string; count: number; percentage: number }[],
    timeDistribution: [] as { period: string; hours: number }[],
    completionTrend: [] as { date: string; rate: number }[]
  })

  useEffect(() => {
    if (sprints.length > 0) {
      generateChartData()
    }
  }, [sprints])

  const generateChartData = () => {
    // 生成7天生产力数据
    const dailyProgress = generateDailyProgress()

    // 生成分类统计
    const categoryBreakdown = generateCategoryBreakdown()

    // 生成时间分布
    const timeDistribution = generateTimeDistribution()

    // 生成完成趋势
    const completionTrend = generateCompletionTrend()

    setChartData({
      dailyProgress,
      categoryBreakdown,
      timeDistribution,
      completionTrend
    })
  }

  const generateDailyProgress = () => {
    const days = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now)
      dayDate.setDate(now.getDate() - i)
      dayDate.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayDate)
      dayEnd.setHours(23, 59, 59, 999)

      // 获取当天的冲刺数据
      const daySprints = sprints.filter(sprint => {
        const sprintDate = new Date(sprint.createdAt)
        return sprintDate >= dayDate && sprintDate <= dayEnd
      })

      // 获取当天完成的任务数据 - 暂时返回空数组，因为SprintInfo没有tasks属性
      const dayTasks: any[] = []

      const completed = dayTasks.length
      const total = daySprints.length // 暂时使用冲刺数量作为总数

      // 计算生产力指数（完成任务数 + 冲刺活跃度）
      const productivity = completed + (daySprints.filter(s => s.status === 'completed').length * 2)

      days.push({
        date: `${dayDate.getMonth() + 1}月${dayDate.getDate()}日`,
        completed,
        total,
        productivity
      })
    }

    return days
  }

  const generateCategoryBreakdown = () => {
    const categories = sprints.reduce((acc, sprint) => {
      const category = sprint.type === 'learning' ? '学习' : '项目'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = sprints.length
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
  }

  const generateTimeDistribution = () => {
    const periods = ['早晨', '上午', '下午', '晚上']
    const distribution = periods.map(period => ({
      period,
      hours: Math.floor(Math.random() * 8) + 1 // 模拟数据
    }))
    
    return distribution
  }

  const generateCompletionTrend = () => {
    const trend = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      
      const dayTasks = Math.floor(Math.random() * 10) + 1
      const completedTasks = Math.floor(Math.random() * dayTasks)
      const rate = dayTasks > 0 ? Math.round((completedTasks / dayTasks) * 100) : 0
      
      trend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        rate
      })
    }
    
    return trend
  }

  const getMaxValue = (data: any[], key: string) => {
    return Math.max(...data.map(item => item[key]), 1)
  }

  return (
    <div className="space-y-6">
      {/* 7天生产力趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>7天生产力趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 柱状图 */}
            <div className="flex items-end justify-between h-32 gap-2">
              {chartData.dailyProgress.map((day, index) => {
                const maxProductivity = Math.max(...chartData.dailyProgress.map(d => d.productivity), 1)
                const heightPx = Math.max(4, (day.productivity / maxProductivity) * 120) // 固定像素高度

                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-primary rounded-t w-full flex items-end justify-center"
                      style={{ height: `${heightPx}px` }}
                      title={`${day.date}: 完成${day.completed}个任务，生产力指数${day.productivity}`}
                    >
                      {day.productivity > 0 && (
                        <span className="text-xs text-white font-medium mb-1">
                          {day.productivity}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-2 text-center">
                      {day.date.replace('月', '/').replace('日', '')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">总完成任务</p>
                <p className="text-lg font-semibold">
                  {chartData.dailyProgress.reduce((sum, day) => sum + day.completed, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">平均生产力</p>
                <p className="text-lg font-semibold">
                  {Math.round(chartData.dailyProgress.reduce((sum, day) => sum + day.productivity, 0) / 7)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">最高生产力</p>
                <p className="text-lg font-semibold">
                  {Math.max(...chartData.dailyProgress.map(d => d.productivity))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle>冲刺类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{category.category}</span>
                  <span>{category.count} ({category.percentage}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0 ? 'bg-primary' : 'bg-success'
                    }`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 时间分布 */}
      <Card>
        <CardHeader>
          <CardTitle>时间分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.timeDistribution.map((period, index) => {
              const maxHours = getMaxValue(chartData.timeDistribution, 'hours')
              const percentage = (period.hours / maxHours) * 100
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{period.period}</span>
                    <span>{period.hours}小时</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 完成率趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>30天完成率趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end justify-between gap-1">
            {chartData.completionTrend.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                  style={{ 
                    height: `${day.rate}%`,
                    minHeight: '2px'
                  }}
                  title={`${day.date}: ${day.rate}%`}
                />
                {index % 5 === 0 && (
                  <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                    {day.date}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </CardContent>
      </Card>

      {/* 成就统计 */}
      <Card>
        <CardHeader>
          <CardTitle>成就统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {sprints.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">完成的冲刺</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {sprints.reduce((sum, s) => sum + (s.stats.completedMilestones || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">达成的里程碑</div>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {sprints.reduce((sum, s) => sum + s.stats.completedTasks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">完成的任务</div>
            </div>
            <div className="text-center p-4 bg-error/10 rounded-lg">
              <div className="text-2xl font-bold text-error">
                {sprints.reduce((sum, s) => sum + (s.stats.totalTime || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">总投入时间(分钟)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
