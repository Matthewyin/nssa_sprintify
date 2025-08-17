'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Progress } from "@/components/ui"
import { SprintInfo } from "@/types/sprint"
import { 
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface CountdownTimerProps {
  sprint: SprintInfo
  showProgress?: boolean
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
}

export function CountdownTimer({ sprint, showProgress = true, compact = false }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const endTime = new Date(sprint.endDate).getTime()
      const difference = endTime - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true
        })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)
      const totalSeconds = Math.floor(difference / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        isExpired: false
      })
    }

    // 立即计算一次
    calculateTimeRemaining()

    // 每秒更新
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [sprint.endDate, isClient])

  const getUrgencyLevel = (): 'normal' | 'warning' | 'critical' | 'expired' => {
    if (timeRemaining.isExpired) return 'expired'
    if (timeRemaining.days <= 1) return 'critical'
    if (timeRemaining.days <= 3) return 'warning'
    return 'normal'
  }

  const getUrgencyColor = () => {
    const level = getUrgencyLevel()
    switch (level) {
      case 'expired': return 'text-muted-foreground'
      case 'critical': return 'text-error'
      case 'warning': return 'text-warning'
      default: return 'text-primary'
    }
  }

  const getUrgencyBgColor = () => {
    const level = getUrgencyLevel()
    switch (level) {
      case 'expired': return 'bg-muted/50'
      case 'critical': return 'bg-error/10 border-error/20'
      case 'warning': return 'bg-warning/10 border-warning/20'
      default: return 'bg-primary/10 border-primary/20'
    }
  }

  const getProgressPercentage = (): number => {
    const startTime = new Date(sprint.startDate).getTime()
    const endTime = new Date(sprint.endDate).getTime()
    const now = new Date().getTime()
    
    const totalDuration = endTime - startTime
    const elapsed = now - startTime
    
    if (elapsed <= 0) return 0
    if (elapsed >= totalDuration) return 100
    
    return Math.round((elapsed / totalDuration) * 100)
  }

  const formatTimeUnit = (value: number, unit: string): string => {
    return `${value.toString().padStart(2, '0')}${unit}`
  }

  const getStatusMessage = (): string => {
    if (timeRemaining.isExpired) {
      return sprint.status === 'completed' ? '冲刺已完成' : '冲刺已过期'
    }
    
    const level = getUrgencyLevel()
    switch (level) {
      case 'critical':
        return '⚠️ 冲刺即将结束！'
      case 'warning':
        return '⏰ 冲刺进入倒计时'
      default:
        return '🚀 冲刺进行中'
    }
  }

  if (!isClient) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${getUrgencyBgColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className={`h-4 w-4 ${getUrgencyColor()}`} />
            <span className="text-sm font-medium">
              {timeRemaining.isExpired ? '已结束' : `${timeRemaining.days}天 ${timeRemaining.hours}:${timeRemaining.minutes.toString().padStart(2, '0')}`}
            </span>
          </div>
          {timeRemaining.isExpired && sprint.status === 'completed' && (
            <CheckCircleIcon className="h-4 w-4 text-success" />
          )}
          {timeRemaining.isExpired && sprint.status !== 'completed' && (
            <ExclamationTriangleIcon className="h-4 w-4 text-error" />
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`border ${getUrgencyBgColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className={`h-5 w-5 ${getUrgencyColor()}`} />
          冲刺倒计时
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 状态消息 */}
        <div className="text-center">
          <p className={`text-sm font-medium ${getUrgencyColor()}`}>
            {getStatusMessage()}
          </p>
        </div>

        {/* 倒计时显示 */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className={`text-2xl font-bold font-mono ${getUrgencyColor()}`}>
              {formatTimeUnit(timeRemaining.days, '')}
            </div>
            <div className="text-xs text-muted-foreground">天</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold font-mono ${getUrgencyColor()}`}>
              {formatTimeUnit(timeRemaining.hours, '')}
            </div>
            <div className="text-xs text-muted-foreground">时</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold font-mono ${getUrgencyColor()}`}>
              {formatTimeUnit(timeRemaining.minutes, '')}
            </div>
            <div className="text-xs text-muted-foreground">分</div>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold font-mono ${getUrgencyColor()}`}>
              {formatTimeUnit(timeRemaining.seconds, '')}
            </div>
            <div className="text-xs text-muted-foreground">秒</div>
          </div>
        </div>

        {/* 时间进度条 */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>时间进度</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <Progress 
              value={getProgressPercentage()} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(sprint.startDate).toLocaleDateString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(sprint.endDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        )}

        {/* 冲刺信息 */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-1">{sprint.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {sprint.description}
          </p>
        </div>

        {/* 紧急提醒 */}
        {getUrgencyLevel() === 'critical' && !timeRemaining.isExpired && (
          <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-error">紧急提醒</p>
              <p className="text-error/80">
                冲刺即将在 {timeRemaining.days > 0 ? `${timeRemaining.days}天` : `${timeRemaining.hours}小时`} 内结束，请抓紧时间完成剩余任务！
              </p>
            </div>
          </div>
        )}

        {/* 过期提醒 */}
        {timeRemaining.isExpired && sprint.status !== 'completed' && (
          <div className="flex items-center gap-2 p-3 bg-muted border rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-muted-foreground">冲刺已过期</p>
              <p className="text-muted-foreground">
                建议尽快完成或调整冲刺计划
              </p>
            </div>
          </div>
        )}

        {/* 完成庆祝 */}
        {timeRemaining.isExpired && sprint.status === 'completed' && (
          <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-success">🎉 冲刺完成</p>
              <p className="text-success/80">
                恭喜您成功完成了这个冲刺！
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
