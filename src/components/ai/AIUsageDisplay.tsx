'use client'

import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui"
import { useAIUsageDisplay } from "@/hooks/useAIUsage"
import { SparklesIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface AIUsageDisplayProps {
  showUpgradeButton?: boolean
  compact?: boolean
}

export default function AIUsageDisplay({ 
  showUpgradeButton = true, 
  compact = false 
}: AIUsageDisplayProps) {
  const {
    stats,
    statusColor,
    statusText,
    formatRemaining,
    getUsageProgress,
    getUpgradeRecommendation,
    hasUnlimitedAccess,
    isLoading,
    error
  } = useAIUsageDisplay()

  if (isLoading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">加载使用情况...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="flex items-center space-x-2 text-error">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = getUsageProgress()
  const upgradeRecommendation = getUpgradeRecommendation()

  const getStatusIcon = () => {
    switch (statusColor) {
      case 'green':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'yellow':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'red':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <SparklesIcon className="h-4 w-4 text-primary" />
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">AI使用情况</span>
          <Badge variant={statusColor === 'green' ? 'default' : 'destructive'}>
            {statusText}
          </Badge>
        </div>
        
        {!hasUnlimitedAccess && (
          <div className="text-xs text-muted-foreground">
            今日: {stats.dailyUsed}/{formatRemaining(stats.dailyLimit)} | 
            本月: {stats.monthlyUsed}/{formatRemaining(stats.monthlyLimit)}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span>AI使用情况</span>
          <Badge variant={statusColor === 'green' ? 'default' : 'destructive'}>
            {statusText}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasUnlimitedAccess ? (
          <div className="text-center py-4">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-green-600">无限制使用</p>
            <p className="text-sm text-muted-foreground">管理员账户享有无限AI生成权限</p>
          </div>
        ) : (
          <>
            {/* 日使用情况 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">今日使用</span>
                <span className="text-sm text-muted-foreground">
                  {stats.dailyUsed} / {formatRemaining(stats.dailyLimit)}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.daily >= 100 ? 'bg-red-500' :
                    progress.daily >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(progress.daily, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                剩余 {formatRemaining(stats.dailyRemaining)} 次
              </p>
            </div>

            {/* 月使用情况 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">本月使用</span>
                <span className="text-sm text-muted-foreground">
                  {stats.monthlyUsed} / {formatRemaining(stats.monthlyLimit)}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.monthly >= 100 ? 'bg-red-500' :
                    progress.monthly >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(progress.monthly, 100)}%` }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                剩余 {formatRemaining(stats.monthlyRemaining)} 次
              </p>
            </div>
          </>
        )}

        {/* 升级建议 */}
        {upgradeRecommendation && showUpgradeButton && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start space-x-2">
              <SparklesIcon className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  建议升级到 {upgradeRecommendation.recommendedLevel === 'premium' ? '高级版' : '管理员'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  您的使用量较高，升级后可享受更多AI生成次数
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                  {upgradeRecommendation.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-primary rounded-full"></span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {showUpgradeButton && (
              <Button 
                size="sm" 
                className="w-full mt-3"
                onClick={() => {
                  // TODO: 实现升级功能
                  alert('升级功能即将推出')
                }}
              >
                立即升级
              </Button>
            )}
          </div>
        )}

        {/* 使用提示 */}
        {!hasUnlimitedAccess && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p>💡 提示：AI生成次数每日和每月会自动重置</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
