'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui"
import { useAuthStore } from "@/stores"
import AIPlanGenerator from "@/components/ai/AIPlanGenerator"
import AIUsageDisplay from "@/components/ai/AIUsageDisplay"
import type { AIGeneratedPlan } from "@/lib/ai-plan-generator"
import { SparklesIcon, ArrowLeftIcon, BookOpenIcon, RocketLaunchIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function AIGeneratorPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null)

  const handlePlanGenerated = (plan: AIGeneratedPlan) => {
    setGeneratedPlan(plan)
    setShowGenerator(false)
    
    // TODO: 这里可以将计划保存到数据库或导航到创建冲刺页面
    console.log('Generated plan:', plan)
  }

  const handleCreateSprint = () => {
    if (generatedPlan) {
      // TODO: 导航到冲刺创建页面，并传递生成的计划数据
      router.push('/sprints/create?from=ai')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">需要登录</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              请先登录以使用AI计划生成功能
            </p>
            <Button onClick={() => router.push('/auth')}>
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showGenerator) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowGenerator(false)}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          
          <AIPlanGenerator 
            onPlanGenerated={handlePlanGenerated}
            onClose={() => setShowGenerator(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>返回</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/sprints/create')}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>创建冲刺</span>
            </Button>
          </div>
        </div>

        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
            <SparklesIcon className="h-8 w-8 text-primary" />
            <span>AI智能计划生成</span>
          </h1>
          <p className="text-muted-foreground">
            让AI帮你制定个性化的冲刺计划，提高学习和工作效率
          </p>
        </div>

        {/* 使用情况 */}
        <div className="max-w-md mx-auto">
          <AIUsageDisplay />
        </div>

        {/* 功能介绍 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpenIcon className="h-5 w-5 text-primary" />
                <span>智能分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>根据目标和难度智能分解任务</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>合理安排时间和优先级</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>提供个性化学习建议</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RocketLaunchIcon className="h-5 w-5 text-primary" />
                <span>快速上手</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>多种预设模板快速开始</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>支持自定义需求和约束</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                  <span>一键生成完整冲刺计划</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 生成的计划预览 */}
        {generatedPlan && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-primary" />
                  <span>AI生成的计划</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    生成成功
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGenerator(true)}
                  >
                    重新生成
                  </Button>
                  <Button onClick={handleCreateSprint}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    创建冲刺
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{generatedPlan.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedPlan.description}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>📋 {generatedPlan.tasks.length} 个任务</span>
                  <span>⏱️ {generatedPlan.totalEstimatedHours} 小时</span>
                  <span>📅 建议每日 {generatedPlan.dailyHoursRecommendation} 小时</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedPlan.tasks.slice(0, 4).map((task, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {task.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {generatedPlan.tasks.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center">
                    还有 {generatedPlan.tasks.length - 4} 个任务...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 操作区域 */}
        <div className="text-center space-y-4">
          {!generatedPlan ? (
            <Button
              size="lg"
              onClick={() => setShowGenerator(true)}
              className="px-8"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              开始生成计划
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                🎉 计划生成完成！选择下一步操作：
              </p>
              <div className="flex justify-center space-x-3">
                <Button
                  size="lg"
                  onClick={handleCreateSprint}
                  className="px-6"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  立即创建冲刺
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowGenerator(true)}
                  className="px-6"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  重新生成计划
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <h4 className="font-medium">描述目标</h4>
                <p className="text-muted-foreground">
                  清晰描述你想要达成的目标，越具体越好
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">2</span>
                </div>
                <h4 className="font-medium">设置参数</h4>
                <p className="text-muted-foreground">
                  选择持续时间、难度级别和相关类别
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">3</span>
                </div>
                <h4 className="font-medium">生成计划</h4>
                <p className="text-muted-foreground">
                  AI将生成详细的任务清单和执行建议
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
