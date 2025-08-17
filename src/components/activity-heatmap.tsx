'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"
import { SprintInfo } from "@/types/sprint"

interface ActivityHeatmapProps {
  sprints: SprintInfo[]
  showLegend?: boolean
}

interface DayActivity {
  date: string
  level: number // 0-4 活动强度等级
  count: number // 实际活动数量
  tasks: number // 完成的任务数
}

export function ActivityHeatmap({ sprints, showLegend = true }: ActivityHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<DayActivity[]>([])
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null)

  useEffect(() => {
    generateHeatmapData()
  }, [sprints])

  const generateHeatmapData = () => {
    const data: DayActivity[] = []
    const today = new Date()
    
    // 生成过去365天的数据
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      // 计算这一天的活动
      const dayActivity = calculateDayActivity(date)
      
      data.push({
        date: date.toISOString().split('T')[0],
        level: getActivityLevel(dayActivity.count),
        count: dayActivity.count,
        tasks: dayActivity.tasks
      })
    }
    
    setHeatmapData(data)
  }

  const calculateDayActivity = (date: Date) => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    
    // 计算这一天的活动：冲刺创建、任务完成等
    let count = 0
    let tasks = 0
    
    sprints.forEach(sprint => {
      const sprintDate = new Date(sprint.createdAt)
      if (sprintDate >= dayStart && sprintDate <= dayEnd) {
        count += 1 // 创建冲刺
      }
      
      if (sprint.completedAt) {
        const completedDate = new Date(sprint.completedAt)
        if (completedDate >= dayStart && completedDate <= dayEnd) {
          count += 2 // 完成冲刺权重更高
        }
      }
      
      // 模拟任务完成数据（实际应该从任务数据中获取）
      if (sprintDate >= dayStart && sprintDate <= dayEnd) {
        tasks += Math.floor(Math.random() * 5)
      }
    })
    
    return { count, tasks }
  }

  const getActivityLevel = (count: number): number => {
    if (count === 0) return 0
    if (count <= 2) return 1
    if (count <= 4) return 2
    if (count <= 6) return 3
    return 4
  }

  const getLevelColor = (level: number): string => {
    const colors = {
      0: 'bg-muted/30',
      1: 'bg-primary/20',
      2: 'bg-primary/40',
      3: 'bg-primary/60',
      4: 'bg-primary/80'
    }
    return colors[level as keyof typeof colors] || colors[0]
  }

  const getLevelDescription = (level: number): string => {
    const descriptions = {
      0: '无活动',
      1: '少量活动',
      2: '一般活动',
      3: '活跃',
      4: '非常活跃'
    }
    return descriptions[level as keyof typeof descriptions] || descriptions[0]
  }

  const getWeekdayLabel = (dayIndex: number): string => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return weekdays[dayIndex]
  }

  const getMonthLabel = (date: string): string => {
    const d = new Date(date)
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return months[d.getMonth()]
  }

  const groupDataByWeeks = () => {
    const weeks: DayActivity[][] = []
    let currentWeek: DayActivity[] = []
    
    heatmapData.forEach((day, index) => {
      const date = new Date(day.date)
      const dayOfWeek = date.getDay()
      
      // 如果是周日且不是第一天，开始新的一周
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push([...currentWeek])
        currentWeek = []
      }
      
      currentWeek.push(day)
      
      // 最后一天
      if (index === heatmapData.length - 1) {
        weeks.push(currentWeek)
      }
    })
    
    return weeks
  }

  const getMonthLabels = () => {
    const labels: { month: string; position: number }[] = []
    let lastMonth = ''
    
    heatmapData.forEach((day, index) => {
      const month = getMonthLabel(day.date)
      if (month !== lastMonth) {
        labels.push({ month, position: Math.floor(index / 7) })
        lastMonth = month
      }
    })
    
    return labels
  }

  const getTotalStats = () => {
    const totalDays = heatmapData.filter(day => day.level > 0).length
    const totalActivity = heatmapData.reduce((sum, day) => sum + day.count, 0)
    const maxStreak = calculateMaxStreak()
    const currentStreak = calculateCurrentStreak()
    
    return { totalDays, totalActivity, maxStreak, currentStreak }
  }

  const calculateMaxStreak = (): number => {
    let maxStreak = 0
    let currentStreak = 0
    
    heatmapData.forEach(day => {
      if (day.level > 0) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return maxStreak
  }

  const calculateCurrentStreak = (): number => {
    let streak = 0
    
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      if (heatmapData[i].level > 0) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const weeks = groupDataByWeeks()
  const monthLabels = getMonthLabels()
  const stats = getTotalStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle>活动热力图</CardTitle>
        <div className="text-sm text-muted-foreground">
          过去一年的活动情况
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">{stats.totalDays}</div>
            <div className="text-xs text-muted-foreground">活跃天数</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.totalActivity}</div>
            <div className="text-xs text-muted-foreground">总活动数</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.maxStreak}</div>
            <div className="text-xs text-muted-foreground">最长连续</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">当前连续</div>
          </div>
        </div>

        {/* 热力图 */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* 月份标签 */}
            <div className="flex mb-2">
              <div className="w-8"></div>
              <div className="flex-1 relative">
                {monthLabels.map((label, index) => (
                  <div
                    key={index}
                    className="absolute text-xs text-muted-foreground"
                    style={{ left: `${(label.position * 12)}px` }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>
            </div>

            {/* 热力图网格 */}
            <div className="flex">
              {/* 星期标签 */}
              <div className="w-8 space-y-1">
                {[1, 3, 5].map(day => (
                  <div key={day} className="h-3 text-xs text-muted-foreground flex items-center">
                    {getWeekdayLabel(day)}
                  </div>
                ))}
              </div>

              {/* 热力图格子 */}
              <div className="flex-1">
                <div className="flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="space-y-1">
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const day = week.find(d => new Date(d.date).getDay() === dayIndex)
                        return (
                          <div
                            key={dayIndex}
                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                              day ? getLevelColor(day.level) : 'bg-transparent'
                            }`}
                            title={day ? `${day.date}: ${day.count} 活动, ${day.tasks} 任务` : ''}
                            onClick={() => day && setSelectedDay(day)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        {showLegend && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              少
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                  title={getLevelDescription(level)}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              多
            </div>
          </div>
        )}

        {/* 选中日期详情 */}
        {selectedDay && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  {new Date(selectedDay.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDay.count} 个活动，{selectedDay.tasks} 个任务完成
                </p>
                <p className="text-xs text-muted-foreground">
                  活动等级：{getLevelDescription(selectedDay.level)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
