'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from "@/components/ui"
import { Navigation } from "@/components/navigation"
import { PermissionGuard } from "@/components/permission-guard"
import { useSprintStore } from "@/stores/sprint-store"
import { SPRINT_TEMPLATES, getTemplateInfo, calculateTemplateRecommendations } from "@/lib/sprint-templates"
import { SprintType, SprintTemplate, SprintDifficulty, CreateSprintRequest } from "@/types/sprint"
import { isValidSprintTitle, isValidDateRange } from "@/lib/validations"
import AIPlanGenerator from "@/components/ai/AIPlanGenerator"
import type { AIGeneratedPlan } from "@/lib/ai-plan-generator"
import {
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

export default function CreateSprintPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createSprint, isCreating, error, clearError } = useSprintStore()

  const [formData, setFormData] = useState<CreateSprintRequest>({
    title: '',
    description: '',
    type: 'learning',
    template: '30days',
    difficulty: 'intermediate',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天后
    duration: 30,
    tags: []
  })

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<SprintTemplate>('30days')
  const [customDuration, setCustomDuration] = useState<number>(30)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<AIGeneratedPlan | null>(null)

  // 检查是否从AI生成页面跳转过来
  const fromAI = searchParams.get('from') === 'ai'

  // 清除错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // 获取模板信息和推荐配置
  const templateInfo = getTemplateInfo(selectedTemplate)
  const recommendations = calculateTemplateRecommendations(
    selectedTemplate, 
    selectedTemplate === 'custom' ? customDuration : undefined
  )

  const validateForm = () => {
    const errors: Record<string, string[]> = {}

    // 验证标题
    const titleValidation = isValidSprintTitle(formData.title)
    if (!titleValidation.isValid) {
      errors.title = titleValidation.errors
    }

    // 验证描述（简单验证）
    if (formData.description.length > 1000) {
      errors.description = ['描述不能超过1000个字符']
    }

    // 验证日期
    const endDate = new Date(formData.startDate.getTime() + recommendations.duration * 24 * 60 * 60 * 1000)
    const dateValidation = isValidDateRange(
      formData.startDate.toISOString(),
      endDate.toISOString()
    )
    if (!dateValidation.isValid) {
      errors.dates = dateValidation.errors
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      // 如果有AI生成的计划，根据任务数量和每日推荐时长计算持续时间
      let finalDuration = recommendations.duration
      if (aiGeneratedPlan) {
        // 基于每日推荐时长和总时长计算天数，最少3天，最多90天
        const calculatedDays = Math.ceil(aiGeneratedPlan.totalEstimatedHours / aiGeneratedPlan.dailyHoursRecommendation)
        finalDuration = Math.max(3, Math.min(90, calculatedDays))
      }
      const finalTemplate = aiGeneratedPlan ? 'custom' : selectedTemplate

      const sprintRequest: CreateSprintRequest = {
        ...formData,
        template: finalTemplate,
        duration: finalDuration,
        endDate: new Date(formData.startDate.getTime() + finalDuration * 24 * 60 * 60 * 1000),
        // 如果有AI生成的任务，添加到请求中
        ...(aiGeneratedPlan && {
          aiGeneratedTasks: aiGeneratedPlan.tasks,
          aiPlanMetadata: {
            totalEstimatedHours: aiGeneratedPlan.totalEstimatedHours,
            dailyHoursRecommendation: aiGeneratedPlan.dailyHoursRecommendation
          }
        })
      }

      console.log('🔍 发送的Sprint数据:', sprintRequest)
      console.log('🔍 各字段检查:', {
        title: sprintRequest.title,
        description: sprintRequest.description,
        type: sprintRequest.type,
        template: sprintRequest.template,
        startDate: sprintRequest.startDate,
        endDate: sprintRequest.endDate,
        duration: sprintRequest.duration,
        finalDuration,
        aiGeneratedPlan: !!aiGeneratedPlan
      })

      // 验证必需字段
      if (!sprintRequest.endDate) {
        console.error('❌ endDate 缺失:', sprintRequest.endDate)
        throw new Error('结束日期计算失败')
      }

      const newSprint = await createSprint(sprintRequest)
      router.push(`/sprints/${newSprint.id}`)
    } catch (error) {
      console.error('创建冲刺失败:', error)

      // 检查是否是重复名称错误
      if (error instanceof Error && error.message.includes('冲刺名称已存在')) {
        setFormErrors(prev => ({
          ...prev,
          title: ['冲刺名称已存在，请使用不同的名称']
        }))
      }
    }
  }

  const handleInputChange = (field: keyof CreateSprintRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误信息
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: []
      }))
    }
  }

  const handleTemplateChange = (template: SprintTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      template
    }))
  }

  // 处理AI生成的计划
  const handleAIPlanGenerated = (plan: AIGeneratedPlan) => {
    setAiGeneratedPlan(plan)
    // 不要立即关闭AI生成器，让用户看到生成的计划
    // setShowAIGenerator(false)

    // 自动填充表单数据
    setFormData(prev => ({
      ...prev,
      title: plan.title,
      description: plan.description,
      // 根据AI计划的总时长推断模板
      template: plan.totalEstimatedHours <= 40 ? '7days' :
                plan.totalEstimatedHours <= 80 ? '21days' : '30days'
    }))

    // 根据AI计划推断模板
    const estimatedDays = Math.ceil(plan.totalEstimatedHours / plan.dailyHoursRecommendation)
    if (estimatedDays <= 7) {
      setSelectedTemplate('7days')
    } else if (estimatedDays <= 21) {
      setSelectedTemplate('21days')
    } else {
      setSelectedTemplate('30days')
    }
  }

  // 处理使用AI计划
  const handleUseAIPlan = () => {
    setShowAIGenerator(false)
    // 表单数据已经在handleAIPlanGenerated中填充了
  }

  const getDifficultyColor = (difficulty: SprintDifficulty) => {
    const colors = {
      beginner: 'success',
      intermediate: 'warning', 
      advanced: 'error',
      expert: 'secondary'
    }
    return colors[difficulty] || 'secondary'
  }

  const getTypeIcon = (type: SprintType) => {
    return type === 'learning' ? AcademicCapIcon : BriefcaseIcon
  }

  return (
    <PermissionGuard requireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">创建冲刺计划</h1>
                <p className="text-muted-foreground mt-1">
                  制定您的短期目标，开始高效冲刺
                </p>
              </div>
            </div>

            {/* AI生成按钮 */}
            <Button
              variant="outline"
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center space-x-2"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>AI生成计划</span>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左侧：基本信息 */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI生成计划预览 */}
                {aiGeneratedPlan && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-primary" />
                        <span>AI生成的计划</span>
                        <Badge variant="outline">已应用</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{aiGeneratedPlan.title}</p>
                        <p className="text-muted-foreground mt-1">{aiGeneratedPlan.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="bg-background px-2 py-1 rounded">
                          📋 {aiGeneratedPlan.tasks.length} 个任务
                        </span>
                        <span className="bg-background px-2 py-1 rounded">
                          ⏱️ {aiGeneratedPlan.totalEstimatedHours} 小时
                        </span>
                        <span className="bg-background px-2 py-1 rounded">
                          📅 每日 {aiGeneratedPlan.dailyHoursRecommendation} 小时
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAIGenerator(true)}
                        >
                          重新生成
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAiGeneratedPlan(null)}
                        >
                          移除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        冲刺标题 *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="例如：30天掌握React开发"
                        className={formErrors.title?.length ? 'border-error' : ''}
                      />
                      {formErrors.title?.map((error, index) => (
                        <p key={index} className="text-sm text-error mt-1">{error}</p>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        冲刺描述
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="详细描述您的冲刺目标和计划..."
                        rows={4}
                        className={`w-full px-3 py-2 border border-input rounded-md bg-background ${
                          formErrors.description?.length ? 'border-error' : ''
                        }`}
                      />
                      {formErrors.description?.map((error, index) => (
                        <p key={index} className="text-sm text-error mt-1">{error}</p>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          冲刺类型 *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['learning', 'project'] as SprintType[]).map((type) => {
                            const Icon = getTypeIcon(type)
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleInputChange('type', type)}
                                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                                  formData.type === type
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-input hover:bg-muted'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">
                                  {type === 'learning' ? '学习模式' : '项目模式'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          开始日期 *
                        </label>
                        <Input
                          type="date"
                          value={formData.startDate.toISOString().split('T')[0]}
                          onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                          min={new Date().toISOString().split('T')[0]}
                          className={formErrors.dates?.length ? 'border-error' : ''}
                        />
                        {formErrors.dates?.map((error, index) => (
                          <p key={index} className="text-sm text-error mt-1">{error}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 模板选择 */}
                <Card>
                  <CardHeader>
                    <CardTitle>选择模板</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(SPRINT_TEMPLATES).map(([templateId, template]) => (
                        <button
                          key={templateId}
                          type="button"
                          onClick={() => handleTemplateChange(templateId as SprintTemplate)}
                          className={`p-4 border rounded-lg text-left transition-colors ${
                            selectedTemplate === templateId
                              ? 'border-primary bg-primary/10'
                              : 'border-input hover:bg-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant={getDifficultyColor(template.difficulty) as any}>
                              {template.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {template.duration || customDuration}天
                            </span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {template.recommendedTasks}任务
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedTemplate === 'custom' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          自定义天数
                        </label>
                        <Input
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          min={1}
                          max={365}
                          placeholder="输入天数"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 右侧：模板详情和推荐 */}
              <div className="space-y-6">
                {/* 模板详情 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <StarIcon className="h-5 w-5" />
                      模板详情
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{templateInfo.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {templateInfo.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>持续时间:</span>
                        <span>{recommendations.duration}天</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>推荐任务数:</span>
                        <span>{recommendations.recommendedTasks}个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>推荐里程碑:</span>
                        <span>{recommendations.recommendedMilestones}个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>每日投入:</span>
                        <span>{Math.floor(recommendations.dailyTimeCommitment / 60)}小时</span>
                      </div>
                    </div>

                    {templateInfo.phases.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">阶段规划:</h5>
                        <div className="space-y-2">
                          {templateInfo.phases.map((phase, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">{phase.name}</span>
                                <span className="text-muted-foreground">{phase.duration}天</span>
                              </div>
                              <p className="text-muted-foreground text-xs">
                                {phase.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 成功要素 */}
                <Card>
                  <CardHeader>
                    <CardTitle>成功要素</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {templateInfo.successFactors.map((factor, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* 提交按钮 */}
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? '创建中...' : '创建冲刺'}
                  </Button>
                  
                  {error && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* AI生成器模态框 */}
        {showAIGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <AIPlanGenerator
                onPlanGenerated={handleAIPlanGenerated}
                onClose={() => setShowAIGenerator(false)}
                onUsePlan={handleUseAIPlan}
              />
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
