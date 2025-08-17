'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from "@/components/ui"
import { useAuthStore } from "@/stores"
import { useAIUsage } from "@/hooks/useAIUsage"
import { generateAIPlan, getAIGenerationTemplates } from "@/lib/ai-plan-generator"
import type { AIGenerationParams, AIGeneratedPlan } from "@/lib/ai-plan-generator"
import AIUsageDisplay from "./AIUsageDisplay"
import { SparklesIcon, ClockIcon, AcademicCapIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface AIPlanGeneratorProps {
  onPlanGenerated?: (plan: AIGeneratedPlan) => void
  onClose?: () => void
  onUsePlan?: () => void
}

export default function AIPlanGenerator({ onPlanGenerated, onClose, onUsePlan }: AIPlanGeneratorProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { canUse, refresh: refreshUsage } = useAIUsage()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null)
  
  const [formData, setFormData] = useState<AIGenerationParams>({
    goal: '',
    duration: 14,
    difficulty: 'intermediate',
    category: '学习',
    description: '',
    preferences: [],
    constraints: []
  })

  const templates = getAIGenerationTemplates()

  const handleInputChange = (field: keyof AIGenerationParams, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      ...template.params
    }))
  }

  const handleGenerate = async () => {
    if (!isAuthenticated || !user) {
      setError('请先登录')
      return
    }

    if (!canUse) {
      setError('AI使用次数已达限制')
      return
    }

    if (!formData.goal.trim()) {
      setError('请输入目标描述')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const plan = await generateAIPlan(formData, user.id, user.userType)
      setGeneratedPlan(plan)
      
      // 刷新使用情况
      await refreshUsage()
      
      // 通知父组件
      if (onPlanGenerated) {
        onPlanGenerated(plan)
      }
    } catch (error) {
      console.error('AI生成失败:', error)
      setError(error instanceof Error ? error.message : 'AI生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUsePlan = () => {
    if (onUsePlan) {
      onUsePlan()
    } else {
      // 兼容旧的行为
      if (generatedPlan && onPlanGenerated) {
        onPlanGenerated(generatedPlan)
      }
      if (onClose) {
        onClose()
      }
    }
  }

  const handleRegenerate = () => {
    setGeneratedPlan(null)
    handleGenerate()
  }

  if (generatedPlan) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <span>AI生成的计划</span>
            <Badge variant="outline">已生成</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 计划概览 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{generatedPlan.title}</h3>
              <p className="text-muted-foreground mt-1">{generatedPlan.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span>总时长: {generatedPlan.totalEstimatedHours} 小时</span>
              </div>
              <div className="flex items-center space-x-1">
                <AcademicCapIcon className="h-4 w-4 text-muted-foreground" />
                <span>建议每日: {generatedPlan.dailyHoursRecommendation} 小时</span>
              </div>
              <Badge variant="outline">
                {generatedPlan.tasks.length} 个任务
              </Badge>
            </div>
          </div>

          {/* 任务列表 */}
          <div className="space-y-3">
            <h4 className="font-medium">任务清单</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedPlan.tasks.map((task, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{task.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-4">
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {task.estimatedHours}h
                      </span>
                      {task.day && (
                        <span className="text-xs text-muted-foreground">
                          第{task.day}天
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 建议 */}
          {generatedPlan.tips.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">实用建议</h4>
              <ul className="space-y-1">
                {generatedPlan.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex space-x-3">
              <Button onClick={handleUsePlan} className="flex-1">
                <PlusIcon className="h-4 w-4 mr-2" />
                使用此计划创建冲刺
              </Button>
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={!canUse || isGenerating}
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                重新生成
              </Button>
            </div>

            {onClose && (
              <div className="text-center">
                <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  返回上一页
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <span>AI智能计划生成</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 使用情况显示 */}
        <AIUsageDisplay compact />

        {/* 快速模板 */}
        <div className="space-y-3">
          <h4 className="font-medium">快速模板</h4>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className="text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* 生成表单 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">目标描述 *</label>
            <Input
              placeholder="例如：学习React开发，掌握基础概念和实践"
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">持续时间（天）</label>
              <Input
                type="number"
                min="1"
                max="90"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 14)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">难度级别</label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value as any)}
              >
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">类别</label>
            <Input
              placeholder="例如：学习、项目、考试、健康等"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">详细描述（可选）</label>
            <textarea
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
              placeholder="提供更多背景信息，帮助AI生成更精准的计划..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 生成按钮 */}
        <div className="flex space-x-3">
          <Button 
            onClick={handleGenerate}
            disabled={!canUse || isGenerating || !formData.goal.trim()}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                AI生成中...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                生成计划
              </>
            )}
          </Button>
          
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md space-y-2">
          <p>💡 <strong>AI将为您生成：</strong></p>
          <ul className="space-y-1 ml-4">
            <li>• 个性化的冲刺计划标题和描述</li>
            <li>• 详细的任务分解和时间安排</li>
            <li>• 基于难度的优先级建议</li>
            <li>• 实用的学习和执行建议</li>
          </ul>
          <p className="mt-2">
            <strong>生成后您可以：</strong>直接创建冲刺计划，或根据需要调整内容
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
